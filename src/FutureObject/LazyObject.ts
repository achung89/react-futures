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
    
    return  new LazyArray(() => cb(cloneFuture(target)), createCascade);
  } else {
    return new LazyObject(() =>  cb(cloneFuture(target)), createCascade);
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

  constructor(cb, createCascade) {
    const cascade = createCascade(cb);
    const proxy = createProxy(this, cascade)

    thisMap.set(proxy, this);
    cascadeMap.set(proxy, cascade)
    createCascadeMap.set(proxy, createCascade);
    return proxy;
  }

  // immutable methods
  static getOwnPropertyDescriptor(obj, property) {
    const createCascade = getCascade(obj)
    return new LazyObject(() => Object.getOwnPropertyDescriptor(obj, property), createCascade);
  }
  static getOwnPropertyDescriptors(obj) {
    const createCascade = getCascade(obj)
    return new LazyObject(() => Object.getOwnPropertyDescriptors(obj), createCascade);
  }
  static getOwnPropertyNames(obj) {
    const createCascade = getCascade(obj)

    return new LazyArray(() => Object.getOwnPropertyNames(obj), createCascade);
  }
  static getOwnPropertySymbols(obj) {
    const createCascade = getCascade(obj)

    return new LazyArray(() => Object.getOwnPropertySymbols(obj), createCascade);
  }
  static getPrototypeOf(obj) {
    const createCascade = getCascade(obj)

    return new LazyObject(() => Object.getPrototypeOf(obj), createCascade);
  }
  static keys(obj) {
    const createCascade = getCascade(obj)

    return new LazyArray(() => Object.keys(obj), createCascade);
  }
  static entries(obj) {
    const createCascade = getCascade(obj)

    return new LazyArray(() => Object.entries(obj), createCascade)
  }
  //TODO: write test for fromEntries
  static fromEntries(obj) {
    const createCascade = getCascade(obj)

    return new LazyObject(() => Object.fromEntries(obj), createCascade);
  }
  static values(obj) {
    const createCascade = getCascade(obj)

    return new LazyArray(() => Object.values(obj), createCascade);
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
  // forward
  static is(obj1, obj2) {
    throw new NotSupportedError('FutureObject.is');
  }
}
