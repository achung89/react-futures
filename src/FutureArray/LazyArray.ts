import { species, createProxy, defaultCascade, thisMap, SuspenseCascade } from '../internal';
import { ThrowablePromise } from '../ThrowablePromise/ThrowablePromise';
import { getRaw, isFuture } from '../utils';


let getArrayCascade: (instance: LazyArray<any>) => SuspenseCascade;
let isLazyArray: (value: any) => value is LazyArray<any>
export class LazyArray<T> extends Array<T> {
  #cascade: SuspenseCascade;
  constructor(cascade: SuspenseCascade) {
    super();

    this.#cascade = cascade;
    const proxy = createProxy(this, cascade)
    
    thisMap.set(proxy, this);

    return proxy;
  }

  static {
    isLazyArray = (instance): instance is LazyArray<any> => thisMap.has(instance) && (thisMap.get(instance) instanceof LazyArray)
    getArrayCascade = (instance: LazyArray<any>) => thisMap.get(instance).#cascade; 
  }

  static isArray = Array.isArray

  // immutable methods
  // TODO: pass memoized methods on each subsequent iter
  concat(...args) {
    return new LazyArray(thisMap.get(this).#cascade.map(target => target.concat(...args)));
  }
  filter(callback, thisArg) {
    return new LazyArray(thisMap.get(this).#cascade.map(arr => {
      if(isFuture(arr)) {
        arr = getRaw(arr);
      }

      const Species = arr.constructor[Symbol.species];
      const newArr = new Species;
      const promises: Promise<any[]>[] = [];
      for (let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          if (callback.call(thisArg, item, i, arr)) {
            newArr.push(item);
          }
        } catch (errOrProm) {
          
          if (typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if (promises.length > 0) {
        throw new ThrowablePromise(Promise.all(promises));
      }
      return newArr;
    }));
  }
  slice(...args) {
    return new LazyArray(thisMap.get(this).#cascade.map(target => target.slice(...args)));
  }
  map(callback, thisArg) {
    return new LazyArray(thisMap.get(this).#cascade.map(arr => {
      if(isFuture(arr)) {
        arr = getRaw(arr);
      }
      const Species =  arr.constructor[Symbol.species];
      const newArr = new Species;
      const promises: Promise<any[]>[] = [];
      for (let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          newArr.push(callback.call(thisArg, item, i, arr));
        } catch (errOrProm) {
          if (typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if (promises.length > 0) {
        throw new ThrowablePromise(Promise.all(promises));
      }
      return newArr;
    }))
  }
  // cant do reduce because we don't know what the result type is
  // reduce(...args) {
  //   return map(target => target.reduce(...args), this);
  // }
  // reduceRight(...args) {
  //   return map(target => target.reduceRight(...args), this);
  // }
  flat(...args) {
    return new LazyArray(thisMap.get(this).#cascade.map(target => target.flat(...args)));
  }
  flatMap(callback, thisArg) {
    return new LazyArray(thisMap.get(this).#cascade.map(arr => {
      if(isFuture(arr)) {
        arr = getRaw(arr);
      }
      const Species = arr.constructor[Symbol.species];
      const newArr = new Species;
      const promises: Promise<any[]>[] = [];

      for (let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          newArr.push(callback.call(thisArg, item, i, arr));
        } catch (errOrProm) {
          if (typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }

      if (promises.length > 0) {
        throw new ThrowablePromise(Promise.all(promises));
      }
      // TODO: improve performance by not creating a new array
      return newArr.flat();
    }))
  }



  // mutable methods
  splice(...args): never {
    // TODO: better error message;
    throw new Error('splice is not supported');
    // return tap(target => target.splice(...args), this, cascadeMap.get(this),'splice');
  }
  copyWithin(...args): never {
        // TODO: better error message;

    throw new Error('copyWithin not supported')
    // return tap(target => target.copyWithin(...args), this, cascadeMap.get(this), 'copyWithin');
  }
  sort(comparator): never {
            // TODO: better error message;

    throw new Error('sort is not supported');
    // return tap(target => {
    //   const promises: Promise<any[]>[] = []
    //   for (let i = 1; i < target.length; i++) {
    //     try {
    //       comparator(target[i - 1], target[i])
    //     } catch (errOrProm) {
    //       if (typeof errOrProm.then === 'function') {
    //         promises.push(errOrProm);
    //         continue;
    //       }
    //       throw errOrProm;
    //     }
    //   }
    //   if (promises.length > 0) {
    //     throw new ThrowablePromise(Promise.all(promises));
    //   }
    //   return target.sort(comparator)
    // }, this, cascadeMap.get(this), 'sort');
  }

  reverse(...args): never {
                // TODO: better error message;

    throw new Error('reverse is not supported');
    // return tap(target => target.reverse(...args), this, cascadeMap.get(this), 'reverse');
  }

  fill(...args): never {
                    // TODO: better error message;

    throw new Error('fill is not supported');
    // return tap(target => target.fill(...args), this, cascadeMap.get(this), 'fill');
  }

  //suspend methods
  indexOf(...args) {
    return thisMap.get(this).#cascade.map(target => target.indexOf(...args)).get();
  }
  includes(...args) {
    return thisMap.get(this).#cascade.map(target => target.includes(...args)).get();
  }
  join(...args) {
    return thisMap.get(this).#cascade.map((target => target.join(...args))).get();
  }
  lastIndexOf(...args) {
    return thisMap.get(this).#cascade.map(target => target.lastIndexOf(...args)).get();
  }
  toString(...args) {
    return thisMap.get(this).#cascade.map(target => target.toString(...args)).get();
  }
  toLocaleString(...args) {
    return thisMap.get(this).#cascade.map(target => target.toLocaleString(...args)).get();
  }
  forEach(): never {
    throw new Error('forEach implementation TBD')
  }
  find(callback, thisArg) {
    return thisMap.get(this).#cascade.map(arr => {

      const promises: Promise<any[]>[] = [];
      let foundItem;
      let found = false;
      for (let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          if (callback.call(thisArg, item, i, arr)) {
            foundItem = found ? foundItem : item;
          }
        } catch (errOrProm) {
          if (typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if (promises.length > 0) {
        throw new ThrowablePromise(Promise.all(promises));
      }
      return foundItem;
    }).get();
  }
  every(callback, thisArg) {
    return thisMap.get(this).#cascade.map(arr => {
      const promises: Promise<any[]>[] = [];
      let every = true;
      for (let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          if (!callback.call(thisArg, item, i, arr)) {
            every = false
          }
        } catch (errOrProm) {
          if (typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if (promises.length > 0) {
        throw new ThrowablePromise(Promise.all(promises));
      }
      return every;
    }).get();
  }
  some(callback, thisArg) {
    return thisMap.get(this).#cascade.map(arr => {
      const promises: Promise<any[]>[] = [];
      for (let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          if (callback.call(thisArg, item, i, arr) && promises.length === 0) {
            return true;
          }
        } catch (errOrProm) {
          if (typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if (promises.length > 0) {
        throw new ThrowablePromise(Promise.all(promises));
      }
      return false;
    }).get();
  }
  findIndex(callback, thisArg) {

    return thisMap.get(this).#cascade.map(arr => {
      const promises: Promise<any[]>[] = [];
      for (let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          if (callback.call(thisArg, item, i, arr) && promises.length === 0) {
            return i;
          }
        } catch (errOrProm) {
          if (typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if (promises.length > 0) {
        throw new ThrowablePromise(Promise.all(promises));
      }
      return -1;
    }).get();
  }

  // Invalid methods
  // TODO: more descriptive error messages
  push(): never {
    throw new Error('Invalid method');
  }
  pop(): never {
    throw new Error('Invalid method');
  }
  shift(): never {
    throw new Error('Invalid method');
  }
  unshift(): never {
    throw new Error('Invalid method');
  }

  static of(arrayReturningCb) {
    return new LazyArray( defaultCascade(arrayReturningCb))
  }

  // suspend on iterator access
  [Symbol.iterator]() {
    // TODO: turn this to `map` without it crashing
    return thisMap.get(this).#cascade.map(target => target[Symbol.iterator]()).get();
  }
  values() {
    return new LazyIterator(thisMap.get(this).#cascade.map(target => target.values()))
  }
  keys() {
    return new LazyIterator(thisMap.get(this).#cascade.map(target => target.keys()));
  }
  entries() {
    return new LazyIterator(thisMap.get(this).#cascade.map(target => target.entries()));
  }
}

let getIteratorCascade: (instance: LazyIterator) => SuspenseCascade;
let isLazyIterator: (value: any) => value is LazyIterator;

export class LazyIterator {
  static get [species]() {
    return LazyIterator;
  }
  #cascade: SuspenseCascade;
  constructor(cascade) {
    const proxy = createProxy(this, cascade)
    this.#cascade = cascade;
    thisMap.set(proxy, this);

    return proxy;
  }
  
 
  static {
    isLazyIterator = (instance): instance is LazyIterator => thisMap.has(instance) && (thisMap.get(instance) instanceof LazyIterator);
    getIteratorCascade = (instance: LazyIterator) => thisMap.get(instance).#cascade; 
  }


  next(...args) {
    return thisMap.get(this).#cascade.map(target => {
      return target.next(...args);
    }).get();
  }
  [Symbol.iterator]() {
    return thisMap.get(this).#cascade.map(target => target[Symbol.iterator]()).get();
  }
}

export {getArrayCascade, isLazyArray, getIteratorCascade, isLazyIterator}