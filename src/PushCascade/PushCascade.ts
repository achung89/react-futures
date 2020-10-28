
import { tap, __internal, isFuture, } from "../internal";

const  deepChain = async (prom, cb) => {
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
  static of = (cb) => {
    try {
      __internal.allowSuspenseOutsideRender = true;
      const newVal = new SuspenseValue(cb());
      __internal.allowSuspenseOutsideRender = false;
      return newVal
    } catch (errOrProm) {
      __internal.allowSuspenseOutsideRender = false;
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
  constructor(val) {
    super()
    valueMap.set(this, val)
  }
  map<K extends genericFunc = genericFunc>(cb: K): SuspenseValue<ReturnType<K>> | SuspenseJob<K> {
    const val = valueMap.get(this)
    return SuspenseCallback.of(() => cb(val));
  }
  tap(cb) {
    return this.map(tap(cb))
  }
  get() {
    return valueMap.get(this)
  }
}

const jobMap = new WeakMap;
const promiseMap = new WeakMap;
export class SuspenseJob<T> extends SuspenseCallback {
  status: 'pending' | 'complete' | 'error';
  val: any;
  
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
          const a = await jobMap.get(newVal);
          return a;
        } else if (newVal instanceof SuspenseValue) {
          const a = newVal.get();
          return a
        } else {
          throw new Error('INTERNAL ERROR')
        }
      } catch (err) {
        throw err;
      }
  }
  map(cb) {
    return new SuspenseJob(this.mapJob(cb))
  }
  tap(cb) {
    return this.map(tap(cb))
  }
  get() {
    if (this.status === 'pending') {
      const a = jobMap.get(this);
      throw a
    }
    if (this.status === 'complete') {
      return this.val
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