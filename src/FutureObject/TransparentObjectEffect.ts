import { isRendering } from "../utils";
import {ObjectEffect, ArrayEffect} from "../Effect/Effect";
import TransparentArrayEffect from "../FutureArray/TransparentArrayEffect";

type Object = object | any[];
const {run} = ObjectEffect;

const isObjectEffect = inst => inst instanceof ObjectEffect || inst instanceof ArrayEffect;

// TODO test non future params
export default class TransparentObjectEffect<T extends object> extends ObjectEffect<T> {
  constructor(fn) {
    super(fn);
  }
  static assign(target, ...rest) {
    if(isRendering() && isObjectEffect(target)) {
      // TODO: more descriptive message
      throw new Error('no sideaffect')
    }
    return new TransparentObjectEffect(() => Object.assign(target, ...rest))
  }
  static getOwnPropertyDescriptor(target, property) {
    return new TransparentObjectEffect(() => Object.getOwnPropertyDescriptor(target, property))
  }
  static getOwnPropertyDescriptors(target) {
    return new TransparentObjectEffect(() => Object.getOwnPropertyDescriptors(target))
  }
  static getOwnPropertyNames(target) {
    return new TransparentArrayEffect(() => Object.getOwnPropertyNames(target))
  }
  static getOwnPropertySymbols(target) {
    return new TransparentArrayEffect(() => Object.getOwnPropertySymbols(target))
  }
  static is(obj1, obj2) {
    if(!isRendering()) {
      //TODO: more descriptive error messages
      throw new Error('hello')
    }
    const suspend = futureObj => run(obj => obj, futureObj);
    obj1 = obj1 instanceof Effect ? suspend(obj1) : obj1;
    obj2 = obj2 instanceof Effect ? suspend(obj2) : obj2;
    return Object.is(obj1, obj2);
  }
  static preventExtensions(target) {
    return target instanceof ObjectEffect 
            ? this.tap(Object.preventExtensions, target, 'Object.preventExtensions') 
            : Object.preventExtensions(target);
  }
  static seal(target: Object) {
    return  isObjectEffect(target) 
            ? tap(Object.seal, target, 'Object.seal') 
            : Object.seal(target);
  }
  static create() {
    // TODO: think through why this shouldn't be allowed
    throw Error('Future object does not support Object.create')
  }
  static defineProperties(obj:Object, descs) {
    return  isObjectEffect(obj) 
            ? this.tap(target => Object.defineProperties(target, descs), obj, 'Object.defineProperties') 
            : Object.defineProperties(obj, descs);
  }
  static defineProperty(obj, prop, desc) {
    return  isObjectEffect(obj) 
      ? this.tap(target => Object.defineProperty(target, prop, desc), obj, 'Object.defineProperty') 
      : Object.defineProperty(obj, prop, desc); 
  }
  static freeze(obj) {
    return  isObjectEffect(obj)
            ? this.tap(Object.freeze, obj, 'Object.freeze') 
            : Object.freeze(obj);
  }
  static getPrototypeOf(obj) {
    return isObjectEffect(obj)
           ? this.run(Object.getPrototypeOf, obj)
           : Object.getPrototypeOf(obj);
  }
  static setPrototypeOf(obj, proto) {
    return  isObjectEffect(obj)
            ? this.tap(() => Object.setPrototypeOf(obj, proto), obj, 'Object.setPrototypeOf')
            : Object.setPrototypeOf(obj, proto);
  }
  static isExtensible(obj) {
    return isObjectEffect(obj)
           ? this.run(Object.isExtensible, obj)
           : Object.isExtensible(obj)
  }
  static isFrozen(obj) {
    return isObjectEffect(obj)
           ? this.run(Object.isFrozen, obj)
           : Object.isFrozen(obj)    
  }
  static isSealed(obj) {
    return isObjectEffect(obj)
           ? this.run(Object.isSealed, obj)
           : Object.isSealed(obj)    
  }
  static keys(obj) {
    return new TransparentArrayEffect(() => Object.keys(obj));
  }
  static entries(obj) {
    return new TransparentArrayEffect(() => Object.entries(obj));
  }
  static values(obj) {
    return new TransparentArrayEffect(() => Object.values(obj));
  }
}

