import { unstable_getCacheForType as getCacheForType } from "react";
import {
  thisMap,
  LazyObject,
  LazyArray,
  SuspenseCascade,
  run,
} from "./internal";
import ReactDOM from "react-dom";
import { getCache } from "./futures";
import React from "react";
export const metadataMap = new WeakMap();

export const tapper = (fn: Function) => (val: any) => {
  fn(val);
  return val;
};

export const isFuture = (proxy) => thisMap.has(proxy);

export const unwrapProxy = (proxy) => thisMap.get(proxy);

// TODO: write tests
export const isReactRendering = () => {
  const dispatcher =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
      .ReactCurrentDispatcher.current;


  const currentOwner =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner
      .current;
      
  return (
    (dispatcher !== null &&
      dispatcher.useState.name !== "throwInvalidHookError") ||
    currentOwner 
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

// TODO: should accept promise function
export const lazyArray = (fn) =>
  new LazyArray(() => {
    const result = fn();
    if (!Array.isArray(result))
      throw new Error(
        "Type Error: expected result of lazyArray to be of type array"
      );
    return result;
  }, defaultCascade);

// TODO: should accept promise function

export const lazyObject = (fn) =>
  new LazyObject(() => {
    const result = fn();
    if (typeof result !== "object" || result === null) {
      throw new Error(
        "Type Error: expected result of lazyObject to be of type object"
      );
    }
    return result;
  }, defaultCascade);


export const getRaw = (future) => {
  if (!isFuture(future)) {
    return future;
  }

  return run(getRaw, future, cascadeMap.get(future));
};

export const toPromise = async (future) => {
  if (!isFuture(future)) {
    return Promise.resolve(future);
  }
  try {
    const val = getRaw(future);
    return val;
  } catch (errOrProm) {

    if (typeof errOrProm.then === "function") {
      await errOrProm;
      return toPromise(future);
    }
    throw errOrProm;
  }
};

export const createCascadeMap = new WeakMap();
export const cascadeMap = new WeakMap();

export const getCascade = (obj) => {
  if (cascadeMap.has(obj)) {
    const cascade = cascadeMap.get(obj);
    return (cb) => cascade.map(cb);
  }
  return defaultCascade;
};

export const defaultCascade = (cb) =>
  SuspenseCascade.of(
    cb,
    SuspenseCascade.getCurrentScope() ||
      (isReactRendering()
        ? {
            cache: getCacheForType(getCache),
            getCache: getCache,
          }
        : { cache: getCache(), getCache: getCache })
  );

