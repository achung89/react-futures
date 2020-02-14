import FutureArray from './ArrayResource/FutureArr';
import { memoCache } from './utils';
import { promiseCache } from "./shared-properties/promiseCache";





export const createFutureArray = promiseThunk => {
  const cachedPromise = memoCache(promiseThunk);
  return class extends FutureArray {
    static invalidateCache: () => void;

    constructor() {
      let promise = cachedPromise();
      super(() => {
        const { status, value } = promiseCache.get(promise)
        if(status === 'pending') {
          if(!isRendering()) {
            // TODO: add custom error message per method
            throw new Error("cannot suspend outside render")
          }
          throw promise;
        }
        if(status === 'completed') {
          if(!Array.isArray(value)) {
            throw new Error("TypeError: FutureArray received non-array value from promise")
          }
          return value;
        }
        if(status === 'error') {
          //TODO: more descript error message
          //TODO: should I put error here?
          throw new Error('Unhandled promise exception')
        }
      });

      LazyFutureArray.invalidateCache = promise.invalidate;
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
