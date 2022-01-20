
import {  isFuture, getRaw, toPromise, futureArray, futureObject } from './internal';
import { createObjectResource, createArrayResource } from './resources/resources';



const getFetchKey = (_promise, [requestInfo, requestInit])  => {

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



export class RenderOperationError extends Error {
  constructor(message) {
    super()
    this.name = 'RenderOperationError';
    this.message = message
  }
};


// TODO: create then continuation
// TODO: accept callback into requestInfo or requestInit

const glob = window || global || globalThis;
const createFetchJson = () => async (requestInfo, requestInit = {}) => {
  try {
    if(typeof requestInfo === 'function') {
      requestInfo = requestInfo()
    }
    // TODO: test
    if(typeof requestInit === 'function') {
      requestInit = requestInit()
    }

    const res = await glob.fetch(requestInfo, requestInit);
    const body = await res.json();

    return body;
  } catch(err) {
    console.error(err);
    throw err;    
  }

}

export const fetchArray = (requestInfo, requestInit = {}, config = {}) => {
  
  return futureArray(() => {
    if(typeof requestInfo === 'function') {
      requestInfo = requestInfo()
    }
    
    const val = createArrayResource((requestInfo, requestInit) => fetch(requestInfo, requestInit), { getCacheKey: getFetchKey}); 
    return val;
  })

}

export const fetchObject =  (requestInfo, requestInit = {}, config) => {
  return futureObject(() => {

    if(typeof requestInfo === 'function') {
      requestInfo = requestInfo()
    }

    return FetchObject.of(requestInfo, requestInit); 
  })
}

type jsonTransformer = (val: any) => any;
const isObject = (val): val is object => typeof val === 'object' && val !== null;
const isFunction = (val): val is jsonTransformer => typeof val === 'function';

export function fun (str: string): object;
export function fun(str: string, fn: jsonTransformer): object;
export function fun(str: string, obj: object, fn: jsonTransformer): object;
export function fun (str: string, obj?: object | jsonTransformer, fn?: jsonTransformer) {
  if(typeof obj === 'undefined' && typeof fn === 'undefined' && typeof str === 'string') {
    return {}
  }
  if(isFunction(obj) && typeof str === 'string' && typeof fn === 'undefined') {
    return {};
  }
  if(typeof str === 'string' && isObject(obj) && isFunction(fn)) {
    return {}
  }
}



const throwIfNotGET = method => { if (method !== 'GET') { throw new RenderOperationError('Only GET permitted in render') } }

