import { isRendering } from './internal';
import { promiseStatusStore } from './shared-properties';
import { FutureObject } from './internal';
import { FutureArray } from './internal';
import LRU from 'lru-cache';
import { LazyArray, species } from './internal';
import { LazyObject, isFuture } from './internal';

export const futureObject = <T extends object>(promiseCb) => {
  const cache = new LRU(500);

  if (isRendering()) {
    // TODO: add custom error message per method
    throw new Error('cannot create future outside render');
  }
  const getCachedPromise = key => {
    if (cache.has(key)) {
      return cache.get(key);
    }
    cache.set(key, promiseCb(key));

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
    static map = undefined;
    static tap = undefined;
    static run = undefined;
    static invalidate(key) {
      cache.del(key);
    }
    static reset() {
      cache.reset();
    }
    constructor(key) {
      // TODO: defer suspension if key is future
      // if(isFuture(key)) {
      //   return new LazyObject(() => {
      //     const promise = getCachedPromise(key);
      //     return new FutureObject(promise);
      //   });
      // }
      const promise = getCachedPromise(key);
      super(promise);
    }
  };
};

export const futureArray = <T>(promiseCb) => {
  const cache = new LRU(500);

  if (isRendering()) {
    // TODO: add custom error message per method
    throw new Error('cannot create cache in render');
  }
  const getCachedPromise = key => {
    if (cache.has(key)) {
      return cache.get(key);
    }
    cache.set(key, promiseCb(key));

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
    static map = undefined;
    static tap = undefined;
    static run = undefined;
    static reset() {
      cache.reset();
    }
    static invalidate(key) {
      cache.del(key);
    }
    constructor(key) {
      // TODO: defer suspension if key is future
      // if(isFuture(key)) {
      //   return new LazyArray(() => {
      //     const promise = getCachedPromise(key);
      //     return new FutureArray(promise);
      //   });
      // }
      const promise = getCachedPromise(key);
      super(promise);
    }
  };
};
