import { promiseStatusStore } from './shared-properties';
import { FutureObject } from './internal';
import { FutureArray } from './internal';
import { fromArgsToCacheKey, getObjectId } from './fromArgsToCacheKey';
import { LazyArray,   } from './internal';
import { LazyObject, isFuture, getRaw, toPromise, futureArray, futureObject, SuspenseCascade } from './internal';
import { isReactRendering } from './utils';
import {unstable_getCacheForType as getCacheForType} from 'react';
import { initiateArrayPromise, initiateObjectPromise } from './initiatePromise';

export const getCache = () => new Map();
//TODO: consider if this the best type signature for this function when it becomes generic
const defaultGetCacheKey = (promiseThunk, keys) => getObjectId(promiseThunk) + fromArgsToCacheKey(keys);
// TODO: strongly type
// futures should handle suspense 
// customizeable cache callback
export const createObjectFactory = <T extends object>(promiseThunk, getCacheKey = defaultGetCacheKey) => {
  const getCache = () => new Map();
  if (isReactRendering()) {
    // TODO: add custom error message per method
    throw new Error('cannot create future outside render');
  }

  return class FutureObjectCache<A extends object = T> extends FutureObject<A> {


    static of(...args) {
      return new FutureObjectCache(...args);
    }


    constructor(...keys) {
      const cache = SuspenseCascade.getCurrentScope() ?? ( isReactRendering() ? { cache: getCacheForType(getCache), getCache} : { cache: getCache(), getCache: getCache })

      const cacheKey = getCacheKey(promiseThunk, keys)

      const promise = getCachedPromise(() => promiseThunk(...keys), cacheKey, cache.cache);

      super(SuspenseCascade.of(initiateObjectPromise(promise), cache));
    }
  };
};

export const createArrayFactory = <T>(promiseThunk, getCacheKey = defaultGetCacheKey) => {
  const getCache = () => new Map();

  if (isReactRendering()) {
    // TODO: add custom error message per method
    throw new Error('cannot create cache in render');
  }

  return class FutureArrayCache<A = T> extends FutureArray<A> {
    static of(...args) {
      return new FutureArrayCache(...args);
    }

    constructor(...keys) {
      const cache = SuspenseCascade.getCurrentScope() ?? ( isReactRendering() ? { cache: getCacheForType(getCache), getCache} : { cache: getCache(), getCache: getCache })
      
      const cacheKey = getCacheKey(promiseThunk, keys)
      const promise = getCachedPromise(() => promiseThunk(...keys), cacheKey, cache.cache)
      super(SuspenseCascade.of(initiateArrayPromise(promise), cache));
    }
  };
};

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