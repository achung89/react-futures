import React from 'react';
import { pipe, tap, first } from '../utils';
import { promiseCache } from "../shared-properties/promiseCache";
import { map, tap } from '../FutureSuper';

const extends = (...classes) => {
   const linked = class {};
   for(let Class of classes.slice().reverse()) {
    linked = 
   }
}
// TODO: error handler? (refer scala docs)

const isRendering = () => {
  var dispatcher = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current
  return (dispatcher !== null)
};
const keyIsIndex =  key => {
  const isSymbol = (x): x is symbol => typeof x === 'symbol',
        isNaN = (x) => !Number.isNaN(parseInt(x, 10));

  return !isSymbol(key) && !isNaN(key) && key >= 0;
}

// TODO: figure out naming for added (immutable) methods
export default class FutureArray extends Array {
  constructor(deferredFn) {
    super(deferredFn);

    // TODO: apply for only for ie11 down
    //Object.setPrototypeOf(this, FutureArray.prototype);
 
  };







  
  // invalid methods
  // TODO: more descriptive error messages
  push() { throw new Error('Invalid method')}
  pop() { throw new Error('Invalid method')}
  shift() { throw new Error('Invalid method')}


}

// IO
class LazyFuture extends FutureArray {

  constructor(deferredFn) {
    super(deferredFn)
  }
    // immutable methods
  // TODO: pass memoized methods on each subsequent iter
  concat(...args){ return map(target => target.concat(...args), this)}
  filter(...args) {return map(target => target.filter(...args), this)}
  slice(...args) {return map(target => target.slice(...args), this)}
  map(...args) {return map(target => target.map(...args), this)}
  reduce(...args) {return map(target => target.reduce(...args), this)}
  reduceRight(...args) { return map(target => target.reduceRight(...args), this)}
  flat(...args) {return map(target => target.flat(...args), this)}
  flatMap(...args) {return map(target => target.flatMap(...args), this)}
  immReverse(...args) {return map(target => target.immReverse(...args), this)}
  immSplice(...args) {return map(target => target.slice().splice(...args), this)}
  immUnshift(...args) {return map(target => target.slice().unshift(...args), this)}
  immCopywithin(...args) {return map(target => target.slice().copyWithin(...args), this)}

  // mutableMethods  
  splice(...args) {return tap(target => target.splice(...args), 'splice', this)}
  copyWithin(...args) {return tap(target => target.copyWithin(...args), 'copyWithin', this)}
  sort(...args) {return tap( target => target.sort(...args), 'sort', this)}
  unshift(...args) {return tap( target => target.unshift(...args), 'unshift', this)}
  reverse(...args) {return tap(target => target.reverse(...args), 'reverse', this)}
  fill(...args) {return tap(target => target.fill(...args), 'fill', this)}
  

  //suspend methods
  indexOf(...args) { return this.#suspend(target => target.indexOf(...args))}
  includes(...args) { return this.#suspend( target => target.includes(...args))}
  join(...args) { return this.#suspend(target => target.join(...args))}
  lastIndexOf(...args) { return this.#suspend(target => target.lastIndexOf(...args))}
  toString(...args) { return this.#suspend(target => target.toString(...args))}
  toLocaleString(...args) { return this.#suspend(target => target.toLocaleString(...args))}



  static of(x) {
    return new LazyFuture(() => x);
  }
  #suspenseIterator = () => ({
    next: function() {
        //TODO: remove need for promise here
        throw this.#promise;
    },
    [Symbol.iterator]: function() { return this }
  });

  [Symbol.iterator]() { return this.#suspenseIterator(); }
  values() { return this.#suspenseIterator(); }
  keys() { return this.#suspenseIterator(); }
  entries() { return this.#suspenseIterator(); }
}


