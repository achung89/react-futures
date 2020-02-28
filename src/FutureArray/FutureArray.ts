import { promiseStatusStore } from "../shared-properties";
import TransparentArrayEffect from "./TransparentArrayEffect";
import { isRendering } from "../utils";

export default class FutureArray<T> extends TransparentArrayEffect<T> {
  #promise: Promise<any>
  static toPromise(inst: FutureArray<any>) { return inst.#promise; }
  constructor(promise) {
    super(() => {
      console.log(1)
      let meta = promiseStatusStore.get(promise)
      console.log(2)

      if (typeof meta !== "undefined") {
        console.log(3)

        var { status, value } = meta;
      } else {
        console.log(4)

        throw new Error("No status or value found for promise");
      }
      if(status === 'complete') {
        console.log(5)

        if(!Array.isArray(value)) {
          console.log(6)

          throw new Error("TypeError: FutureArray received non-array value from promise")
        }
        console.log(7)

        return value;
      }
      console.log(8)

      if(status === 'pending') {
        console.log(9)

        if(!isRendering()) {
          // TODO: add custom error message per method
          throw new Error("cannot suspend outside render")
        }
        console.log(10)

        throw promise;
      }
      console.log(11)

      if(status === 'error') {
        //TODO: more descript error message
        //TODO: should I put error here?
        throw new Error('Unhandled promise exception')
      }
    });

    this.#promise = promise;
  }
}
