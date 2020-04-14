import { isRendering, thisMap } from '../internal';
import { ObjectEffect, ArrayEffect } from '../internal';
import { LazyArray } from '../internal';

type Object = object | any[];
const { tap, map } = ObjectEffect;
export const isEffect = futr => thisMap.has(futr);

class MutableOperationInRenderError extends Error {
  constructor(methodName) {
    super(`Mutable operation ${methodName} detected in render`);
    this.name = 'InvalidMutableOperationException';
  }
}
class SuspendOperationOutsideRenderError extends Error {
  constructor(methodName) {
    super(`Suspend operation ${methodName} detected outside render`);
    this.name = 'InvalidSuspendOperationException';
  }
}
const staticMutableOperation = (target, cb, methodName) => {
  if (isEffect(target)) {
    const Klass = target.constructor[Symbol.species];
    return Klass.tap(cb, methodName, target);
  } else {
    if (isRendering()) {
      throw new MutableOperationInRenderError(methodName);
    }
    if (Array.isArray(target)) {
      return new LazyArray(() => cb(target));
    } else {
      return new LazyObject(() => cb(target));
    }
  }
};
const staticSuspendOperation = (target, cb, methodName) => {
  if (isEffect(target)) {
    const Klass = target.constructor[Symbol.species];
    return Klass.run(cb, target);
  } else {
    if (!isRendering())
      throw new SuspendOperationOutsideRenderError(methodName);
    return cb(target);
  }
};
// TODO test non future params
export class LazyObject<T extends object> extends ObjectEffect<T> {
  static get [Symbol.species]() {
    return LazyObject;
  }

  constructor(fn) {
    super(fn);
  }
  // mutable methods
  static assign(obj, ...rest) {
    return staticMutableOperation(
      obj,
      obj => Object.assign(obj, ...rest),
      'FutureObject.assign'
    );
  }
  static seal(obj) {
    return staticMutableOperation(obj, Object.seal, 'FutureObject.seal');
  }
  static preventExtensions(obj) {
    return staticMutableOperation(
      obj,
      Object.preventExtensions,
      'FutureObject.preventExtensions'
    );
  }
  static defineProperties(obj, descs) {
    return staticMutableOperation(
      obj,
      obj => Object.defineProperties(obj, descs),
      'FutureOject.defineProperties'
    );
  }
  static defineProperty(obj, prop, desc) {
    return staticMutableOperation(
      obj,
      obj => Object.defineProperty(obj, prop, desc),
      'FutureObject.defineProperty'
    );
  }
  static freeze(obj) {
    return staticMutableOperation(obj, Object.freeze, 'FutureObject.freeze');
  }
  static setPrototypeOf(obj, proto) {
    return staticMutableOperation(
      obj,
      obj => Object.setPrototypeOf(obj, proto),
      'FutureObject.setPrototypeOf'
    );
  }

  // immutable methods
  static getOwnPropertyDescriptor(obj, property) {
    return new LazyObject(() => Object.getOwnPropertyDescriptor(obj, property));
  }
  static getOwnPropertyDescriptors(obj) {
    return new LazyObject(() => Object.getOwnPropertyDescriptors(obj));
  }
  static getOwnPropertyNames(obj) {
    return new LazyArray(() => Object.getOwnPropertyNames(obj));
  }
  static getOwnPropertySymbols(obj) {
    return new LazyArray(() => Object.getOwnPropertySymbols(obj));
  }
  static getPrototypeOf(obj) {
    return new LazyObject(() => Object.getPrototypeOf(obj));
  }
  static keys(obj) {
    return new LazyArray(() => Object.keys(obj));
  }
  static entries(obj) {
    return new LazyArray(() => Object.entries(obj));
  }
  //TODO: write test for fromEntries
  static fromEntries(obj) {
    return new LazyObject(() => Object.fromEntries(obj));
  }
  static values(obj) {
    return new LazyArray(() => Object.values(obj));
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
    throw Error('FutureObject.create not supported');
  }
  // forward
  static is(obj1, obj2) {
    throw Error('FutreObject.is not supported');
  }
}
