import { isRendering } from './internal';
import { promiseStatusStore } from './shared-properties';
import { FutureObject } from './internal';
import { FutureArray } from './internal';
import LRU from 'lru-cache';
import { LazyArray, species } from './internal';
import { LazyObject, isFuture, getRaw, toPromise, lazyArray, lazyObject } from './internal';

export const futureObject = <T extends object>(promiseCb) => {
  const cache = new LRU(500);

  if (isRendering()) {
    // TODO: add custom error message per method
    throw new Error('cannot create future outside render');
  }
  const getCachedPromise = keys => {
    const key = JSON.stringify(keys);
    if (cache.has(key)) {
      return cache.get(key);
    }
    cache.set(key, promiseCb(...keys));

    const promise = cache.get(key);
    promise.then(res => {
      promiseStatusStore.set(promise, { value: res, status: 'complete' });
    });
    promiseStatusStore.set(promise, { value: null, status: 'pending' });

    return promise;
  };

  return class FutureObjectCache<A extends object = T> extends FutureObject<A> {
    static get [species]() {
      return LazyObject;
    }
    static of(...args) {
      return new FutureObjectCache(...args);
    }
    static map = undefined;
    static tap = undefined;
    static run = undefined;
    static invalidate(...keys) {
      cache.del(JSON.stringify(keys));
    }
    static reset() {
      cache.reset();
    }
    constructor(...keys) {
      if(keys.some(key =>typeof key === 'object' && key !== null)) {
        throw new Error(`TypeError: key expected to be of type number, string, or undefined, received array or object`)
      }
      super(getCachedPromise(keys));
    }
  };
};

export const futureArray = <T>(promiseCb) => {
  const cache = new LRU(500);

  if (isRendering()) {
    // TODO: add custom error message per method
    throw new Error('cannot create cache in render');
  }
  const getCachedPromise = keys => {
    const key = JSON.stringify(keys);
    if (cache.has(key)) {
      return cache.get(key);
    }


    cache.set(key, promiseCb(...keys));

    const promise = cache.get(key);
    promise.then(res => {
      promiseStatusStore.set(promise, { value: res, status: 'complete' });
    });
    promiseStatusStore.set(promise, { value: null, status: 'pending' });

    return promise;
  };

  return class FutureArrayCache<A = T> extends FutureArray<A> {
    static get [species]() {
      return LazyArray;
    }
    static of(...args) {
      return new FutureArrayCache(...args);
    }
    static map = undefined;
    static tap = undefined;
    static run = undefined;
    static reset() {
      cache.reset();
    }
    static invalidate(...keys) {
      cache.del(JSON.stringify(keys));
    }
    constructor(...keys) {
      if(keys.some(key => typeof key === 'object' && key !== null)) {
        throw new Error(`TypeError: key expected to be of type number, string, or undefined, received array or object}`)
      };
      super(getCachedPromise(keys));
    }
  };
};

export { toPromise, lazyArray, lazyObject, getRaw, isFuture }