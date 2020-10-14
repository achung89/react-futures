import { ArrayEffect } from '../internal';
import { ObjectEffect,species } from '../internal';
import { PullCascade } from '../PullCascade/PullCascade';
import { defaultCascade, metadataMap } from '../utils';

const { map, run, tap } = ArrayEffect;

export class LazyArray<T> extends ArrayEffect<Array<T>> implements Array<T> {
  constructor(cb, createCascade) {
    super(cb, createCascade);
    
  }
  static get [species]() {
    return LazyArray;
  }

  // immutable methods
  // TODO: pass memoized methods on each subsequent iter
  concat(...args) {
    return map(target => target.concat(...args), this);
  }
  filter(callback, thisArg) {
    return map(arr => {
      const Species = arr.constructor[Symbol.species];
      const newArr = new Species;
      const promises: Promise<any[]>[] = [];
      for(let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          if(callback.call(thisArg, item, i, arr)) {
            newArr.push(item);
          }
        } catch(errOrProm) {
          if(typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if(promises.length > 0) {
        throw Promise.all(promises);
      }
      return newArr;
    }, this);
  }
  slice(...args) {
    return map(target => target.slice(...args), this);
  }
  map(callback, thisArg) {
    return map(arr => {
      const Species = arr.constructor[Symbol.species];
      const newArr = new Species;
      const promises: Promise<any[]>[] = [];
      for(let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          newArr.push(callback.call(thisArg, item, i, arr));
        } catch(errOrProm) {
          if(typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if(promises.length > 0) {
        throw Promise.all(promises);
      }
      return newArr;
    }, this)
  }
  // reduce(...args) {
  //   return map(target => target.reduce(...args), this);
  // }
  // reduceRight(...args) {
  //   return map(target => target.reduceRight(...args), this);
  // }
  flat(...args) {
    return map(target => target.flat(...args), this);
  }
  flatMap(callback, thisArg) {
    return map( arr => {
      const Species = arr.constructor[Symbol.species];
      const newArr = new Species;
      const promises: Promise<any[]>[] = [];
      for(let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          newArr.push(callback.call(thisArg, item, i, arr));
        } catch(errOrProm) {
          if(typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if(promises.length > 0) {
        throw Promise.all(promises);
      }
      return newArr.flat();
    }, this);
  }
  

  
  // mutable methods
  splice(...args) {
    // we use map because return futr is not the same as passed in futr for splice
    return tap(target => target.splice(...args), 'splice', this);
  }
  copyWithin(...args) {
    return tap(target => target.copyWithin(...args), 'copyWithin', this);
  }
  sort(comparator) {
    return tap(target => {
      const promises: Promise<any[]>[] = []
      for(let i = 1; i < target.length; i ++) {
        try{
          comparator(target[i - 1], target[i])
        } catch(errOrProm) {
          if(typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if(promises.length > 0) {
        throw Promise.all(promises);
      }
      return target.sort(comparator)
    }, 'sort', this);
  }

  reverse(...args) {
    return tap(target => target.reverse(...args), 'reverse', this);
  }

  fill(...args) {
    return tap(target => target.fill(...args), 'fill', this);
  }

  //suspend methods
  indexOf(...args) {
    return run(target => target.indexOf(...args), this);
  }
  includes(...args) {
    return run(target => target.includes(...args), this);
  }
  join(...args) {
    return run(target => target.join(...args), this);
  }
  lastIndexOf(...args) {
    return run(target => target.lastIndexOf(...args), this);
  }
  toString(...args) {
    return run(target => target.toString(...args), this);
  }
  toLocaleString(...args) {
    return run(target => target.toLocaleString(...args), this);
  }
  forEach(): never {
    throw new Error('forEach implementation TBD')
  }
  find(callback, thisArg) {
    return run(arr => {
      const promises: Promise<any[]>[] = [];
      let foundItem;
      let found = false;
      for(let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          if(callback.call(thisArg, item, i, arr)) {
            foundItem = found ? foundItem : item;
          }
        } catch(errOrProm) {
          if(typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if(promises.length > 0) {
        throw Promise.all(promises);
      }
      return foundItem;
    }, this);
  }
  every(callback, thisArg) {
    return run(arr => {
      const promises: Promise<any[]>[] = [];
      let every = true;
      for(let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          if(!callback.call(thisArg, item, i, arr)) {
            every = false
          }
        } catch(errOrProm) {
          if(typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if(promises.length > 0) {
        throw Promise.all(promises);
      }
      return every;
    }, this);
  }
  some(callback, thisArg) {
    return run(arr => {
      const promises: Promise<any[]>[] = [];
      for(let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          if(callback.call(thisArg, item, i, arr) && promises.length === 0) {
            return true;
          }
        } catch(errOrProm) {
          if(typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if(promises.length > 0) {
        throw Promise.all(promises);
      }
      return false;
    }, this);
  }
  findIndex(callback, thisArg) {
    return run(arr => {
      const promises: Promise<any[]>[] = [];
      for(let i = 0; i < arr.length; i++) {
        try {
          const item = arr[i];
          if(callback.call(thisArg, item, i, arr) && promises.length === 0) {
            return i;
          }
        } catch(errOrProm) {
          if(typeof errOrProm.then === 'function') {
            promises.push(errOrProm);
            continue;
          }
          throw errOrProm;
        }
      }
      if(promises.length > 0) {
        throw Promise.all(promises);
      }
      return -1;
    }, this);
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
    return run(target => target[Symbol.iterator](), this);
  }
  values() {
    return map(target => target.values(), this, LazyIterator);
  }
  keys() {
    return map(target => target.keys(), this, LazyIterator);
  }
  entries() {
    return map(target => target.entries(), this, LazyIterator);
  }
}

export class LazyIterator extends ObjectEffect {
  static get [species]() {
    return LazyIterator;
  }
  next(...args) {
    return ObjectEffect.run(target => {
      return target.next(...args);
    }, this);
  }
  [Symbol.iterator]() {
    return ObjectEffect.run(target => target[Symbol.iterator](), this);
  }
}
