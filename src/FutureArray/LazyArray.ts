import { species,cascadeMap, map, createCascadeMap, tap, run, createProxy, defaultCascade, thisMap } from '../internal';
import { ThrowablePromise } from '../ThrowablePromise/ThrowablePromise';
import { getRaw, isFuture } from '../utils';



export class LazyArray<T> extends Array<T> {

  constructor(cb, createCascade) {
    super();
    const cascade = createCascade(cb);
    const proxy = createProxy(this, cascade)

    thisMap.set(proxy, this);
    cascadeMap.set(proxy, cascade);
    createCascadeMap.set(proxy, createCascade);

    return proxy;
  }
  static get [species]() {
    return Species
  }
  static isArray = Array.isArray

  // immutable methods
  // TODO: pass memoized methods on each subsequent iter
  concat(...args) {
    return map(target => target.concat(...args), this, cascadeMap.get(this));
  }
  filter(callback, thisArg) {
    return map(arr => {
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
    }, this, cascadeMap.get(this));
  }
  slice(...args) {
    return map(target => target.slice(...args), this, cascadeMap.get(this));
  }
  map(callback, thisArg) {
    return map(arr => {
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
    }, this, cascadeMap.get(this))
  }
  // reduce(...args) {
  //   return map(target => target.reduce(...args), this);
  // }
  // reduceRight(...args) {
  //   return map(target => target.reduceRight(...args), this);
  // }
  flat(...args) {
    return map(target => target.flat(...args), this, cascadeMap.get(this));
  }
  flatMap(callback, thisArg) {
    return map(arr => {
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

      return newArr.flat();
    }, this, cascadeMap.get(this));
  }



  // mutable methods
  splice(...args) {
    return tap(target => target.splice(...args), this, cascadeMap.get(this),'splice');
  }
  copyWithin(...args) {
    return tap(target => target.copyWithin(...args), this, cascadeMap.get(this), 'copyWithin');
  }
  sort(comparator) {
    return tap(target => {
      const promises: Promise<any[]>[] = []
      for (let i = 1; i < target.length; i++) {
        try {
          comparator(target[i - 1], target[i])
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
      return target.sort(comparator)
    }, this, cascadeMap.get(this), 'sort');
  }

  reverse(...args) {
    return tap(target => target.reverse(...args), this, cascadeMap.get(this), 'reverse');
  }

  fill(...args) {
    return tap(target => target.fill(...args), this, cascadeMap.get(this), 'fill');
  }

  //suspend methods
  indexOf(...args) {
    return run(target => target.indexOf(...args), this, cascadeMap.get(this));
  }
  includes(...args) {
    return run(target => target.includes(...args), this, cascadeMap.get(this));
  }
  join(...args) {
    return run(target => target.join(...args), this, cascadeMap.get(this));
  }
  lastIndexOf(...args) {
    return run(target => target.lastIndexOf(...args), this, cascadeMap.get(this));
  }
  toString(...args) {
    return run(target => target.toString(...args), this, cascadeMap.get(this));
  }
  toLocaleString(...args) {
    return run(target => target.toLocaleString(...args), this, cascadeMap.get(this));
  }
  forEach(): never {
    throw new Error('forEach implementation TBD')
  }
  find(callback, thisArg) {
    return run(arr => {

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
    }, this, cascadeMap.get(this));
  }
  every(callback, thisArg) {
    return run(arr => {
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
    }, this, cascadeMap.get(this));
  }
  some(callback, thisArg) {
    return run(arr => {
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
    }, this, cascadeMap.get(this));
  }
  findIndex(callback, thisArg) {
    return run(arr => {
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
    }, this, cascadeMap.get(this));
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
    return new LazyArray(arrayReturningCb, defaultCascade);
  }

  // suspend on iterator access
  [Symbol.iterator]() {
    // TODO: turn this to `map` without it crashing
    return run(target => target[Symbol.iterator](), this, cascadeMap.get(this));
  }
  values() {
    return map(target => target.values(), this, cascadeMap.get(this), LazyIterator);
  }
  keys() {
    return map(target => target.keys(), this, cascadeMap.get(this), LazyIterator);
  }
  entries() {
    return map(target => target.entries(), this, cascadeMap.get(this), LazyIterator);
  }
}

export class LazyIterator {
  static get [species]() {
    return LazyIterator;
  }
  
  constructor(cb, createCascade) {
    const cascade = createCascade(cb);
    const proxy = createProxy(this, cascade)

    thisMap.set(proxy, this);
    cascadeMap.set(proxy, cascade)
    createCascadeMap.set(proxy, createCascade);

    return proxy;
  }
  next(...args) {
    return run(target => {
      return target.next(...args);
    }, this, cascadeMap.get(this));
  }
  [Symbol.iterator]() {
    return run(target => target[Symbol.iterator](), this, cascadeMap.get(this));
  }
}

const Species = LazyArray