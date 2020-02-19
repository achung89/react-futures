import {  pipe, first, isRendering } from "./utils";

// implements IO
export default Type => class Future<T> extends Type {
  static of: <T>(type: T) => Future<T>; // TODO: check typedef
  //TODO: write explainer for wrapping private method in static method
  static tap(fn, name, futr) {
    return futr.#tap(fn, name);
  }
  static map(fn, futr) {
    return futr.#map(fn)
  }
  static run(fn, futr) {
    return futr.#run(fn); 
  }
  #deferredFn: () => Future<T>;
  constructor(deferredFn, childProxy = {}) {
    super();
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
      get(target, key, receiver) {
        if(typeof this[key] === 'function') {
          return Reflect.get(target, key, receiver);
        }
        return Reflect.get(this.#deferredFn(), key, receiver)
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
      setPrototypeOf(_target, proto) {
        this.#tap(target => Object.setPrototypeOf(target, proto))
        return true;
      },
      ...childProxy
    });
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
  #run = fn => {
    return pipe(this.#deferredFn, fn)();
  }
}

let {map, tap, of, run} = LazyFuture;

export {map, tap,of, run}