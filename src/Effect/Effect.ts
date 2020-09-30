import { pipe, tap, first, isRendering } from '../internal';
import { LazyArray, cloneFuture } from '../internal';
import { isFuture, getRaw, lazyArray } from '../internal';
export const thisMap = new WeakMap();
export const species = Symbol('species');
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
};
const rhsMap = new WeakMap();

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
      ReturnClass = thisMap.get(futr).constructor[species]
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
    #cascade;
    constructor(
      cascade,
      childProxy: ProxyHandler<typeof Type> = {}
    ) {
      super();
      this.#cascade = cascade;
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

              if(isFuture(value)) {
                try {
                  rhsMap.set(this, target);
                  value = thisMap.get(value).constructor[species].run(id => id, value) 
                } finally {
                  rhsMap.delete(this);
                }
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
          return this.#run(target => Reflect.get(target, key, target));
        },
        getOwnPropertyDescriptor: (_target, prop) => {
          // this is to not violate invariants for non-configurable properties
          return this.#run(target => {
            Object.defineProperty(_target, prop, Object.getOwnPropertyDescriptor(target, prop) || {})

            return Reflect.getOwnPropertyDescriptor(target, prop);
          })
        },
        getPrototypeOf: _target => {
          return this.#run(target => Reflect.getPrototypeOf(target))
        },
        has: (_target, key) => {
          return this.#run(target => Reflect.has(target, key));
        },
        isExtensible: _target => {
          throw new InvalidObjectStaticMethod(['isExtensible','isFrozen', 'isSealed']);
        },
        ownKeys: _target => {
          // TODO: is this right?
          return new LazyArray(() => this.#run(target => Reflect.ownKeys(target)));
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
      return new Klass(this.#cascade.map(nextFn));
    };
    #splice = function spliceTap(fn) {
      let spliced;
      const performSplice = arr => {
        spliced = fn(arr);
      }
      const result = lazyArray(() => {
        performSplice();
        return spliced
      })
      this.#cascade = this.#cascade.tap(performSplice);
      return result;
    }
    #tap = function tapper(fn: Function, name: string, futr: Effect) {
    
      if (isRendering()) {
        // TODO: implement custom error message per method
        throw new Error(
          'Cannot invoke mutable operation ' +
            name +
            ' in render. Consider using a immutable variant or performing the operation outside render.'
        );
      }
      if(name === 'splice') {
        return this.#splice(fn)
      }

      this.#cascade = this.#cascade.tap(fn);
      return futr;
    };
    #run = function run(fn: Function) {
      let getVal = this.#cascade.get;
      if(rhsMap.has(this)) {
        getVal = () => rhsMap.get(this);
      }
      return pipe(getVal, first(fn))();
    };
  };

// bypass limitation of babel subclassing, only works down to ie11
// https://babeljs.io/docs/en/babel-plugin-transform-classes
export const ObjectEffect = createEffect(class extends Object {});
export const ArrayEffect = createEffect(class extends Array {});
