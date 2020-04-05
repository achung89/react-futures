import { isRendering } from './internal';
import { promiseStatusStore } from "./shared-properties";
import {FutureObject} from './internal';
import {FutureArray} from './internal';
import LRU from 'lru-cache';
import {TransparentArrayEffect} from './internal';
import {TransparentObjectEffect} from './internal';


export const createFutureObject = <T extends object>(promiseCb) => {
  const cache = new LRU(500);

  if(isRendering()) {
    // TODO: add custom error message per method
    throw new Error("cannot create future outside render")
  }

  return class FutureObjectCache<A extends object = T> extends FutureObject<A> {
    static get [Symbol.species]() { return TransparentObjectEffect; }

    static invalidate(key) {
      cache.del(key);
    }
    static reset() {
      cache.reset();
    }
    constructor(key) {
      let promise;
      if(cache.has(key)) {
        promise = cache.get(key);
      } else {
        cache.set(key, promiseCb(key));
        promise = cache.get(key);
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

export const createFutureArray = <T>(promiseCb) => {
  const cache = new LRU(500);

  if(isRendering()) {
    // TODO: add custom error message per method
    throw new Error("cannot create cache in render")
  }
   return class FutureArrayCache<A = T> extends FutureArray<A> {
    static get [Symbol.species]() { return TransparentArrayEffect; }

    static reset() {
      cache.reset();
    }
    static invalidate(key) { cache.del(key) }
    constructor(key) {
      let promise;
      if( cache.has(key) ) {
        promise = cache.get(key);
      } else {
        cache.set(key, promiseCb(key));
        promise = cache.get(key);
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