
import {  tapper, __internal, isRendering, isFuture, SuspendOperationOutsideRenderError } from "../internal";

function Mutators() {
  let next;
  let cbs = new Set<() => any>();
  let resolveQueueExhaust;
  let queueExhaustPromise;
  (async() => {
    try {
    while(true) {
      for(const cb of cbs) {
        while(true) {
          try {
            cb();
            cbs.delete(cb);
            if(queueExhaustPromise && resolveQueueExhaust) {
              resolveQueueExhaust();
              resolveQueueExhaust = null;
              queueExhaustPromise = null;
            }
            break;
          } catch(errOrProm) {
            if(typeof errOrProm.then === 'function') {
              await errOrProm;
              continue;
            }
          }
        }
      }
      await new Promise((res, rej) => {
        next = res;
      })
    }
  } catch(errOrProm) {
    throw errOrProm
  }
  })();

  return {
    add(cb) {
      cbs.add(cb)
      
      if(next) {
        next();
        next = undefined;
      }
    },
    get size() {
      return cbs.size
    },
    exhaustQueue() {
       if(queueExhaustPromise) {
         return queueExhaustPromise;
        } else {
         return queueExhaustPromise = new Promise((res, rej) => {
          resolveQueueExhaust = res;
        })
      }
    }
  };
}
const waitForMutableDeps = async deps => {
  for(const prom of deps) {
    await prom;
    deps.delete(prom);
  }
}

const deepChain = async (prom, cb) => {
  try {
    await prom;
    let newVal = SuspenseCallback.of(cb);
    while(newVal instanceof SuspenseCallback) {
      if (newVal instanceof SuspenseJob) {
        const promise = jobMap.get(newVal);
        newVal = await promise
      } else if (newVal instanceof SuspenseValue) {
        newVal = newVal.get();
      } else {
        throw new Error('INTERNAL ERROR')
      }
    }

    return newVal;
  } catch (err) {
    throw err;
  }
}

abstract class SuspenseCallback {
  abstract map(fn: Function): SuspenseCallback;
  abstract get(): any;

  get functor() {
    return PushCascade.of
  }
  static of = cb => {
    try {
      __internal.suspenseHandlerCount++
      const newVal = new SuspenseValue(cb());
      __internal.suspenseHandlerCount--;
      return newVal
    } catch (errOrProm) {
      __internal.suspenseHandlerCount--;
      if (typeof errOrProm.then === 'function') {
        return new SuspenseJob(deepChain(errOrProm, cb));
      } else {
        throw errOrProm
      }
    }
  }
}

const valueMap = new WeakMap;

type genericFunc = (...args: any) => any

class SuspenseValue<T = any> extends SuspenseCallback {
  val: T;
  status: 'complete' | 'pending' | 'error';
  error: Error;
  mutators: ReturnType<typeof Mutators>
  constructor(val) {
    super()
    this.status = 'complete';
    this.mutators = Mutators();
    valueMap.set(this, val)
  }
  map<K extends genericFunc = genericFunc>(cb: K): SuspenseValue<ReturnType<K>> | SuspenseJob<K> {
    const val = valueMap.get(this)
    return SuspenseCallback.of(() => cb(val));
  }

  tap(cb) {
    const val = valueMap.get(this)
    this.mutators.add(() => cb(val));
    return this;
  }
  get() {
    if(this.mutators.size > 0) {
      throw this.mutators.exhaustQueue()
    }
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
export class SuspenseJob<T> extends SuspenseCallback {
  status: 'pending' | 'complete' | 'error';
  val: any;
  error: Error;
  mutatorSet: Set<Promise<any>>;
  constructor(promise) {
    super();
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

  async mapJob(cb) {
      try {
        const val = await jobMap.get(this)

        let newVal = SuspenseCallback.of(() => cb(val))

        if(isFuture(newVal)) {
          return newVal
        }

        if (newVal instanceof SuspenseJob) {
          return jobMap.get(newVal);
        } else if (newVal instanceof SuspenseValue) {

          while(true) {

            try {
              return newVal.get();

            } catch (errOrProm) {
              if(errOrProm.then === 'function') {
                await errOrProm;
                continue;
              }
              throw errOrProm
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
    if(this.status === 'complete') {
      return SuspenseCallback.of(() => cb(this.val));
    } 
    if (this.status === 'error') {
      throw this.error;
    }
    if(this.status === 'pending') {
      return new SuspenseJob(this.mapJob(cb))
    }
    throw new Error("INVALID STATUS")
  }

  async tapJob(mutatorSet) {
    try {
    let val = await jobMap.get(this)

    for(const cb of mutatorSet) {

      while(true) {

        try{
          val = cb(val);
          mutatorSet.delete(cb);

          break;
        } catch(errOrProm) {

          if(typeof errOrProm.then === 'function') {
            await errOrProm;
            continue;
          }

          throw errOrProm;
        }
      }
    }
  } catch(err) {
    throw err;
  }
  }
  tap(cb) {

    if(this.mutatorSet) {
      this.mutatorSet.add(cb);

    } else {
      this.mutatorSet = new Set([cb]);
      jobMap.set(this, this.tapJob(this.mutatorSet))
    }

    return this;
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


const PushCascade = {
  of: cb => {
    const suspenseTask = SuspenseCallback.of(cb)
    return suspenseTask
  },
  
}
export { PushCascade }