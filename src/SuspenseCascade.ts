const resolveCb = (cb) => {
  try {
    return new SuspenseValue(cb())
  } catch (errOrProm) {
    if (typeof errOrProm.then === 'function') {
      return new SuspenseJob((async () => {
        await errOrProm;
        return resolveCb(cb);
      })())
    } else {
      throw errOrProm
    }
  }
}
const valueMap = new WeakMap;

class SuspenseValue {
  val: any;
  constructor(val) {
    valueMap.set(this, val)
  }
  map(cb) {
    return resolveCb(cb.bind(null, valueMap.get(this)));
  }
  get() {
    return valueMap.get(this)
  }
}
const jobMap = new WeakMap;
class SuspenseJob {
  promise: Promise<any>
  status: 'pending' | 'complete'
  val: any
  constructor(prom) {
    this.status = 'pending'
    jobMap.set(this, prom)

    this.promise = (async () => {
      try {
        let val = await jobMap.get(this)
        while(val instanceof SuspenseJob || val instanceof SuspenseValue) {
          if (val instanceof SuspenseJob) {
            val = await val.promise;
          }
          if(val instanceof SuspenseValue) {
            val = val.get()
          }
        }
        this.val = val;
        return val;
      } finally {
        this.status = 'complete'
      }
    })()
  }
  map(cb) {
    return new SuspenseJob((async () => {
      const val = await jobMap.get(this)
      return resolveCb(cb.bind(null, val))
    })())
  }
  get() {
    if(this.status === 'pending') {
      throw this.promise;
    }
    if(this.status === 'complete') {
      return this.val
    }
    throw new Error("INVALID STATUS")
  }
}

const pending = Symbol('pending')



const SuspenseCascade = (cb) => {
  const suspenseTask = resolveCb(cb)
  return suspenseTask
}
export default SuspenseCascade