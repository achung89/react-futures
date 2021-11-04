
import {  isFuture, getRaw, toPromise, lazyArray, lazyObject } from './internal';
import { futureArray, futureObject } from './futures';

export { toPromise, lazyArray, lazyObject, getRaw, isFuture }


export class RenderOperationError extends Error {
  constructor(message) {
    super()
    this.name = 'RenderOperationError';
    this.message = message
  }
};

const throwIfNotGET = method => { if (method !== 'GET') { throw new RenderOperationError('Only GET permitted in render') } }


// TODO: create then continuation
// TODO: accept callback into requestInfo or requestInit
const glob = window || global || globalThis;
const createFetchJson = () => async (requestInfo, requestInit = {}) => {
  try {
    const res = await glob.fetch(requestInfo, requestInit);
    const body = await res.json();
    return body;
  } catch(err) {
    console.error(err);
    throw err;    
  }

}

const FetchArray = futureArray(createFetchJson(), getFetchKey);
const FetchObject = futureObject(createFetchJson(), getFetchKey);

export const fetchArray = (requestInfo, requestInit = {}, config) => {
  return lazyArray(() => {
    if(typeof requestInfo === 'function') {
      requestInfo = requestInfo()
    }
    const val = FetchArray.of(requestInfo, requestInit); 
    return val;
  })
}

export const fetchObject =  (requestInfo, requestInit = {}, config) => {
  return lazyObject(() => {

    if(typeof requestInfo === 'function') {
      requestInfo = requestInfo()
    }

    return FetchObject.of(requestInfo, requestInit); 
  })
}

function getFetchKey(_promise, [requestInfo, requestInit]) {
  try {
    if (requestInfo instanceof Request) {
      throwIfNotGET(requestInfo.method);
      return requestInfo.url;
    }
    else if (typeof requestInfo === 'string') {
      throwIfNotGET(requestInit?.method || 'GET');
      return requestInfo;
    }

    throw TypeError(`Invalid type provided for request info`);

  } catch(err) {
    console.error(err);
    throw err;
  }
}

