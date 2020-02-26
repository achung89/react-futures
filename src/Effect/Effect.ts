import {  pipe, tap, first, isRendering } from "../utils";
import TransparentObjectEffect from "../FutureObject/TransparentObjectEffect";

const thisMap = new WeakMap;
// implements IO
const createEffect = Type => class Effect<T extends object = object> extends Type {
  static of: <T extends object>(type: T) => Effect<T>; // TODO: check typedef
  //TODO: write explainer for wrapping privates method in static method
  static tap(fn: Function, name: string, futr: Effect) {
    if(!thisMap.has(futr)) {
      // TODO: change
      throw new Error("NOT INSTANCE")
    }
    return thisMap.get(futr).#tap(fn, name);
  }
  static map(fn: Function, futr: Effect) {
    if(!thisMap.has(futr)) {
      // TODO: change
      throw new Error("NOT INSTANCE")
    }    
    console.log(thisMap.get(futr))
    return thisMap.get(futr).#map(fn)
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
        if(typeof this[key] === 'function') { // TODO: what is this?
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
      ownKeys: () => { // TODO: is this right?
        console.log(TransparentObjectEffect.toString());
        return TransparentObjectEffect.getOwnPropertyNames(this)
      },
      preventExtensions: () => {
        return Reflect.preventExtensions(this.#deferredFn())
      },
      setPrototypeOf: (_target, proto) => {
        this.#tap(target => Object.setPrototypeOf(target, proto), 'Object.setPrototype')
        return true;
      },
      ...childProxy
    });
    thisMap.set(proxy, this);
    return proxy;
  }
  #map = function map(nextFn: Function) { 
    return new this.constructor[Symbol.species]( pipe(this.#deferredFn, nextFn));
  }

  #tap = function tape(fn: Function, name: string) {
    if(isRendering()) {
      // TODO: implement custom error message per method
      throw new Error('Cannot invoke mutable operation ' + name + ' in render. Consider using a immutable variant')
    } 
    this.#deferredFn = pipe(this.#deferredFn, tap(fn));
    return this;
  }
  #run = function run (fn: Function){
    return pipe(this.#deferredFn, fn)();
  }
}

// bypass limitation of babel subclassing, only works down to ie11 
// https://babeljs.io/docs/en/babel-plugin-transform-classes
export const ObjectEffect = createEffect(class extends Object{});
export const ArrayEffect = createEffect(class extends Array {});