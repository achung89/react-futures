

export const resolveCb = (cb) => {
  try {
    return new SuspenseValue(cb())
  } catch (errOrProm) {
    if (typeof errOrProm.then === 'function') {
      return new SuspenseJob((async () => {
        try {
          await errOrProm;
          return resolveCb(cb);
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

type genericFunc = (...args:any) => any
class SuspenseValue<T = any> {
  val: T;
  constructor(val) {
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
export class SuspenseJob<T> {
  status: 'pending' | 'complete' | 'error'
  val: any
  constructor(prom) {
    this.status = 'pending'

    jobMap.set(this, (async () => {
      try {
        let val = await prom
        while(val instanceof SuspenseJob || val instanceof SuspenseValue) {
          if (val instanceof SuspenseJob) {
            val = await jobMap.get(val);
          }
          if(val instanceof SuspenseValue) {
            val = val.get()
          }
        }
        this.val = val;
        return val;
      } catch(err) {
        this.status = 'error'
        throw err
      } finally {
        if(this.status !== 'error') {
          this.status = 'complete'
        }
      }
    })())
  }
  map(cb) {
    return new SuspenseJob((async () => {
      try {
        const val = await jobMap.get(this)
        
        return resolveCb(cb.bind(null, val))
      } catch(err) {
        throw err;
      }

    })())
  }
  get() {
    if(this.status === 'pending') {
      throw jobMap.get(this);
    }
    if(this.status === 'complete') {
      return this.val
    }
    throw new Error("INVALID STATUS")
  }
}


const SuspenseCascade = cb => {
  const suspenseTask = resolveCb(cb)
  return suspenseTask
}
export default SuspenseCascade