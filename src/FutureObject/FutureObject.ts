import { promiseStatusCache } from "../shared-properties";
import TransparentObjectEffect from "./TransparentObjectEffect";
import { isRendering } from "../utils";

export default class FutureObject<T> extends TransparentObjectEffect<T> {

  constructor(promise) {
    super(() => {
      const { status, value } = promiseStatusCache.get(promise)
      if(status === 'complete') {
        if(typeof value !== 'object' || typeof value === null) {
          throw new Error("TypeError: FutureObject received non-object value from promise")
        }
        return value;
      }
      if(status === 'pending') {
        if(!isRendering()) {
          // TODO: add custom error message per method
          throw new Error("cannot suspend outside render")
        }
        throw promise;
      }
      if(status === 'error') {
        //TODO: more descript error message
        //TODO: should I put error here?
        throw new Error('Unhandled promise exception')
      }
    });
  }
}
