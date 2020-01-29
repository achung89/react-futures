import React from 'react';
import { pipe, tap, first } from '../utils';
import { promiseCache } from "../shared-properties/promiseCache";



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
  //wrap each operation in a once
  #deferredOperations: (arr: any[]) => any[] = val => val;
  #promise;
  #value = [];
  #loadingStatus;
  constructor(promise) {
    super();
    this.#promise = promise;
    this.#loadingStatus = promiseCache.get(promise).status;
    if(this.#loadingStatus === 'complete') {
      const value = promiseCache.get(promise).value;
      if(!Array.isArray(value)) {
        throw new Error("TypeError: FutureArray received non-array value from promise")
      }
      this.#value = this.#deferredOperations(value);
      
    }
    if(this.#loadingState === 'error') {
      //TODO: more descript error message
      //TODO: should I put error here?
      throw new Error('Unhandled promise exception')
    }

    // TODO: apply for only for ie11 down
    Object.setPrototypeOf(this, FutureArray.prototype);

    return 
  };







  
  // invalid methods
  // TODO: more descriptive error messages
  push() { throw new Error('Invalid method')}
  pop() { throw new Error('Invalid method')}
  shift() { throw new Error('Invalid method')}

}
}

// IO
class FutureDefer extends FutureArray {
  #deferredFn = id => id;
  suspend: () => void;
  #loadingStatus;
  #promise;
  constructor(deferredFn, promise) {
    super();
    this.#deferredFn = deferredFn;
    this.#promise = promise;
    this.#loadingStatus = promiseCache.get(promise).status;
    new Proxy(this, {
      get: (target, key, receiver) => {

        if (keyIsIndex(key) && this.#loadingStatus === 'pending') {
          this.suspend();
        }

        return Reflect.get(target, key, receiver);
      },
      set: (_target, key, value) => {
        if(isRendering()) {
          // TODO: more descriptive message
          throw new Error("sideeffects in render is not allowed")
        }
        this.#tap(target => Reflect.set(target,key,value), 'set');
        return true;
      },
      // TODO: add mutating handlers to deferredOperations
    });
  }
    // immutable methods
  // TODO: pass memoized methods on each subsequent iter
  concat(...args){return this.#map(target => target.concat(...args))}
  filter(...args) {return this.#map(target => target.filter(...args))}
  slice(...args) {return this.#map(target => target.slice(...args))}
  map(...args) {return this.#map(target => target.map(...args))}
  reduce(...args) {return this.#map(target => target.reduce(...args))}
  reduceRight(...args) {return this.#map(target => target.reduceRight(...args))}
  flat(...args) {return this.#map(target => target.flat(...args))}
  flatMap(...args) {return this.#map(target => target.flatMap(...args))}
  immReverse(...args) {return this.#map(target => target.immReverse(...args))}
  immSplice(...args) {return this.#map(target => target.slice().splice(...args))}
  immUnshift(...args) {return this.#map(target => target.slice().unshift(...args))}
  immCopywithin(...args) {return this.#map(target => target.slice().copyWithin(...args))}

  // mutableMethods  
  splice(...args) {return this.#tap(target => target.splice(...args), 'splice')}
  copyWithin(...args) {return this.#tap(target => target.copyWithin(...args), 'copyWithin')}
  sort(...args) {return this.#tap( target => target.sort(...args), 'sort')}
  unshift(...args) {return this.#tap( target => target.unshift(...args), 'unshift')}
  reverse(...args) {return this.#tap(target => target.reverse(...args), 'reverse')}
  fill(...args) {return this.#tap(target => target.fill(...args), 'fill')}
  

  //suspend methods
  indexOf(...args) { return this.#suspend(target => target.indexOf(...args))}
  includes(...args) { return this.#suspend( target => target.includes(...args))}
  join(...args) { return this.#suspend(target => target.join(...args))}
  lastIndexOf(...args) { return this.#suspend(target => target.lastIndexOf(...args))}
  toString(...args) { return this.#suspend(target => target.toString(...args))}
  toLocaleString(...args) { return this.#suspend(target => target.toLocaleString(...args))}
  #suspend = cb => {
    if(!isRendering()) {
      // TODO: add custom error message per method
      throw new Error("cannot suspend outside render")
    }
    if (this.#loadingStatus === 'pending') {
      throw this.#promise;
    }
    if(this.#loadingStatus === 'complete') {
      return new DoneFuture.of(pipe(this.#deferredFn, cb)())
    }
  }
  #map = nextFn =>  new PendingFuture( pipe(this.#deferredFn, nextFn), this.#promise);


  #tap = (fn, name) => {
    if(isRendering()) {
      // TODO: implement custom error message per method
      throw new Error('Cannot invoke mutable operation ' + name + ' in render. Consider using the immutable variant')
    } 
    this.#deferredFn = pipe(this.#deferredFn, tap(fn));
    return this;
  }

  static of(x) {
    return new FutureDefer(() => x);
  }
  #suspenseIterator = () => ({
    next: function() {
        throw this.#promise;
    },
    [Symbol.iterator]: function() { return this }
  });

  [Symbol.iterator]() { return this.#suspenseIterator(); }
  values() { return this.#suspenseIterator(); }
  keys() { return this.#suspenseIterator(); }
  entries() { return this.#suspenseIterator(); }
}


