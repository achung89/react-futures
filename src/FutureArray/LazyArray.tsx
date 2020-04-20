import { ArrayEffect } from '../internal';
import { ObjectEffect } from '../internal';

const { map, run, tap } = ArrayEffect;

export class LazyArray<T> extends ArrayEffect<Array<T>> implements Array<T> {
  constructor(deferredFn) {
    super(deferredFn);
  }

  // immutable methods
  // TODO: pass memoized methods on each subsequent iter
  concat(...args) {
    return map(target => target.concat(...args), this);
  }
  filter(...args) {
    return map(target => target.filter(...args), this);
  }
  slice(...args) {
    return map(target => target.slice(...args), this);
  }
  map(...args) {
    return map(target => target.map(...args), this);
  }
  reduce(...args) {
    return map(target => target.reduce(...args), this);
  }
  reduceRight(...args) {
    return map(target => target.reduceRight(...args), this);
  }
  flat(...args) {
    return map(target => target.flat(...args), this);
  }
  flatMap(...args) {
    return map(target => target.flatMap(...args), this);
  }
  
  // mutable methods made immutable
  splice(...args) {
    return map(target => target.slice().splice(...args), this);
  }
  copyWithin(...args) {
    return map(target => target.slice().copyWithin(...args), this);
  }
  sort(...args) {
    return map(target => target.slice().sort(...args), this);
  }
  unshift(...args) {
    return map(target => target.slice().unshift(...args), this);
  }
  reverse(...args) {
    return map(target => target.slice().reverse(...args), this);
  }
  fill(...args) {
    return map(target => target.slice().fill(...args), this);
  }
  
  // mutable methods
  mutableSplice(...args) {
    return tap(target => target.splice(...args), 'splice', this);
  }
  mutableCopyWithin(...args) {
    return tap(target => target.copyWithin(...args), 'copyWithin', this);
  }
  mutableSort(...args) {
    return tap(target => target.sort(...args), 'sort', this);
  }
  mutableUnshift(...args) {
    return tap(target => target.unshift(...args), 'unshift', this);
  }
  mutableReverse(...args) {
    return tap(target => target.reverse(...args), 'reverse', this);
  }
  mutableFill(...args) {
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
  forEach(...args) {
    return run(target => target.forEach(...args), this);
  }
  find(...args) {
    return run(target => target.find(...args), this);
  }
  every(...args) {
    return run(target => target.every(...args), this);
  }
  some(...args) {
    return run(target => target.some(...args), this);
  }
  findIndex(...args) {
    return run(target => target.findIndex(...args), this);
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

  static of(arrayReturningCb) {
    return new LazyArray(arrayReturningCb);
  }

  // suspend on iterator access
  [Symbol.iterator]() {
    return map(target => target[Symbol.iterator](), this, LazyIterator);
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
  static get [Symbol.species]() {
    return LazyIterator;
  }
  next(...args) {
    return ObjectEffect.run(target => target.next(...args), this);
  }
  [Symbol.iterator]() {
    return ObjectEffect.run(target => target[Symbol.iterator](), this);
  }
}
