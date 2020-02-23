import { promiseStatusStore } from "../shared-properties";
import TransparentObjectEffect from "./TransparentObjectEffect";
import { isRendering } from "../utils";

export default class FutureObject<T extends object> extends TransparentObjectEffect<T> {
  #promise: Promise<any>
  static toPromise(inst: FutureObject<any>) {
    return inst.#promise;
  }
  constructor(promise) {
    super(() => {
      let meta = promiseStatusStore.get(promise)
      if (typeof meta !== "undefined") {
        var { status, value } = meta;
      } else {
        throw new Error("No status or value found for promise");
      }      
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
    this.#promise = promise;
  }
}
