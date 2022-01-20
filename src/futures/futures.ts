import {
  FutureObject,
  FutureArray
} from "../internal";
import { defaultCascade } from "../utils";

// TODO: should accept promise function
// TODO: if the fn returns a promise or is an async function, a cachekey is required (?)

export const futureArray = (fn) => new FutureArray(defaultCascade(() => {
  const result = fn();
  if (!Array.isArray(result))
    throw new TypeError(
      "expected result of futureArray to be of type array"
    );
  return result;
}));
// TODO: should accept promise function
// TODO: if the fn returns a promise or is an async function, a cachekey is required

export const futureObject = (fn) => new FutureObject(defaultCascade(() => {
  const result = fn();
  if (typeof result !== "object" || result === null) {
    throw new TypeError(
      "expected result of futureObject to be of type object"
    );
  }
  return result;
}));
