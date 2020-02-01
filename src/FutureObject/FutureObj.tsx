import LazyFuture from "../FutureSuper";
import FutureArray from "../ArrayResource/FutureArr";



export default class FutureObj extends LazyFuture {
  static assign(target, ...rest) {
    if(isRendering() && target instanceof FUTURE) {
      // TODO: more descriptive message
      throw new Error('no sideaffect')
    }
    return new FutureObj(() => Object.assign(target, ...rest))
  }
  static getOwnPropertyDescriptor(target, property) {
    return new FutureObj(() => Object.getOwnPropertyDescriptor(target, property))
  }
  static getOwnPropertyDescriptors(target) {
    return new FutureObj(() => Object.getOwnPropertyDescriptors(target))
  }
  static getOwnPropertyNames(target) {
    return new FutureArray(() => Object.getOwnPropertyNames(target))
  }
  static getOwnPropertySymbols(target) {
    return new FutureArray(() => Object.getOwnPropertySymbols(target))
  }
  static is(obj1, obj2) {
    if(!isRendering()) {
      //TODO: more descriptive error messages
      throw new Error('hello')
    }
    obj1 = obj1 instanceof LazyFuture ? suspend(obj1) : obj1;
    obj2 = obj2 instanceof LazyFuture ? suspend(obj2) : obj2;
    return Object.is(obj1, obj2);
  }
  static preventExtensions(target) {
    return target instanceof LazyFuture 
            ? this.tap(Object.preventExtensions, target, 'Object.preventExtensions') 
            : Object.preventExtensions(target);
  }
  static seal(target) {
    return  target instanceof LazyFuture 
            ? this.tap(Object.seal, target, 'Object.seal') 
            : Object.seal(target);
  }
  static create() {
    // TODO: think through why this shouldn't be allowed
    throw Error('Future object does not support Object.create')
  }
  static defineProperties(obj, descs) {
    return  obj instanceof LazyFuture 
            ? this.tap(target => Object.defineProperties(target, descs), obj, 'Object.defineProperties') 
            : Object.defineProperties(obj, descs);
  }
  static defineProperty(obj, prop, desc) {
    return  obj instanceof LazyFuture 
      ? this.tap(target => Object.defineProperty(target, prop, desc), obj, 'Object.defineProperty') 
      : Object.defineProperty(obj, prop, desc); 
  }
  static freeze(obj) {
    return  obj instanceof LazyFuture 
            ? this.tap(Object.freeze, obj, 'Object.freeze') 
            : Object.freeze(obj);
  }
  static getPrototypeOf(obj) {
    return obj instanceof LazyFuture
           ? this.run(Object.getPrototypeOf, obj)
           : Object.getPrototypeOf(obj);
  }
  static setPrototypeOf(obj, proto) {
    return  obj instanceof LazyFuture
            ? this.tap(() => Object.setPrototypeOf(obj, proto), obj, 'Object.setPrototypeOf')
            : Object.setPrototypeOf(obj, proto);
  }
  static isExtensible(obj) {
    return obj instanceof LazyFuture
           ? this.run(Object.isExtensible, obj)
           : Object.isExtensible(obj)
  }
  static isFrozen(obj) {
    return obj instanceof LazyFuture
           ? this.run(Object.isFrozen, obj)
           : Object.isFrozen(obj)    
  }
  static isSealed(obj) {
    return obj instanceof LazyFuture
           ? this.run(Object.isSealed, obj)
           : Object.isSealed(obj)    
  }
  static keys(obj) {
    return new FutureArray(() => Object.keys(obj))[Symbol.iterator]();
  }
  static entries() {
    return new FutureArray(() => Object.entries(obj))[Symbol.iterator]();
  }
  static values() {
    return new FutureArray(() => Object.values(obj))[Symbol.iterator]();
  }
}

