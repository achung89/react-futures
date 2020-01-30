import {  pipe, first } from "./utils";


export default class LazyFuture {
  static of() {
    //TODO: implement
    return 
  }
  static tap(fn, name, futr) {
    return futr.#tap(fn, name);
  }
  static map(fn, futr) {
    return futr.#map(fn)
  }
  #deferredFn;
  constructor(deferredFn) {
    //TODO: will there be problem in doing first?
    this.#deferredFn = first(deferredFn);

    return new Proxy(this, {
      defineProperty: (_target, key, descriptor) => {
        this.#tap(target => Reflect.defineProperty(target,key,descriptor), 'defineProperty');
        return true;
      },
      set: (_target, key, value) => {
        this.#tap(target => Reflect.set(target,key,value), 'set');
        return true;
      },
      deleteProperty: () => {
        throw new Error("deletion on lazy future not permitted")
      },
      get: (target, key, receiver) => {
        return Reflect.get(this.#deferredFn(), key, receiver);
      },
      getOwnPropertyDescriptor
      getPrototypeOf
      has
      isExtensible
      ownKeys
      preventExtensions
      set
      setPrototypeOf
    })
  }
  #map = nextFn =>  new this.constructor[Symbol.species]( pipe(this.#deferredFn, nextFn));

  #tap = (fn, name) => {
    if(isRendering()) {
      // TODO: implement custom error message per method
      throw new Error('Cannot invoke mutable operation ' + name + ' in render. Consider using a immutable variant')
    } 
    this.#deferredFn = pipe(this.#deferredFn, tap(fn));
    return this;
  }
}

let {map, tap, of} = LazyFuture;

export {map, tap,of}