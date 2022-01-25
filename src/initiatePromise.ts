import { promiseStatusStore } from "./shared-properties";
import { ThrowablePromise } from "./ThrowablePromise/ThrowablePromise";

export const initiateArrayPromise = (promise) => () => {
  let promiseState = promiseStatusStore.get(promise);

  if (typeof promiseState !== "undefined") {
    var { status, value } = promiseState;
  } else {
    throw new Error("No status or value found for promise");
  }

  if (status === "complete") {
    if (!Array.isArray(value)) {
      throw new Error(
        "TypeError: FutureArray received non-array value from promise"
      );
    }

    return value;
  }

  if (status === "pending") {
    throw new ThrowablePromise(promise);
  }

  if (status === "error") {
    //TODO: more descript error message
    //TODO: should I put error here?
    throw new Error("Unhandled promise exception");
  }
};


export const initiateObjectPromise = (promise) =>() => {

  let meta = promiseStatusStore.get(promise);

  if (typeof meta !== 'undefined') {
    var { status, value } = meta;
  } else {
    throw new Error('No status or value found for promise');
  }

  if (status === 'complete') {
    if (typeof value !== 'object' || typeof value === null) {
      throw new TypeError(
        'FutureObject received non-object value from promise'
      );
    }
    return value;
  }

  if (status === 'pending') {
    throw new ThrowablePromise(promise);
  }

  if (status === 'error') {
    //TODO: more descript error message
    //TODO: should I put error here?
    throw new Error('Unhandled promise exception');
  }
}