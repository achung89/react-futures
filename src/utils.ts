import React from 'react';
import {
  thisMap,
  LazyObject,
  LazyArray,
  species
} from './internal';
export const metadataMap = new WeakMap();

export const pipe = (...fns: Function[]) => (val: any = undefined) =>
  fns.reduce((val, fn) => fn(val), val);

export const tap = (fn: Function) => (val: any) => {
  fn(val);
  return val;
};

export const isFuture = proxy =>  thisMap.has(proxy);

export const unwrapProxy = proxy => thisMap.get(proxy);

export const __internal = { allowSuspenseOutsideRender: false };
export const isRendering = () => {

  var dispatcher =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
      .ReactCurrentDispatcher.current;
  return (
    dispatcher !== null && dispatcher.useState.name !== 'throwInvalidHookError'
  );
};

// returns result of first call on every subsequent call
export const first = (fn: Function) => {
  let ran = false;
  let memo = null;

  return (...args) => {
    if (ran) {
      return memo;
    }
    // TODO: put debug here for function name/toString
    memo = fn(...args);
    ran = true;
    return memo;
  };
};

export const lazyArray = fn =>  new LazyArray(() => {
  const result = fn()
  if(!Array.isArray(result)) throw new Error('Type Error: expected result of lazyArray to be of type array');
  return result;
});

export const lazyObject = fn => new LazyObject(() => {

  const result = fn()
  if(typeof result !== 'object' || result === null) {
    throw new Error('Type Error: expected result of lazyObject to be of type object');
  }
  return result
});

export const getRaw = future => {
  if ( !isFuture(future) ) {
    return future;
  }
  const instance = thisMap.get(future) 
  return instance.constructor[species].run(getRaw, future);
}

export const toPromise = async future => {
  if(!isFuture(future)) {
    return Promise.resolve(future);
  }
  try {
    __internal.allowSuspenseOutsideRender = true;
    const val = getRaw(future);
    __internal.allowSuspenseOutsideRender = false;
    return val;
  } catch (errOrProm) {
    __internal.allowSuspenseOutsideRender = false;
    if(typeof errOrProm.then === 'function') {
      await errOrProm;
      return toPromise(future);
    }
    throw errOrProm;
  }
}