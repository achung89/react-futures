import {  isReactRendering} from "../internal";
import { unstable_getCacheForType as getCacheForType } from "react";
type ScopeVal = {
  cache: Map<string, Promise<any>> | null;
  cacheCb: () => Map<string, Promise<any>>;
} | null

let dynamicScopeValue = {
  cache: null,
  cacheCb: () => void 0,
};

export class DynamicScopeCascade {
  static getDynamicScope() {
    return dynamicScopeValue;
  }

  #dynamicScopeVal: ScopeVal;

  val: () => any;
  constructor(cb, dynamicScopVal: ScopeVal) {
    let tempDynamicScopVal = dynamicScopeValue;
    try {
      dynamicScopeValue = dynamicScopVal;
      this.#dynamicScopeVal = dynamicScopVal;
      this.val = cb();
    } finally {
      dynamicScopeValue = tempDynamicScopVal;
    }
  }

  static of(cb, val) {
    return new DynamicScopeCascade(cb, val);
  }

  map(cb) {
    const scopeVal = isReactRendering()
      ? {
          cache: getCacheForType(this.#dynamicScopeVal.cacheCb),
          cacheCb: this.#dynamicScopeVal.cacheCb,
        }
      : this.#dynamicScopeVal;

    return new DynamicScopeCascade(() => cb(this.val), scopeVal);
  }

  get() {
    return this.val;
  }
  get functor() {
    return DynamicScopeCascade.of;
  }
}
