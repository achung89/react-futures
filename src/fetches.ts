import { isRendering } from './internal';
import { promiseStatusStore } from './shared-properties';
import { FutureObject } from './internal';
import { FutureArray } from './internal';

import {  isFuture, getRaw, toPromise, lazyArray, lazyObject } from './internal';
import { useRef, useReducer } from 'react';

export { toPromise, lazyArray, lazyObject, getRaw, isFuture }

const initializePromise = promise => {
  promise.then(res => {
    promiseStatusStore.set(promise, { value: res, status: 'complete' });
  });

  promiseStatusStore.set(promise, { value: null, status: 'pending' });
  return promise
}

export class RenderOperationError extends Error {
  constructor(message) {
    super()
    this.name = 'RenderOperationError';
    this.message = message
  }
};

export const fetchArray = url => {
  
}

export const useFetchArray = (requestInfo: RequestInfo, init: RequestInit = {}) => {
  return useFuture(FutureArray, requestInfo, init);
}

export const useFetchObject = (requestInfo: RequestInfo, init: RequestInit = {}) => {
  return useFuture(FutureObject, requestInfo, init);
}

const fetchWithArgs = async (requestInfo: RequestInfo, init: RequestInit = {}) => (await fetch(requestInfo, init)).json()
const throwIfNotGET = method => { if (method !== 'GET') { throw new RenderOperationError('Only GET permitted in render') } }

// TODO: test caching/unmounting logic
const useFuture = (FutureConstructor, requestInfo, requestInit) => {
  const futureCache = useRef({})

  const key = getFetchKey(requestInfo, requestInit);
  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);

  const refetch = () => {
    for (const key of Object.keys(futureCache.current)) {
      futureCache.current[key] = undefined;
    }
    forceUpdate();
  }

  if (!futureCache.current[key]) {
    const promise = initializePromise(fetchWithArgs(requestInfo, requestInit))
    const future = new FutureConstructor(promise)

    futureCache.current[key] = future;
  }
  
  return [futureCache.current[key], refetch] 
}

function getFetchKey(requestInfo: RequestInfo, requestInit: RequestInit) {
  if (requestInfo instanceof Request) {
    throwIfNotGET(requestInfo.method);
    return requestInfo.url;
  }
  else if (typeof requestInfo === 'string') {
    throwIfNotGET(requestInit.method || 'GET');
    return requestInfo;
  }
  else {
    throw TypeError(`Invalid type provided for request info`);
  }
}

