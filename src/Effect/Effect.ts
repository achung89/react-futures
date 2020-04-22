import { pipe, tap, first, isRendering } from '../internal';
import { LazyArray } from '../internal';
import { isFuture, getRaw } from '../utils';
export const thisMap = new WeakMap();
// implements IO

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
}
const createEffect = Type =>
  class Effect<T extends object = object> extends Type {
    static of: <T extends object>(type: T) => Effect<T>; // TODO: check typedef

    //TODO: swap name and futr argument to make function variadic
    static tap(fn: Function, name: string, futr: Effect) {
      if (!thisMap.has(futr)) {
        // TODO: change
        throw new Error('NOT INSTANCE');
      }
      return thisMap.get(futr).#tap(fn, name, futr);
    }

    // TODO: test curry implentation
    static map(
      fn: Function,
      futr: Effect,
      ReturnClass = thisMap.get(futr).constructor[Symbol.species]
    ) {
      if (!thisMap.has(futr)) {
        // TODO: change
        throw new Error('NOT INSTANCE');
      }
      return thisMap.get(futr).#map(fn, ReturnClass);
    }
    static run(fn: Function, futr: Effect) {
      if (!thisMap.has(futr)) {
        // TODO: change
        throw new Error('NOT INSTANCE');
      }
      return thisMap.get(futr).#run(fn);
    }
    #deferredFn: Function;
    constructor(
      deferredFn: Function,
      childProxy: ProxyHandler<typeof Type> = {}
    ) {
      super();
      this.#deferredFn = first(deferredFn);
      const proxy = new Proxy(this, {
        defineProperty: (_target, key, descriptor) => {
          this.#tap(
            target => Reflect.defineProperty(target, key, descriptor),
            'Object.defineProperty',
            proxy
          );
          return true;        
        },
        set: (_target, key, value) => {
          this.#tap(
            target => {
              if (isFuture(value)) {
                const newVal = getRaw(value);
                const Class = thisMap.get(value).constructor[Symbol.species];
                value = new Class(() => newVal);
              }
              Reflect.set(target, key, value);
            },
            'set',
            proxy
          );
          return true;
        },
        deleteProperty: () => {
          throw new Error('deletion on lazy future not permitted');
        },
        get: (target, key, receiver) => {
          if (typeof this[key] === 'function') {
            return Reflect.get(target, key, receiver);
          }
          return Reflect.get(this.#deferredFn(), key, this.#deferredFn());
        },
        getOwnPropertyDescriptor: (_target, prop) => {
          const result = this.#deferredFn();
          // this is to not violate invariants for non-configurable properties
          Object.defineProperty(_target, prop, Object.getOwnPropertyDescriptor(result, prop) || {})
          return Reflect.getOwnPropertyDescriptor(result, prop);
        },
        getPrototypeOf: _target => {
          return Reflect.getPrototypeOf(this.#deferredFn());
        },
        has: (_target, key) => {
          return Reflect.has(this.#deferredFn(), key);
        },
        isExtensible: _target => {
          // return Reflect.isExtensible(this.#deferredFn());
          throw new InvalidObjectStaticMethod(['isExtensible','isFrozen', 'isSealed']);
        },
        ownKeys: _target => {
          // TODO: is this right?
          // return new LazyArray(() => Reflect.ownKeys(this.#deferredFn()));
          return new LazyArray(() => Reflect.ownKeys(this.#deferredFn()));
        },
        preventExtensions: _target => {
          throw new InvalidObjectStaticMethod(['preventExtensions', 'seal'])
        },
        setPrototypeOf: (_target, proto) => {
          throw new InvalidObjectStaticMethod('setPrototypeOf')
        },
        ...childProxy,
      });
      thisMap.set(proxy, this);
      return proxy;
    }
    #map = function map(nextFn: Function, Klass) {
      return new Klass(pipe(this.#deferredFn, nextFn));
    };

    #tap = function tapper(fn: Function, name: string, futr: Effect) {
      if (isRendering()) {
        // TODO: implement custom error message per method
        throw new Error(
          'Cannot invoke mutable operation ' +
            name +
            ' in render. Consider using a immutable variant or performing the operation outside render.'
        );
      }

      const newNextFn = (...args) => {
        let result = fn(...args);

        return result;
      };
      this.#deferredFn = pipe(this.#deferredFn, tap(newNextFn));
      return futr;
    };
    #run = function run(fn: Function) {
      // getRaw will recursively unwrap futures
      return pipe(this.#deferredFn, fn, getRaw)();
    };
  };

// bypass limitation of babel subclassing, only works down to ie11
// https://babeljs.io/docs/en/babel-plugin-transform-classes
export const ObjectEffect = createEffect(class extends Object {});
export const ArrayEffect = createEffect(class extends Array {});
