import { isRendering } from "../utils";

const cache = new LRU(500);
const getCachedPromise = keys => {
    const key = JSON.stringify(keys);
    if (cache.has(key)) {
      return cache.get(key);
    }
    cache.set(key, promiseCb(...keys));
  
    const promise = cache.get(key);
    promise.then(res => {
      promiseStatusStore.set(promise, { value: res, status: 'complete' });
    });
    promiseStatusStore.set(promise, { value: null, status: 'pending' });
  
    return promise;
  };
const cacheFuture = () => {
    if (isRendering()) {
        // TODO: add custom error message per method
        throw new RenderOperationError('to create a future inside render use \'useFutureArray\' or \'cache\'');
      }

    
      return class FutureObject<A> {
        static get [species]() {
          return LazyObject;
        }

        constructor(...keys) {
          if(keys.some(key =>typeof key === 'object' && key !== null) && canSuspend()) {
            throw new Error(`TypeError: key expected to be of type number, string, or undefined inside render, received array or object`)
          }
          super(getCachedPromise(keys));
        }
      };
}
