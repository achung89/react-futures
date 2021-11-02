import { isFuture } from "../internal";
import { unstable_getCacheForType as getCacheForType } from "react";
import { isReactRendering } from "../internal";
import { ThrowablePromise } from "../ThrowablePromise/ThrowablePromise";

type CacheScope =
  | {
      cache: Map<string, Promise<any>> | null;
      getCache: () => Map<string, Promise<any>>;
    }
  | undefined;

const getCache = (cacheScope) =>
  isReactRendering()
    ? {
        cache: getCacheForType(cacheScope.getCache),
        getCache: cacheScope.getCache,
      }
    : cacheScope;

let globalCacheScope;
const createCacheScope = (cb, cacheScope: CacheScope) => {
  let tempScopVal = globalCacheScope;

  try {
    globalCacheScope = cacheScope;

    return cb();
  } finally {
    globalCacheScope = tempScopVal;
  }
};

const deepChain = async (prom, cb, cacheScope) => {
  try {
    await prom;
    let newVal = PushCascade.of(cb, cacheScope);

    while (newVal instanceof PushCascade) {
      if (newVal instanceof SuspenseJob) {
        const promise = jobMap.get(newVal);
        newVal = await promise;
      } else if (newVal instanceof SuspenseValue) {
        try {
          newVal = newVal.get();
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            await errOrProm;
            continue;
          }
          throw errOrProm;
        }
      } else {
        throw new Error("INTERNAL ERROR");
      }
    }

    return newVal;
  } catch (err) {
    throw err;
  }
};

abstract class PushCascade {
  abstract map(fn: Function): PushCascade;
  abstract get(): any;
  get functor() {
    return PushCascade.of;
  }
  static of = (cb, instanceCacheScope: CacheScope) => {
    try {
      const newVal = new SuspenseValue(
        createCacheScope(cb, instanceCacheScope),
        instanceCacheScope
      );
      return newVal;
    } catch (errOrProm) {
      if (typeof errOrProm.then === "function") {
        return new SuspenseJob(() =>
          deepChain(errOrProm, cb, instanceCacheScope),
          instanceCacheScope
        );
      }

      throw errOrProm;
    }
  };

  static getCurrentScope() {
    return globalCacheScope;
  }
}

type genericFunc = (...args: any) => any;

export class SuspenseValue<T = any> extends PushCascade {
  val: T;
  status: "complete" | "pending" | "error";
  error: Error;
  #cacheScope: CacheScope;
  value: any;
  constructor(val, instanceCacheScope) {
    super();

    this.#cacheScope = instanceCacheScope;
    this.status = "complete";
    this.value = val;
  }

  map<K extends genericFunc = genericFunc>(
    cb: K
  ): SuspenseValue<ReturnType<K>> | SuspenseJob<K> {
    const cacheScope = getCache(this.#cacheScope);

    const val = this.value;

    return PushCascade.of(() => cb(val), cacheScope);
  }

  get() {
    if (this.status === "complete") {
      return this.value;
    } else if (this.status === "pending") {
      throw new ThrowablePromise(jobMap.get(this));
    } else if (this.status === "error") {
      throw this.error;
    }
    throw new Error("Invalid status");
  }
}

const jobMap = new WeakMap();
export class SuspenseJob<T> extends PushCascade {
  status: "pending" | "complete" | "error";
  val: any;
  error: Error;
  #cacheScope: CacheScope;
  #promise: Promise<any>;
  #promiseThunk: () => Promise<any>;
  constructor(promiseThunk, cacheScope) {
    super();

    this.#cacheScope = cacheScope;
    this.status = "pending";
    this.#promise = promiseThunk();
    this.#promiseThunk = promiseThunk;
    jobMap.set(this, this.createJob());
  }
  async createJob() {

    try {
      while(true) {
        try {
          this.val = await this.#promise;
          return this.val;
        } catch (errOrProm) {
          
          if(typeof errOrProm.then === 'function') {
            await errOrProm;
            this.#promise = this.#promiseThunk();
            continue;
          }
          this.error = errOrProm;
          this.status = 'error';
          break;
        }
      }
    } finally {
      if (this.status !== "error") {
        this.status = "complete";
      }
    }
  }

  async mapJob(cb, cacheScope) {
    try {
      const val = await jobMap.get(this);
      const newVal = PushCascade.of(() => cb(val), cacheScope);

      if (isFuture(newVal)) {
        return newVal;
      }

      if (newVal instanceof SuspenseJob) {
        return jobMap.get(newVal);
      } else if (newVal instanceof SuspenseValue) {
        while (true) {
          try {
            return newVal.get();
          } catch (errOrProm) {
            if (typeof errOrProm.then === "function") {
              await errOrProm;
              continue;
            }
            throw errOrProm;
          }
        }
      } else {
        throw new Error("INTERNAL ERROR");
      }
    } catch (err) {
      throw err;
    }
  }

  map(cb) {
    const cacheScope = getCache(this.#cacheScope);
    if (this.status === "complete") {
      return PushCascade.of(() => cb(this.val), cacheScope);
    }

    if (this.status === "error") {
      throw this.error;
    }

    if (this.status === "pending") {

      return new SuspenseJob(() => this.mapJob(cb, cacheScope), cacheScope);
    }

    throw new Error("INVALID STATUS");
  }

  get() {
    if (this.status === "pending") {

      throw new ThrowablePromise(jobMap.get(this));
    }

    if (this.status === "complete") {
      return this.val;
    }

    if (this.status === "error") {
      throw this.error;
    }

    throw new Error("INVALID STATUS");
  }
}


export { PushCascade };
