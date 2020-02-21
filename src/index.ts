import { memoCache, isRendering } from './utils';
import { promiseStatusCache, keyPromiseCache } from "./shared-properties";
import FutureObj from './FutureObject/TransparentObjectEffect';
import FutureArray from './FutureArray/FutureArray';

export const createFutureObject = <T extends object>(promiseThunk) => {
  const cachedPromise = memoCache(promiseThunk);
  return class extends FutureObj<T> {
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
        if(status === 'complete') {
          if(typeof value === 'object' && value !== null && !Array.isArray(value)) {
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

      this.constructor.invalidateCache = promise.invalidate;
      if(!promiseCache.has(promise)) {
        promise
          .then(res => {
            promiseCache.set(promise, { value: res, status: 'complete' })
          })
          promiseCache.set(promise,  { value: null, status: 'pending'});
      }
    }
  }
}
export const createFutureArray = <T>(promiseThunk) => {
  const cachedPromise = memoCache(promiseThunk);
   return class FutureArrayCache<A = T> extends FutureArray<A> {
    static invalidate(key) {
      keyPromiseCache.delete(key);
    }
    constructor(key) {
      let promise;
      if(keyPromiseCache.has(key)) {
        promise = cachedPromise(key);
      } else {
        keyPromiseCache.set(key, cachedPromise(key));
        promise = keyPromiseCache.get(key);
        promise
        .then(res => {
          promiseStatusCache.set(promise, { value: res, status: 'complete' })
        })
        promiseStatusCache.set(promise,  { value: null, status: 'pending'});
      }
      super(promise);
    }
  }
};