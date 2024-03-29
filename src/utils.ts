import { unstable_getCacheForType as getCacheForType } from "react";
import {
  thisMap,
  SuspenseCascade,
   isFutureArray,
  getArrayCascade,
   isFutureIterator,
  getIteratorCascade,
   isFutureObject,
  getObjectCascade,
} from "./internal";
import { getCache } from "./internal";
import React from "react";
export const metadataMap = new WeakMap();

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

export const getRaw = (future) => {
  if (!isFuture(future)) {
    return future;
  }

  const cascade = getCascade(future);
  return cascade.map(getRaw).get();
};

export const toPromise = async (future) => {
  if (!isFuture(future)) {
    return future;
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

export const getCascade = (obj) => {
  if (isFutureArray(obj)) {
    return getArrayCascade(obj);
  }

  if(isFutureIterator(obj)) {
    return getIteratorCascade(obj);
  }

  if(isFutureObject(obj)) {
    return getObjectCascade(obj);
  }

  return defaultCascade(() => obj);
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

