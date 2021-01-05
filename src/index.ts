import { isRendering } from './internal';
import { promiseStatusStore } from './shared-properties';
import { FutureObject } from './internal';
import { FutureArray } from './internal';
import LRU from 'lru-cache';
import { fromArgsToCacheKey, getObjectId } from './fromArgsToCacheKey';
import { LazyArray, species,  } from './internal';
import { DynamicScopeCascade, LazyObject, isFuture, getRaw, toPromise, lazyArray, lazyObject, PushCacheCascade } from './internal';

export const futureObject = <T extends object>(promiseThunk) => {
  const cache = new LRU(500);

  if (isRendering()) {
    // TODO: add custom error message per method
    throw new Error('cannot create future outside render');
  }

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
      if (keys.some(key => typeof key === 'object' && key !== null) && isRendering()) {
        throw new Error(`TypeError: key expected to be of type number, string, or undefined inside render, received array or object`)
      }
      const cacheKey = getObjectId(promiseThunk) + fromArgsToCacheKey(keys) + 'Object'
      const promise = getCachedPromise(() => promiseThunk(...keys), cacheKey, DynamicScopeCascade.getDynamicScope() || cache)
      super(promise, cb => PushCacheCascade.of(cb, cache));
    }
  };
};

export const futureArray = <T>(promiseThunk) => {
  const cache = new LRU(500);

  if (isRendering()) {
    // TODO: add custom error message per method
    throw new Error('cannot create cache in render');
  }

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
      const cacheToReset = DynamicScopeCascade.getDynamicScope() || cache;
      cacheToReset.reset()
    }
    static invalidate(...keys) {
      const cacheToDelete = DynamicScopeCascade.getDynamicScope() || cache;

      cacheToDelete.del(JSON.stringify(keys));
    }

    constructor(...keys) {
      if (keys.some(key => typeof key === 'object' && key !== null) && isRendering()) {
        throw new Error(`TypeError: key expected to be of type number, string, or undefined inside render, received array or object`)
      };
      const cacheKey = getObjectId(promiseThunk) + fromArgsToCacheKey(keys) + 'Array';

      super(getCachedPromise(() => promiseThunk(...keys), cacheKey, DynamicScopeCascade.getDynamicScope() || cache), cb => PushCacheCascade.of(cb, cache));
    }
  };
};

export { toPromise, lazyArray, lazyObject, getRaw, isFuture }

function getCachedPromise(promiseThunk: any, key, cache) {
  // console.log(key, cache.has(key))
  // console.log(key, cache)
  if (cache.has(key)) {
    return cache.get(key);
  }
  cache.set(key, promiseThunk());

  const promise = cache.get(key);
  promise.then(res => {
    promiseStatusStore.set(promise, { value: res, status: 'complete' });
  }).catch(err => { throw err });
  promiseStatusStore.set(promise, { value: null, status: 'pending' });

  return promise;
};

