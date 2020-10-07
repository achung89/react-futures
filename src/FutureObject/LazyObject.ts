import { isRendering, thisMap } from '../internal';
import { ObjectEffect } from '../internal';
import { LazyArray, getRaw } from '../internal';
import { species } from '../internal';
import { createCascadeMap, getCascade, metadataMap } from '../utils';

const memoize = fn => {
  const cache = new WeakMap();
  const cached = function(val) {
    return cache.has(val) ? cache.get(val) : cache.set(val, fn.call(this, val)) && cache.get(val);
  };
  cached.cache = cache;
  return cached;
};

export const cloneFuture = memoize(target => {
  const descriptors = Object.getOwnPropertyDescriptors(getRaw(target));
  return Object.defineProperties(Array.isArray(target) ? [] : {}, descriptors);
})
export const isEffect = futr => thisMap.has(futr);

class MutableOperationInRenderError extends Error {
  constructor(methodName) {
    super(`Mutable operation ${methodName} detected in render`);
    this.name ='InvalidMutableOperationException';
  } 
}
class SuspendOperationOutsideRenderError extends Error {
  constructor(methodName) {
    super(`Suspend operation ${methodName} can not be completed outside render`);
    this.name = 'InvalidSuspendOperationException';
  }
}
// const staticMutableOperation = (target, cb, methodName) => {
//   if (isEffect(target)) {
//     const klass = target.constructor[species];
//     return klass.tap(cb, methodName, target);
//   } else {
//     if (isRendering()) {
//       throw new MutableOperationInRenderError(methodName);
//     }
//     if (Array.isArray(target)) {
//       return new LazyArray(() => cb(target));
//     } else {
//       return new LazyObject(() => cb(target));
//     }
//   }
// };
const staticMutableToImmutableOperation = (target, cb) => {
  const createCascade = getCascade(target)
  if (Array.isArray(target)) {
    return new LazyArray(() => cb(cloneFuture(target)), createCascade);
  } else {
    return new LazyObject(() =>  cb(cloneFuture(target)), createCascade);
  }
}

const staticSuspendOperation = (target, cb, methodName) => {
  if (isEffect(target)) {
    const Klass = target.constructor[species];
    return Klass.run(cb, target);
  } else {
    if (!isRendering())
      throw new SuspendOperationOutsideRenderError(methodName);
    return cb(target);
  }
};
// const staticImmutableOperation = (target, cb, constructor = undefined) => {
//   if (isEffect(target)) {
//     const klass = constructor || target.constructor[species];
//     return klass.map(cb, target);
//   } else {
//     if (Array.isArray(target)) {
//       return new LazyArray(() => cb(target));
//     } else {
//       return new LazyObject(() => cb(target));
//     }
//   }
// }
// TODO test non future params
export class LazyObject<T extends object> extends ObjectEffect<T> {
  static get [species]() {
    return LazyObject;
  }

  constructor(cb, createCascade) {
    super(cb, createCascade);
  }
  // mutable methods
  // static mutableAssign(obj, ...rest) {
  //   return staticMutableOperation(
  //     obj,
  //     obj => Object.assign(obj, ...rest),
  //     'FutureObject.mutableAssign'
  //   );
  // }
  // static mutableSeal(obj) {
  //   return staticMutableOperation(obj, Object.seal, 'FutureObject.seal');
  // }
  // static mutablePreventExtensions(obj) {
  //   return staticMutableOperation(
  //     obj,
  //     Object.preventExtensions,
  //     'FutureObject.mutablePreventExtensions'
  //   );
  // }
  // static mutableDefineProperties(obj, descs) {
  //   return staticMutableOperation(
  //     obj,
  //     obj => Object.defineProperties(obj, descs),
  //     'FutureObject.mutableDefineProperties'
  //   );
  // }
  // static mutableDefineProperty(obj, prop, desc) {
  //   return staticMutableOperation(
  //     obj,
  //     obj => Object.defineProperty(obj, prop, desc),
  //     'FutureObject.mutableDefineProperty'
  //   );
  // }
  // static mutableFreeze(obj) {
  //   return staticMutableOperation(obj, Object.freeze, 'FutureObject.freeze');
  // }
  // static mutableSetPrototypeOf(obj, proto) {
  //   return staticMutableOperation(
  //     obj,
  //     obj => Object.setPrototypeOf(obj, proto),
  //     'FutureObject.mutableSetPrototypeOf'
  //   );
  // }

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
      obj => Object.assign(obj, ...rest),
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
    throw Error('FutureObject.create not supported');
  }
  // forward
  static is(obj1, obj2) {
    throw Error('FutureObject.is not supported');
  }
}
