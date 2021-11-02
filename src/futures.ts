import { promiseStatusStore } from './shared-properties';
import { FutureObject } from './internal';
import { FutureArray } from './internal';
import { fromArgsToCacheKey, getObjectId } from './fromArgsToCacheKey';
import { LazyArray, species,  } from './internal';
import { LazyObject, isFuture, getRaw, toPromise, lazyArray, lazyObject, PushCacheCascade } from './internal';
import { isReactRendering } from './utils';
import React from 'react';
import {unstable_getCacheForType as getCacheForType} from 'react';
export const getCache = () => new Map();
//TODO: consider if this the best type signature for this function when it becomes generic
const defaultGetCacheKey = (promiseThunk, keys) => getObjectId(promiseThunk) + fromArgsToCacheKey(keys);


// customizeable cache callback
export const futureObject = <T extends object>(promiseThunk, getCacheKey = defaultGetCacheKey) => {
  const getCache = () => new Map();
  if (isReactRendering()) {
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

      const cacheKey = getCacheKey(promiseThunk, keys)
      const cache = PushCacheCascade.getCurrentScope() ?? ( isReactRendering() ? { cache: getCacheForType(getCache), getCache} : { cache: getCache(), getCache: getCache })

      const promise = getCachedPromise(() => promiseThunk(...keys), cacheKey, cache.cache)
      super(promise, cb => PushCacheCascade.of(cb, cache));
    }
  };
};

export const futureArray = <T>(promiseThunk, getCacheKey = defaultGetCacheKey) => {
  const getCache = () => new Map();

  if (isReactRendering()) {
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


      const cacheKey = getCacheKey(promiseThunk, keys)
      const cache = PushCacheCascade.getCurrentScope() ?? (isReactRendering() ? { cache: getCacheForType(getCache), getCache} : { cache: getCache(), getCache: getCache })

      super(getCachedPromise(() => promiseThunk(...keys), cacheKey, cache.cache), cb => PushCacheCascade.of(cb, cache));
    }
  };
};

export { toPromise, lazyArray, lazyObject, getRaw, isFuture }

export const promiseThunkValue = Symbol('promise-thunk')
function getCachedPromise(promiseThunk: any, key, cache) { 
  if (cache.has(key)) {
    return cache.get(key);
  }

  const promise = promiseThunk()
  // for debugging promise
  promise[promiseThunkValue] = promiseThunk;
  cache.set(key, promise);

  promise.then(res => {
    promiseStatusStore.set(promise, { value: res, status: 'complete' });
  }).catch(err => { throw err });
  promiseStatusStore.set(promise, { value: null, status: 'pending' });

  return promise;
};