export const pipe = (...fns) => val => fns.reduce( (val, fn) => fn(val), val );
export const tap = fn => val => { fn(val); return val };

export const bindToConstructor = (Class, promise) => {
  return Class.bind(null, promise);
}

// returns result of first call on every subsequent call
export const first = fn => {
  let ran = false;
  let memo = null;
  return (...args) => {
    if(ran) {
      return memo;
    }
    ran = true;
    return memo = fn(...args);
  }
};

export const memoCache = cb => {
  let cache = null;
  function cbWrapper(...args) {
    cache = cache || cb(...args);
    return cache;
  }
  cbWrapper.invalidate = () => {
    cache = null;
  }
  return cbWrapper;
}
type Status = "pending" | "complete" | "error";
export const promiseCache = new WeakMap<Promise<any>, {value: any[] | null, status: Status}>();