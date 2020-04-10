import {  pipe, tap, first, isRendering } from "../internal";
import {TransparentArrayEffect} from '../internal';
export const thisMap = new WeakMap;
// implements IO
const createEffect = Type => class Effect<T extends object = object> extends Type {
  static of: <T extends object>(type: T) => Effect<T>; // TODO: check typedef
  //TODO: write explainer for wrapping privates method in static method
  //TODO: swap name and futr argument to make function variadic
  static tap(fn: Function, name: string, futr: Effect) {
    if(!thisMap.has(futr)) {
      // TODO: change
      throw new Error("NOT INSTANCE")
    }
    return thisMap.get(futr).#tap(fn, name, futr);
  }
  static map(fn: Function, futr: Effect, KlassToConvertTo) {
    if(!thisMap.has(futr)) {
      // TODO: change
      throw new Error("NOT INSTANCE")
    }    
    return thisMap.get(futr).#map(fn, KlassToConvertTo)
  }
  static run(fn: Function, futr: Effect) {
    if(!thisMap.has(futr)) {
      // TODO: change
      throw new Error("NOT INSTANCE")
    }
    return thisMap.get(futr).#run(fn); 
  }
  #deferredFn: Function;
  constructor(deferredFn: Function, childProxy: ProxyHandler<typeof Type> = {}) {
    super();
    //TODO: will there be problem in doing first?
    this.#deferredFn = first(deferredFn);
    const proxy = new Proxy(this, {
      defineProperty: (_target, key, descriptor) => {
        
        this.#tap(target => Reflect.defineProperty(target,key,descriptor), 'Object.defineProperty', proxy);
        return true;
      },
      set: (_target, key, value) => {
        this.#tap(target => Reflect.set(target,key,value), 'set', proxy);
        return true;
      },
      deleteProperty: () => {
        throw new Error("deletion on lazy future not permitted")
      },
      get: (target, key, receiver) => {
        if(typeof this[key] === 'function') { // TODO: what is this?
          return Reflect.get(target, key, receiver);
        }
        return Reflect.get(this.#deferredFn(), key, this.#deferredFn())
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
      ownKeys: _target => { // TODO: is this right?
        return new TransparentArrayEffect(() =>  Reflect.ownKeys(this.#deferredFn()))
      },
      preventExtensions: target => {
          // TODO: error message
          this.#tap(target => Reflect.preventExtensions(target), 'Object.preventExtensions', proxy);
          return Reflect.preventExtensions(target);
      },
      setPrototypeOf: (_target, proto) => {
        return this.#tap(target => Reflect.setPrototypeOf(target,proto), 'Object.setPrototypeOf', proxy);
      },
      ...childProxy
    });
    thisMap.set(proxy, this);
    return proxy;
  }
  #map = function map(nextFn: Function, Klass = this.constructor[Symbol.species]) { 
    const newNextFn = (...args) => {
      let result = nextFn(...args);;
      return result
    }
    return new Klass( pipe(this.#deferredFn, newNextFn) );
  }

  #tap = function tapper(fn: Function, name: string, futr: Effect) {
    if(isRendering()) {
      // TODO: implement custom error message per method
      throw new Error('Cannot invoke mutable operation ' + name + ' in render. Consider using a immutable variant or performing the operation outside render.')
  } 
    const newNextFn = (...args) => {
      let result = fn(...args);

      return result;
    }
    this.#deferredFn = pipe(this.#deferredFn, tap(newNextFn));
    return futr;
  }
  #run = function run (fn: Function){
    const newNextFn = (...args) => {
      let result = fn(...args);
      return result
    }
    return pipe(this.#deferredFn, newNextFn)();
  }
}

// bypass limitation of babel subclassing, only works down to ie11 
// https://babeljs.io/docs/en/babel-plugin-transform-classes
export const ObjectEffect = createEffect(class extends Object{});
export const ArrayEffect = createEffect(class extends Array {});