import { createProxy, run } from '../Effect/Effect';
import {  thisMap } from '../internal';
import { LazyArray, getRaw } from '../internal';
import { species, createCascadeMap, getCascade, cascadeMap } from '../internal';

export class NotSupportedError extends Error {
  constructor(methodName) {
    super(`"${methodName}" is not supported`);
    this.name ='Invalid Operation';
  } 
}

export const cloneFuture = target => {
  const descriptors = Object.getOwnPropertyDescriptors(getRaw(target));
  return Object.defineProperties(Array.isArray(target) ? [] : {}, descriptors);
}

export const isEffect = futr => thisMap.has(futr);


export class SuspendOperationOutsideRenderError extends Error {
  constructor(methodName) {
    super(`Suspend operation ${methodName} can not be completed outside render`);
    this.name = 'InvalidSuspendOperationException';
  }
}

const staticMutableToImmutableOperation = (target, cb) => {
  const createCascade = getCascade(target)
  if (Array.isArray(target)) {
    
    return  new LazyArray(createCascade(() => cb(cloneFuture(target))));
  } else {
    return new LazyObject(createCascade(() =>  cb(cloneFuture(target))));
  }
}

const staticSuspendOperation = (target, cb, methodName) => {
  if (isEffect(target)) {
    return run(cb, target, cascadeMap.get(target));
  } else {
    return cb(target);
  }
};

export class LazyObject {
  static get [species]() {
    return LazyObject;
  }


  constructor(cascade) {
    const proxy = createProxy(this, cascade)

    thisMap.set(proxy, this);
    cascadeMap.set(proxy, cascade)
    return proxy;
  }

  // immutable methods
  static getOwnPropertyDescriptor(obj, property) {
    const createCascade = getCascade(obj)
    return new LazyObject(createCascade(() => Object.getOwnPropertyDescriptor(obj, property)));
  }
  static getOwnPropertyDescriptors(obj) {
    const createCascade = getCascade(obj)
    return new LazyObject(createCascade(() => Object.getOwnPropertyDescriptors(obj)));
  }
  static getOwnPropertyNames(obj) {
    const createCascade = getCascade(obj)

    return new LazyArray(createCascade(() => Object.getOwnPropertyNames(obj)));
  }
  static getOwnPropertySymbols(obj) {
    const createCascade = getCascade(obj)

    return new LazyArray(createCascade(() => Object.getOwnPropertySymbols(obj)));
  }
  static getPrototypeOf(obj) {
    const createCascade = getCascade(obj)

    return new LazyObject(createCascade(() => Object.getPrototypeOf(obj)));
  }
  static keys(obj) {
    const createCascade = getCascade(obj)

    return new LazyArray(createCascade(() => Object.keys(obj)));
  }
  static entries(obj) {
    const createCascade = getCascade(obj)

    return new LazyArray(createCascade(() => Object.entries(obj)))
  }
  //TODO: write test for fromEntries
  static fromEntries(obj) {
    const createCascade = getCascade(obj)

    return new LazyObject(createCascade(() => Object.fromEntries(obj)));
  }
  static values(obj) {
    const createCascade = getCascade(obj)

    return new LazyArray(createCascade(() => Object.values(obj)));
  }

  // mutable methods made immutable
  static assign(obj, ...rest) {
    return staticMutableToImmutableOperation(
      obj,
      obj => 
      Object.assign(obj, ...rest),
    );
  }

  static seal(obj) {
    if(thisMap.has(obj)) {
      Object.seal(thisMap.get(obj));
    }
    return staticMutableToImmutableOperation(obj, Object.seal);
  }
  static preventExtensions(obj) {
    return staticMutableToImmutableOperation(
      obj,
      Object.preventExtensions
    );
  }
  static defineProperties(obj, descs) {
    return staticMutableToImmutableOperation(
      obj,
      obj => Object.defineProperties(obj, descs)
    );
  }
  static defineProperty(obj, prop, desc) {
    return staticMutableToImmutableOperation(
      obj,
      obj => Object.defineProperty(obj, prop, desc)
    );
  }
  static freeze(obj) {
    if(thisMap.has(obj)) {
      Object.freeze(thisMap.get(obj));
    }
    return staticMutableToImmutableOperation(obj, Object.freeze);
  }
  static setPrototypeOf(obj, proto) {
    return staticMutableToImmutableOperation(
      obj,
      obj => Object.setPrototypeOf(obj, proto)
    );
  }
  // suspend methods
  static isExtensible(obj) {
    return staticSuspendOperation(
      obj,
      Object.isExtensible,
      'FutureObject.isExtensible'
    );
  }
  static isFrozen(obj) {
    return staticSuspendOperation(
      obj,
      Object.isFrozen,
      'FutureObject.isFrozen'
    );
  }
  static isSealed(obj) {
    return staticSuspendOperation(
      obj,
      Object.isSealed,
      'FutureObject.isSealed'
    );
  }

  //invalid method
  static create() {
    // TODO: think through why this shouldn't be allowed
    throw new NotSupportedError('FutureObject.create');
  }
  // TODO: forward?
  static is(obj1, obj2) {
    throw new NotSupportedError('FutureObject.is');
  }
}
