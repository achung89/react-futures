import React from 'react';
import {
  thisMap,
  LazyObject,
  LazyArray,
  species,
  PushCacheCascade
} from './internal';
import * as ReactDOM from 'react-dom';
import { DynamicScopeCascade } from './DynamicScopeCascade/DynamicScopeCascade';

export const metadataMap = new WeakMap();

export const pipe = (...fns: Function[]) => (val: any = undefined) =>
  fns.reduce((val, fn) => fn(val), val);

export const tap = (fn: Function) => (val: any) => {
  fn(val);
  return val;
};

export const isFuture = proxy => thisMap.has(proxy);

export const unwrapProxy = proxy => thisMap.get(proxy);

export const __internal = { allowSuspenseOutsideRender: false };
export const isRendering = () => {
  const dispatcher =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
      .ReactCurrentDispatcher.current;
  const isTestDomRendering =  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.IsSomeRendererActing.current
  const currentOwner = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner.current;
  // console.log("SIJOJDSF", isTestDomRendering)
  // console.log(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner)
  const isDomRendering = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events[6].current;
  // console.log('DISPATCHER', dispatcher);
  // console.log(ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events);
  return (( dispatcher !== null && dispatcher.useState.name !== 'throwInvalidHookError') || currentOwner) || isDomRendering || isTestDomRendering;
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
  const instance = thisMap.get(future)
  return instance.constructor[species].run(getRaw, future);
}

export const toPromise = async future => {
  if (!isFuture(future)) {
    return Promise.resolve(future);
  }
  try {
    __internal.allowSuspenseOutsideRender = true;
    const val = getRaw(future);
    __internal.allowSuspenseOutsideRender = false;
    return val;
  } catch (errOrProm) {
    __internal.allowSuspenseOutsideRender = false;
    if (typeof errOrProm.then === 'function') {
      await errOrProm;
      return toPromise(future);
    }
    throw errOrProm;
  }
}

export const createCascadeMap = new WeakMap();

export const getCascade = obj => {
  if (createCascadeMap.has(obj)) {
    return createCascadeMap.get(obj);
  }
  return defaultCascade
}

export const defaultCascade = cb => {
  let cache = {}
  return PushCacheCascade.of(cb, DynamicScopeCascade.getDynamicScope() || {
    set(key, val) {
      cache[key] = val
    },
    del(key) {
      delete cache[key]
    },
    has(key) {
      return !!cache[key]
    },
    get(key) {
      return cache[key]
    },
    reset() {
      cache = {}
    }
  })
}

export const canSuspend = () => canSuspend() || __internal.allowSuspenseOutsideRender