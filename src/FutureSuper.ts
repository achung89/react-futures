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
  constructor(deferredFn, childProxy) {
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
      get: (_target, key, receiver) => {
        return Reflect.get(this.#deferredFn(), key, receiver);
      },
      getOwnPropertyDescriptor: (_target, prop) => {
        return Reflect.getOwnPropertyDescriptor(this.#deferredFn(), prop);
      },
      getPrototypeOf: (_target) => {
        return Reflect.getPrototypeOf(this.#deferredFn());
      },
      has: (_target, key) => {
        return Reflect.has(this.#deferredFn(), key);
      },
      isExtensible: (_target) => {
        return Reflect.isExtensible(this.#deferredFn());
      },
      ownKeys: () => {
        return FutureObject.getOwnPropertyNames(this)
      },
      preventExtensions: () => {
        return Reflect.preventExtensions(this.#deferredFn())
      },
      set: (_target, key, value) => {
        // should i defer this?
        this.#tap(target => (target[key] = value) , 'set');
        return true;
      },
      setPrototypeOf(_target, proto) {
        this.#tap(target => Object.setPrototypeOf(target, proto))
        return true;
      },
      ...childProxy
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