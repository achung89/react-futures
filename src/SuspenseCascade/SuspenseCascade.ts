
abstract class SuspenseCallback {
  abstract map(fn: Function): SuspenseCallback;
  abstract get(): any;
}

export const resolveCb = (cb) => {
  try {
    return new SuspenseValue(cb())
  } catch (errOrProm) {
    if (typeof errOrProm.then === 'function') {
      return new SuspenseJob((async () => {
        try {
          await errOrProm;
          let newVal = resolveCb(cb);

          
          while(newVal instanceof SuspenseCallback ) {
            if (newVal instanceof SuspenseJob) {
              newVal = await jobMap.get(newVal);
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

      })())
    } else {
      throw errOrProm
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
    return resolveCb(cb.bind(null, valueMap.get(this)));
  }
  get() {
    return valueMap.get(this)
  }
}

const jobMap = new WeakMap;
export class SuspenseJob<T> extends SuspenseCallback {
  status: 'pending' | 'complete' | 'error'
  val: any
  constructor(prom) {
    super();
    this.status = 'pending'

    jobMap.set(this, (async () => {
      try {
        let val = await prom

        this.val = val;
        return val;
      } catch (err) {
        this.status = 'error'
        throw err
      } finally {
        if (this.status !== 'error') {
          this.status = 'complete'
        }
      }
    })())
  }
  map(cb) {
    return new SuspenseJob((async () => {
      try {
        const val = await jobMap.get(this)

        let newVal = resolveCb(cb.bind(null, val))
        if (newVal instanceof SuspenseJob) {
          return jobMap.get(newVal);
        } else if (newVal instanceof SuspenseValue) {
          return newVal.get();
        } else {
          throw new Error('INTERNAL ERROR')
        }
      } catch (err) {
        throw err;
      }

    })())
  }
  get() {
    if (this.status === 'pending') {
      throw jobMap.get(this);
    }
    if (this.status === 'complete') {
      return this.val
    }
    throw new Error("INVALID STATUS")
  }
}


const SuspenseCascade = {
  of: cb => {
    const suspenseTask = resolveCb(cb)
    return suspenseTask
  }
}
export default SuspenseCascade