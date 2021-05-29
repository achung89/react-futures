import { isRendering } from './internal';
import { promiseStatusStore } from './shared-properties';
import { FutureObject } from './internal';
import { FutureArray } from './internal';
import LRU from 'lru-cache';
import { fromArgsToCacheKey, getObjectId } from './fromArgsToCacheKey';
import { LazyArray, species,  } from './internal';
import { DynamicScopeCascade, LazyObject, isFuture, getRaw, toPromise, lazyArray, lazyObject, PushCacheCascade } from './internal';
import React, {unstable_getCacheForType as getCacheForType} from 'react'

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
    
    static map = undefined;
    static tap = undefined;
    static run = undefined;


    constructor(...keys) {
      if (keys.some(key => typeof key === 'object' && key !== null) && isRendering()) {
        throw new Error(`TypeError: key expected to be of type number, string, or undefined inside render, received array or object`)
      }
      const cacheKey = getObjectId(promiseThunk) + fromArgsToCacheKey(keys) + 'Object'
      const cache = DynamicScopeCascade.getDynamicScope() || (isRendering() ? getCacheForType(getCache) :(getCache()))
      const promise = getCachedPromise(() => promiseThunk(...keys), cacheKey, cache)
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
    static map = undefined;
    static tap = undefined;
    static run = undefined;

    constructor(...keys) {
      if (keys.some(key => typeof key === 'object' && key !== null) && isRendering()) {
        throw new Error(`TypeError: key expected to be of type number, string, or undefined inside render, received array or object`)
      };
      const cacheKey = getObjectId(promiseThunk) + fromArgsToCacheKey(keys) + 'Array';
      const cache = DynamicScopeCascade.getDynamicScope() ||( isRendering() ? getCacheForType(getCache) :(   getCache()))
      

      super(getCachedPromise(() => promiseThunk(...keys), cacheKey, cache), cb => PushCacheCascade.of(cb, cache));
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

