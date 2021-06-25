import { isRendering } from './internal';
import { promiseStatusStore } from './shared-properties';
import { FutureObject } from './internal';
import { FutureArray } from './internal';
import { fromArgsToCacheKey, getObjectId } from './fromArgsToCacheKey';
import { LazyArray, species,  } from './internal';
import { DynamicScopeCascade, LazyObject, isFuture, getRaw, toPromise, lazyArray, lazyObject, PushCacheCascade } from './internal';
import {unstable_getCacheForType as getCacheForType} from 'react'
import { isDomRendering, isReactRendering } from './utils';

export const getCache = () => new Map();

export const futureObject = <T extends object>(promiseThunk) => {

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
    

    constructor(...keys) {
      if (keys.some(key => typeof key === 'object' && key !== null) && isRendering()) {
        throw new Error(`TypeError: key expected to be of type number, string, or undefined inside render, received array or object`)
      }
      const cacheKey = getObjectId(promiseThunk) + fromArgsToCacheKey(keys) + 'Object'
      const cache = DynamicScopeCascade.getDynamicScope().cache ? DynamicScopeCascade.getDynamicScope() : (isReactRendering()? {cache: getCacheForType(getCache), cacheCb: getCache }: { cache: getCache(), cacheCb: getCache})
      const promise = getCachedPromise(() => promiseThunk(...keys), cacheKey, cache.cache)
      super(promise, cb => PushCacheCascade.of(cb, cache));
    }
  };
};

export const futureArray = <T>(promiseThunk) => {

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

    constructor(...keys) {
      if (keys.some(key => typeof key === 'object' && key !== null) && isRendering()) {
        throw new Error(`TypeError: key expected to be of type number, string, or undefined inside render, received array or object`)
      };

      const cacheKey = getObjectId(promiseThunk) + fromArgsToCacheKey(keys) + 'Array';
      const cache = DynamicScopeCascade.getDynamicScope().cache ? DynamicScopeCascade.getDynamicScope() : (isReactRendering() ? {cache: getCacheForType(getCache), cacheCb: getCache }: { cache: getCache(), cacheCb: getCache})

      super(getCachedPromise(() => promiseThunk(...keys), cacheKey, cache.cache), cb => PushCacheCascade.of(cb, cache));
    }
  };
};

export { toPromise, lazyArray, lazyObject, getRaw, isFuture }

function getCachedPromise(promiseThunk: any, key, cache) {    
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