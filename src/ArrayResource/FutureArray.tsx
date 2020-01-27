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

    return new Proxy(this, {
      get: (target, key, receiver) => {

        if (keyIsIndex(key) && this.#loadingStatus === 'pending') {
          throw this.#promise;
        }

        return Reflect.get(target, key, receiver);
      },
      set: (_target, key, value) => {
        if(!isRendering()) {
          // TODO: more descriptive message
          throw new Error("sideeffects in render is not allowed")
        }
        switch(this.#loadingStatus) {
          case 'pending':
            this.#deferredOperations = pipe(this.#deferredOperations, (tap(target => Reflect.set(target,key,value))));
            break;
          case 'complete':
            //TODO: think through this logic
            return Reflect.get(_target, key, value);

        }
      },
      // TODO: add mutating handlers to deferredOperations
    });
  };
  // immutable methods
  // TODO: pass memoized methods on each subsequent iter
  concat(...args){return this.#copyWithOperation(target => target.concat(...args))}
  filter(...args) {return this.#copyWithOperation(target => target.filter(...args))}
  slice(...args) {return this.#copyWithOperation(target => target.slice(...args))}
  map(...args) {return this.#copyWithOperation(target => target.map(...args))}
  reduce(...args) {return this.#copyWithOperation(target => target.reduce(...args))}
  reduceRight(...args) {return this.#copyWithOperation(target => target.reduceRight(...args))}
  flat(...args) {return this.#copyWithOperation(target => target.flat(...args))}
  flatMap(...args) {return this.#copyWithOperation(target => target.flatMap(...args))}
  immReverse(...args) {return this.#copyWithOperation(target => target.immReverse(...args))}
  immSplice(...args) {return this.#copyWithOperation(target => target.slice().splice(...args))}
  immUnshift(...args) {return this.#copyWithOperation(target => target.slice().unshift(...args))}
  immCopywithin(...args) {return this.#copyWithOperation(target => target.slice().copyWithin(...args))}

  //suspend methods
  indexOf(...args) { return this.#handleSuspense(() => this.#value.indexOf(...args))}
  includes(...args) { return this.#handleSuspense(() => this.#value.includes(...args))}
  join(...args) { return this.#handleSuspense(() => this.#value.join(...args))}
  lastIndexOf(...args) { return this.#handleSuspense(() => this.#value.lastIndexOf(...args))}
  toString(...args) { return this.#handleSuspense(() => this.#value.toString(...args))}
  toLocaleString(...args) { return this.#handleSuspense(() => this.#value.toLocaleString(...args))}

  // mutableMethods  
  splice(...args) {return this.#operateSelf(() => this.#value.splice(...args))}
  copyWithin(...args) {return this.#operateSelf(() => this.#value.copyWithin(...args))}
  sort(...args) {return this.#operateSelf(() => this.#value.sort(...args))}
  unshift(...args) {return this.#operateSelf(() => this.#value.unshift(...args))}
  reverse(...args) {return this.#operateSelf(() => this.#value.reverse(...args))}
  fill(...args) {return this.#operateSelf(() => this.#value.fill(...args))}
  
  // iterator returning methods
  [Symbol.iterator]() {
    switch(this.#loadingStatus) {
      case 'pending':
        return this.#suspenseIterator();
      case 'complete':
        return this.#value[Symbol.iterator]();
    }
  }
  values() {
    switch(this.#loadingStatus) {
      case 'pending':
        return this.#suspenseIterator();
      case 'complete':
        return this.#value.values();
    }

  }
  keys() {
    switch(this.#loadingStatus) {
      case 'pending':
        return this.#suspenseIterator();
      case 'complete':
        return this.#value.keys();
    }
  }
  entries() {
    switch(this.#loadingStatus) {
      case 'pending':
        return this.#suspenseIterator();
      case 'complete':
        return this.#value.entries();
    }
  }
  
  // invalid methods
  // TODO: more descriptive error messages
  push() { throw new Error('Invalid method')}
  pop() { throw new Error('Invalid method')}
  shift() { throw new Error('Invalid method')}



  #suspenseIterator = () => {
    const valueIterator = this.#value[Symbol.iterator]();
    return {
      next: function() {
        if(this.loadingState === 'pending') {
          throw this.#promise;
        }
        if(this.loadingState === 'complete') {
          return valueIterator.next();
        }
      },
      [Symbol.iterator]: function() { return this }
    }
  }
  #handleSuspense = cb => {
      if(isRendering() && this.#loadingStatus === 'pending') {
        throw this.#promise;
      };
      if(isRendering() && this.#loadingStatus === 'complete') {
        return cb();
      }  else if(!isRendering()) {
        // TODO: add custom error message per method
        throw new Error("cannot suspend outside render")
      }
  }
  #copyWithOperation = (cb): FutureArray => {
    switch(this.#loadingStatus) {
      case 'pending':
        const newArr = new FutureArray(this.#promise);
        newArr.#deferredOperations = first(pipe(this.#deferredOperations, cb));
        return newArr;
      case 'complete':
        return FutureArray.of(...cb())
      default:
        // TODO: more descript message
        throw new Error('Unknown Error')
    }
  }
  #operateSelf = (cb) => {
    if(isRendering()) {
      // TODO: implement custom error message per method
      throw new Error('Cannot invoke mutable method ' + method + ' in render. Consider using the immutable variant')
    } 
    if(this.#loadingStatus === 'pending') {
      this.#deferredOperations = first(pipe(this.#deferredOperations, tap(cb)))
      return this;
    }
    if(this.#loadingStatus === 'complete') {
      cb();
      return this;
    }
  }
}

