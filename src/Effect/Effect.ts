import { pipe, first, isRendering } from '../internal';
import { LazyArray, cloneFuture } from '../internal';
import { isFuture, getRaw, lazyArray } from '../internal';
import { cascadeMap, createCascadeMap } from '../utils';
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


export const run = (fn: Function, futr, cascade) => {
  if (!thisMap.has(futr)) {
    // TODO: change
    throw new Error('NOT INSTANCE');
  }
  return fn(cascade.get())
}

export const tap = (fn: Function, futr: LazyArray, cascade, name: string,) => {
  if (!thisMap.has(futr)) {
    // TODO: change
    throw new Error('NOT INSTANCE');
  }
  if (isRendering()) {
    // TODO: implement custom error message per method
    throw new Error(
      'Cannot invoke mutable operation ' +
      name +
      ' in render. Consider using a immutable variant or performing the operation outside render.'
    );
  }
  if (name === 'splice') {
    return splice(fn, cascade)
  }


  cascadeMap.set(futr, cascade.tap(fn))
  return futr;
}

export function createProxy<T extends object = object>(that, cascade){

  const proxy = new Proxy(that, {
    defineProperty: (_target, key, descriptor) => {
      tap(
        target => Reflect.defineProperty(target, key, descriptor),
        that,
        cascade,
        'Object.defineProperty',
      );
      return true;
    },
    set: (_target, key, value) => {
      tap(
        target => {

          if (isFuture(value)) {
            rhsMap.set(that, target)
            try {
              Reflect.set(target, key, value.get())
            } finally {
              rhsMap.delete(that);
            }
          }
          Reflect.set(target, key, value);
        },
        that,
        cascade,
        'set'
      );
      return true;
    },
    deleteProperty: () => {
      throw new Error('deletion on lazy future not permitted');
    },
    get: (target, key, receiver) => {
      if (typeof that[key] === 'function') {
        return Reflect.get(target, key, receiver);
      }

      return run(target => Reflect.get(target, key, target), proxy, cascade);
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

// export const Effec2t<T extends object = object>(cb, createCascader, childProxy: ProxyHandler<typeof Type> = {}){
//     static of: <T extends object>(type: T) => Effect<T>; // TODO: check typedef

//     //TODO: swap name and futr argument to make function variadic
//     static tap(fn: Function, name: string, futr: Effect) {
//       if (!thisMap.has(futr)) {
//         // TODO: change
//         throw new Error('NOT INSTANCE');
//       }
//       return thisMap.get(futr).#tap(fn, name, futr);
//     }

//     // TODO: test curry implentation
//     static map(
//       fn: Function,
//       futr: Effect,
//       ReturnClass = thisMap.get(futr).constructor[species]
//     ) {

//       return thisMap.get(futr).#map(fn, ReturnClass);
//     }
//     static run(fn: Function, futr: Effect) {
//       if (!thisMap.has(futr)) {
//         // TODO: change
//         throw new Error('NOT INSTANCE');
//       }
//       return thisMap.get(futr).#run(fn);
//     }
//     #cascade;
//     constructor(
//       cb,
//       createCascade,
//       childProxy: 
//     ) {
//       super();

//       const proxy = new Proxy(this, {
//         defineProperty: (_target, key, descriptor) => {
//           this.#tap(
//             target => Reflect.defineProperty(target, key, descriptor),
//             'Object.defineProperty',
//             proxy
//           );
//           return true;
//         },
//         set: (_target, key, value) => {
//           this.#tap(
//             target => {

//               if (isFuture(value)) {
//                 try {
//                   Reflect.set(target, key, value.get())
//                 } finally {
//                   rhsMap.delete(this);
//                 }
//               }
//               Reflect.set(target, key, value);
//             },
//             'set',
//             proxy
//           );
//           return true;
//         },
//         deleteProperty: () => {
//           throw new Error('deletion on lazy future not permitted');
//         },
//         get: (target, key, receiver) => {
//           if (typeof this[key] === 'function') {
//             return Reflect.get(target, key, receiver);
//           }

//           return this.#run(target => Reflect.get(target, key, target));
//         },
//         getOwnPropertyDescriptor: (_target, prop) => {
//           // this is to not violate invariants for non-configurable properties
//           return this.#run(target => {
//             Object.defineProperty(_target, prop, Object.getOwnPropertyDescriptor(target, prop) || {})

//             return Reflect.getOwnPropertyDescriptor(target, prop);
//           })
//         },
//         getPrototypeOf: _target => {
//           return this.#run(target => Reflect.getPrototypeOf(target))
//         },
//         has: (_target, key) => {
//           return this.#run(target => Reflect.has(target, key));
//         },
//         isExtensible: _target => {
//           throw new InvalidObjectStaticMethod(['isExtensible', 'isFrozen', 'isSealed']);
//         },
//         ownKeys: _target => {
//           const createCascade = createCascadeMap.get(this)
//           // TODO: is this right?

//           return new LazyArray(() => this.#run(target => Reflect.ownKeys(target)), createCascade);
//         },
//         preventExtensions: _target => {
//           throw new InvalidObjectStaticMethod(['preventExtensions', 'seal'])
//         },
//         setPrototypeOf: (_target, proto) => {
//           throw new InvalidObjectStaticMethod('setPrototypeOf')
//         },
//         ...childProxy,
//       });

//       return proxy;
//     }
//     #map = function map(nextFn: Function, Klass) {
//       return new Klass(nextFn, cb => this.#cascade.map(cb));
//     };
//     #splice = function spliceTap(fn) {
//       let spliced;
//       const performSplice = arr => {
//         spliced = fn(arr);
//       }
//       this.#cascade = this.#cascade.tap(performSplice);

//       const result = lazyArray(() => {
//         this.#cascade.get();
//         return spliced
//       })
//       return result;
//     }
//     #tap = function tapper(fn: Function, name: string, futr: Effect) {
//       if (isRendering()) {
//         // TODO: implement custom error message per method
//         throw new Error(
//           'Cannot invoke mutable operation ' +
//           name +
//           ' in render. Consider using a immutable variant or performing the operation outside render.'
//         );
//       }
//       if (name === 'splice') {
//         return this.#splice(fn)
//       }

//       this.#cascade = this.#cascade.tap(fn);
//       return futr;
//     };
//     #run = function run(fn: Function) {
//       let getVal = () => this.#cascade.get();

//       const a = getVal();

//       return fn(a)
//     };
//   };

