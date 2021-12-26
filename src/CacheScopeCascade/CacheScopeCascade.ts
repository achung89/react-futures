import { isReactRendering } from "../internal";
import { unstable_getCacheForType as getCacheForType } from "react";
type ScopeVal = {
  cache: Map<string, Promise<any>> | null;
  getCache: () => Map<string, Promise<any>>;
} | undefined;

let cacheScope;

export class CacheScopeCascade {
  static getCurrentScope() {

    // console.log('dynamic',isReactRendering(), cacheScope)
    return cacheScope
      ? isReactRendering()
        ? {
            cache: getCacheForType(cacheScope.cacheCb),
            getCache: cacheScope.cacheCb,
          }
        : cacheScope
      : undefined;
  }

  #currentCacheScope: ScopeVal;

  val: any;
  constructor(cb, scopeValue: ScopeVal) {
    let tempScopVal = cacheScope;

    try {
      cacheScope = isReactRendering()
      ? {
          cache: getCacheForType(scopeValue.cacheCb),
          getCache: scopeValue.cacheCb,
        }
      : scopeValue;
      
      this.#currentCacheScope = cacheScope
      this.val = cb();
    } finally {
      cacheScope = tempScopVal;
    }
  }

  static of(cb, val) {
    return new CacheScopeCascade(cb, val);
  }

  map(cb) {
    return new CacheScopeCascade(() => cb(this.val), this.#currentCacheScope);
  }

  get() {
    return this.val;
  }

}
