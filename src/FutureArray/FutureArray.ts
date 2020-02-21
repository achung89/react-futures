import { promiseStatusCache } from "../shared-properties";
import TransparentArrayEffect from "./TransparentArrayEffect";
import { isRendering } from "../utils";

export default class FutureArray<T> extends TransparentArrayEffect<T> {

  constructor(promise) {
    super(() => {
      const { status, value } = promiseStatusCache.get(promise)
      if(status === 'complete') {
        if(!Array.isArray(value)) {
          throw new Error("TypeError: FutureArray received non-array value from promise")
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
