import { pipe, first } from '../internal';
import { LazyArray, cloneFuture } from '../internal';
import { isFuture, getRaw, lazyArray } from '../internal';
import { cascadeMap, createCascadeMap } from '../utils';
export const thisMap = new WeakMap();
export const species = Symbol('species');

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

const splice = (fn, cascade) => {
  let spliced;
  const performSplice = arr => {
    spliced = fn(arr);
  }
  cascade.tap(performSplice);

  const result = lazyArray(() => {
    cascade.get();
    return spliced
  })
  return result;
}

export const map = <T>(fn: Function, futr: LazyArray<T>, cascade, Klass = thisMap.get(futr).constructor[species]) => {
  if (!thisMap.has(futr)) {
    // TODO: change
    throw new Error('NOT INSTANCE');
  }
  return new Klass(fn, cb => cascade.map(cb));
}

export const run = (fn: Function, futr, cascade) => {

  if (!thisMap.has(futr)) {
    // TODO: change
    throw new Error('NOT INSTANCE');
  }
  const val = cascade.map(fn).get()
  return val
}

export const tap = (fn: Function, futr, cascade, name: string,) => {
  throw new Error('Mutable operations not allowed')
  if (!thisMap.has(futr)) {
    // TODO: change
    throw new Error('NOT INSTANCE');
  }

  if (name === 'splice') {
    return splice(fn, cascade)
  }


  cascadeMap.set(futr, cascade.tap(fn))
  return futr;
}

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
      
      return run(target => {
        return Reflect.get(target, key, target)}, proxy, cascade);
    },
    getOwnPropertyDescriptor: (_target, prop) => {
      // that is to not violate invariants for non-configurable properties
      return run(target => {
        Object.defineProperty(_target, prop, Object.getOwnPropertyDescriptor(target, prop) || {})

        return Reflect.getOwnPropertyDescriptor(target, prop);
      }, proxy, cascade)
    },
    getPrototypeOf: _target => {
      return run(target => Reflect.getPrototypeOf(target), proxy, cascade)
    },
    has: (_target, key) => {
      return run(target => Reflect.has(target, key), proxy, cascade);
    },
    isExtensible: _target => {
      throw new InvalidObjectStaticMethod(['isExtensible', 'isFrozen', 'isSealed']);
    },
    ownKeys: _target => {
      const createCascade = createCascadeMap.get(proxy)
      // TODO: is that right?

      return new LazyArray(() => run(target => Reflect.ownKeys(target), proxy, cascade), createCascade);
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
