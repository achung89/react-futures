import { memoCache, isRendering } from './utils';
import { promiseStatusStore, keyPromiseStore } from "./shared-properties";
import FutureObject from './FutureObject/TransparentObjectEffect';
import FutureArray from './FutureArray/FutureArray';

export const createFutureObject = <T extends object>(promiseThunk) => {
  const cachedPromise = memoCache(promiseThunk);
  if(isRendering()) {
    // TODO: add custom error message per method
    throw new Error("cannot create future outside render")
  }
  return class FutureObjectCache<A extends object = T> extends FutureObject<A> {
    static invalidate(key) {
      keyPromiseStore.delete(key);
    }
    constructor(key) {
      let promise;
      if(keyPromiseStore.has(key)) {
        promise = keyPromiseStore.get(key);
      } else {
        keyPromiseStore.set(key, cachedPromise(key));
        promise = keyPromiseStore.get(key);
        promise
        .then(res => {
          promiseStatusStore.set(promise, { value: res, status: 'complete' })
        })
        promiseStatusStore.set(promise,  { value: null, status: 'pending'});
      }
      super(promise);
    }
  }
}

export const createFutureArray = <T>(promiseThunk) => {
  const cachedPromise = memoCache(promiseThunk);
  if(isRendering()) {
    // TODO: add custom error message per method
    throw new Error("cannot create future outside render")
  }
   return class FutureArrayCache<A = T> extends FutureArray<A> {
    static invalidate(key) { keyPromiseStore.delete(key) }
    constructor(key) {
      let promise;
      if( keyPromiseStore.has(key) ) {
        promise = keyPromiseStore.get(key);
      } else {
        keyPromiseStore.set(key, cachedPromise(key));
        promise = keyPromiseStore.get(key);

        promise
          .then(res => {
            promiseStatusStore.set(promise, { value: res, status: 'complete' })
          })
        promiseStatusStore.set(promise,  { value: null, status: 'pending'});
      }
      super(promise);
    }
  }
};