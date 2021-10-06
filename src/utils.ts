import {unstable_getCacheForType as getCacheForType} from 'react';
import {
  thisMap,
  LazyObject,
  LazyArray,
  PushCacheCascade,
  run
} from './internal';
import ReactDOM from 'react-dom';
import { getCache } from './futures';
import React from 'react';
export const metadataMap = new WeakMap();



export const pipe = (...fns: Function[]) => (val: any = undefined) =>
  fns.reduce((val, fn) => fn(val), val);

export const tapper = (fn: Function) => (val: any) => {
  fn(val);
  return val;
};

export const isFuture = proxy => thisMap.has(proxy);

export const unwrapProxy = proxy => thisMap.get(proxy);

export const __internal = { 
  allowSuspenseOutsideRender: false,
  suspenseHandlerCount: 0
};
export const isReactRendering = () => {
  const dispatcher =
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
    .ReactCurrentDispatcher.current;
  const currentOwner = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner.current;

  return(( dispatcher !== null && dispatcher.useState.name !== 'throwInvalidHookError') || currentOwner)
}

export const isDomRendering = () => {
  // console.log('===================', ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED)
  // console.log('===================', 
    // ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events[0](), 
    // ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events[1](),
    //  ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events[2]())
  const isTestDomRendering =  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.IsSomeRendererActing?.current
  const isDomRendering = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events[6]?.current;
  return isDomRendering || isTestDomRendering;

}

export const isRendering = () => isReactRendering() || isDomRendering();

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

export const lazyArray = fn => new LazyArray(() => {
  const result = fn()
  if (!Array.isArray(result)) throw new Error('Type Error: expected result of lazyArray to be of type array');
  return result;
}, defaultCascade);

export const lazyObject = fn => new LazyObject(() => {

  const result = fn()
  if (typeof result !== 'object' || result === null) {
    throw new Error('Type Error: expected result of lazyObject to be of type object');
  }
  return result
}, defaultCascade);

export const getRaw = future => {
  if (!isFuture(future)) {
    return future;
  }

  return run(getRaw, future, cascadeMap.get(future));
}

export const toPromise = async future => {
  if (!isFuture(future)) {
    return Promise.resolve(future);
  }
  try {
    __internal.suspenseHandlerCount++;
    const val = getRaw(future);
    __internal.suspenseHandlerCount--;
    return val;
  } catch (errOrProm) {
    __internal.suspenseHandlerCount--;
    
    if (typeof errOrProm.then === 'function') {
      await errOrProm;
      return toPromise(future);
    }
    throw errOrProm;
  }
}

export const createCascadeMap = new WeakMap();
export const cascadeMap = new WeakMap;

export const getCascade = obj => {
  if (cascadeMap.has(obj)) {
    const cascade = cascadeMap.get(obj)
    return cb => cascade.map(cb);
  }
  return defaultCascade
}


export const defaultCascade = cb =>  PushCacheCascade.of(cb, PushCacheCascade.getCurrentScope() || (isReactRendering() ? {
  cache: getCacheForType(getCache),
  getCache: getCache,
}: { cache: getCache(), getCache: getCache}))

export const canSuspend = () => isRendering() || __internal.suspenseHandlerCount > 0;