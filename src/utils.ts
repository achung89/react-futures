import React, {useState} from 'react';

export const pipe = (...fns: Function[]) => (val: any = undefined) => fns.reduce( (val, fn) => fn(val), val );
export const tap = (fn: Function) => (val: any) => { fn(val); return val };

export const isRendering = () => {
  var dispatcher = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current;

  if (!(dispatcher !== null)) {
    {
      throw Error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.");
    }
  }
  return true;
}

// returns result of first call on every subsequent call
export const first = (fn: Function) => {
  let ran = false;
  let memo = null;
  return (...args) => {
    if(ran) {
      return memo;
    }
    ran = true;
    return memo = fn(...args);
  }
};
type PromiseCb  = (...args: any[]) => Promise<any>
export const memoCache = (cb:PromiseCb) => {
  let cache: Promise<any> | null = null;
  function cbWrapper(...args: any[]) {
    cache = cache || cb(...args);
    return cache;
  }
  cbWrapper.invalidate = () => {
    cache = null;
  }
  return cbWrapper;
}
