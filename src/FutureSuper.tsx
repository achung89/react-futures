import { tap, pipe, first } from "./utils";
import { promiseCache, deferredOperations } from "./shared-properties";


export default = (promise:Promise<any>, instance: Future) => ({
  apply(...args) {
    return Reflect.apply(...args);
  },
  construct(...args) {
    return Reflect.construct(...args);
  },
  defineProperty(_target, key, descriptor) {
    if( isRendering() ) {
      // TODO: more descriptive error message
      throw new Error("no sideeffed")
    }
    if(promiseCache.get(promise).status === 'pending') {
      
      deferredOperations.set(instance, first(pipe(deferredOperations.get(instance), target => Object.defineProperty(target, key, descriptor))))
    }

  },
  deleteProperty
  get
  getOwnPropertyDescriptor
  getPrototypeOf
  has
  isExtensible
  ownKeys
  preventExtensions
  set
  setPrototypeOf
})