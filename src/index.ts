import FutureArray from './ArrayResource/FutureArray';
import { memoCache } from './utils';
import { promiseCache } from "./shared-properties/promiseCache";





export const createFutureArray = promiseThunk => {
  const cachedPromise = memoCache(promiseThunk);
  return class extends FutureArray {
    static invalidateCache: () => void;

    constructor() {
      let promise = cachedPromise();
      super(promise);

      FutureArray.invalidateCache = promise.invalidate;
      if(!promiseCache.has(promise)) {
        promise
          .then(res => {
            promiseCache.set(promise, { value: res, status: 'complete' })
          })
          promiseCache.set(promise,  { value: null, status: 'pending'});
      }
    }
  }
};



const a = createFutureArray(() => new Promise((res, rej) => {res(1)}))
