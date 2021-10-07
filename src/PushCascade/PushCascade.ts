
import {  __internal,  isFuture, } from "../internal";
import { unstable_getCacheForType as getCacheForType } from "react";
import { isReactRendering } from "../internal";

type CacheScope = {
  cache: Map<string, Promise<any>> | null;
  getCache: () => Map<string, Promise<any>>;
} | undefined;

const getCache = (cacheScope) => isReactRendering()
? {
    cache: getCacheForType(cacheScope.getCache),
    getCache: cacheScope.getCache,
  }
: cacheScope;

let globalCacheScope;
const createCacheScope = (cb, cacheScope: CacheScope ) => {
  
  let tempScopVal = globalCacheScope;

  try {
    globalCacheScope =  cacheScope;
    
    return cb();
  } finally {
    globalCacheScope = tempScopVal;
  }
}

const deepChain = async (prom, cb, cacheScope) => {
  try {
    await prom;
    let newVal = PushCascade.of(cb, cacheScope)
    
    while(newVal instanceof PushCascade) {
      if (newVal instanceof SuspenseJob) {
        const promise = jobMap.get(newVal);
        newVal = await promise
      } else if (newVal instanceof SuspenseValue) {
        try{
          __internal.suspenseHandlerCount++
          newVal = newVal.get();
          __internal.suspenseHandlerCount--
        } catch(errOrProm) {
          __internal.suspenseHandlerCount--
          if(typeof errOrProm.then === 'function') {
            await errOrProm;
            continue;
          }
          throw errOrProm;
        }
      } else {
        throw new Error('INTERNAL ERROR')
      }
    }

    return newVal;
  } catch (err) {
    throw err;
  }
}

abstract class PushCascade {
  abstract map(fn: Function): PushCascade;
  abstract get(): any;
  get functor() {
    return PushCascade.of
  }
  static of = (cb, instanceCacheScope: CacheScope) => {

    try {
      __internal.suspenseHandlerCount++
      const newVal = new SuspenseValue(createCacheScope(cb, instanceCacheScope), instanceCacheScope);
      
      __internal.suspenseHandlerCount--;
      return newVal
    } catch (errOrProm) {
      __internal.suspenseHandlerCount--;
      if (typeof errOrProm.then === 'function') {
        
        return new SuspenseJob(deepChain(errOrProm, cb, instanceCacheScope), instanceCacheScope);
      } else {
        throw errOrProm
      }
    } 
  }
  static getCurrentScope() {
    return globalCacheScope
  }
}

const valueMap = new WeakMap;

type genericFunc = (...args: any) => any

export class SuspenseValue<T = any> extends PushCascade {
  val: T;
  status: 'complete' | 'pending' | 'error';
  error: Error;
  #cacheScope: CacheScope;
  #instantiated: "inside-render" | "outside-render";
  constructor(val, instanceCacheScope) {
    super()
    this.#instantiated = isReactRendering() ? 'inside-render' : 'outside-render'
    this.#cacheScope = instanceCacheScope
    this.status = 'complete';
    valueMap.set(this, val)
  }

  map<K extends genericFunc = genericFunc>(cb: K): SuspenseValue<ReturnType<K>> | SuspenseJob<K> {
    const cacheScope = getCache(this.#cacheScope)

    const val = valueMap.get(this)

    return PushCascade.of(() => cb(val), cacheScope);
  }

  get() {
    if(this.status === 'complete') {
      return valueMap.get(this)
    } else if(this.status === 'pending') {
      throw jobMap.get(this)
    } else if(this.status === 'error') {
      throw this.error
    }
  }
}


const jobMap = new WeakMap;
const promiseMap = new WeakMap;
export class SuspenseJob<T> extends PushCascade {
  status: 'pending' | 'complete' | 'error';
  val: any;
  error: Error;
  #cacheScope: CacheScope
  #instantiated: "inside-render" | "outside-render";
  constructor(promise, cacheScope) {
    super();
    this.#instantiated = isReactRendering() ? 'inside-render' : 'outside-render'

    this.#cacheScope = cacheScope
    this.status = 'pending'
    promiseMap.set(promise,this)
    jobMap.set(this, this.createJob(promise))
  }
  async createJob(promise) {
    try {
       this.val = await promise;
       return this.val;
    } catch (err) {
      this.status = 'error'
      this.error = err;
      throw err
    } finally {
      if (this.status !== 'error') {
        this.status = 'complete'
      }
    }
  }

  async mapJob(cb, cacheScope) {
      try {
        const val = await jobMap.get(this)

        let newVal = PushCascade.of(() => cb(val), cacheScope)


        if(isFuture(newVal)) {
          return newVal
        }

        if (newVal instanceof SuspenseJob) {
          return jobMap.get(newVal);
        } else if (newVal instanceof SuspenseValue) {

          while(true) {

            try {
              __internal.suspenseHandlerCount++;
              return newVal.get();
            } catch (errOrProm) {
              if(errOrProm.then === 'function') {
                await errOrProm;
                continue;
              }
              throw errOrProm
            } finally {
              __internal.suspenseHandlerCount--;
            }
          }
        } else {
          throw new Error('INTERNAL ERROR')
        }
      } catch (err) {
        throw err;
      }
  }

  map(cb) {
    const cacheScope = getCache(this.#cacheScope)
    if(this.status === 'complete') {
      return PushCascade.of(() => cb(this.val), cacheScope);
    } 
    if (this.status === 'error') {
      throw this.error;
    }
    if(this.status === 'pending') {
      return new SuspenseJob(this.mapJob(cb, cacheScope), cacheScope)
    }
    throw new Error("INVALID STATUS")
  }

  get() {

    if (this.status === 'pending') {
      throw jobMap.get(this)
    }

    if (this.status === 'complete') {
      return this.val
    }

    if(this.status === 'error') {
      throw this.error
    }

    throw new Error("INVALID STATUS")
  }
}

type ScopeVal = {
  cache: Map<string, Promise<any>> | null;
  getCache: () => Map<string, Promise<any>>;
} | undefined;


export { PushCascade }