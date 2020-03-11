import React from 'react';

export const pipe = (...fns: Function[]) => (val: any = undefined) => fns.reduce( (val, fn) => fn(val), val );
export const tap = (fn: Function) => (val: any) => { fn(val); return val };

export const isRendering = () => {
  var dispatcher = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current;
  return dispatcher !== null && dispatcher.useState.name !== 'throwInvalidHookError';
}

// returns result of first call on every subsequent call
export const first = (fn: Function) => {
  let ran = false;
  let memo = null;

  return (...args) => {
    if(ran) {
      return memo;
    }
    // TODO: put debug here for function name/toString
    memo = fn(...args);
    ran = true;
    return memo
  }
};

