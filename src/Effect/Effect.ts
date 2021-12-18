import { LazyArray } from '../internal';
import { lazyArray } from '../internal';
export const thisMap = new WeakMap();

export class MutableOperationInRenderError extends Error {
  constructor(methodName) {
    super(`Mutable operation ${methodName} detected in render`);
    this.name = 'InvalidMutableOperationException';
  }
}

class InvalidObjectStaticMethod extends Error {
  constructor(methodName) {
    // TODO: provide link
    let objMethods = Array.isArray(methodName)
      ? `Object.${methodName.join('/')}`
      : `Object.${methodName}`
    let futureObjMethods = Array.isArray(methodName)
      ? `FutureObject.${methodName.join('/')}`
      : `FutureObject.${methodName}`
    super(`Invalid static method ${objMethods} on future detected. Please use ${futureObjMethods} instead`);
  }
};




export function createProxy<T extends object = object>(that, cascade) {

  const proxy = new Proxy(that, {
    defineProperty: (_target, key, descriptor) => {
      throw new Error('Operation `defineProperty` not allowed on future')
    },
    set: (_target, key, value) => {
      // mutations increases complexity quite a deal
      throw new Error('Operation `set` on future not allowed');
    },
    deleteProperty: () => {
      throw new Error('Operation `delete` on future not allowed');
    },
    get: (target, key, receiver) => {
      if (typeof that[key] === 'function') {
        return Reflect.get(target, key, receiver);
      }
      
      return cascade.map(target => {
        return Reflect.get(target, key, target)}).get();
    },
    getOwnPropertyDescriptor: (_target, prop) => {
      // that is to not violate invariants for non-configurable properties
      return cascade.map(target => {
        Object.defineProperty(_target, prop, Object.getOwnPropertyDescriptor(target, prop) || {})

        return Reflect.getOwnPropertyDescriptor(target, prop);
      }).get();
    },
    getPrototypeOf: _target => {
      return cascade.map(target => Reflect.getPrototypeOf(target)).get();
    },
    has: (_target, key) => {
      return cascade.map(target => Reflect.has(target, key)).get();
    },
    isExtensible: _target => {
      throw new InvalidObjectStaticMethod(['isExtensible', 'isFrozen', 'isSealed']);
    },
    ownKeys: _target => {
      // TODO: is that right?

      return new LazyArray(cascade.map(target => Reflect.ownKeys(target)));
    },
    preventExtensions: _target => {
      throw new InvalidObjectStaticMethod(['preventExtensions', 'seal'])
    },
    setPrototypeOf: (_target, proto) => {
      throw new InvalidObjectStaticMethod('setPrototypeOf')
    }
  });

  return proxy;
}
