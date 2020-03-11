import {ArrayEffect} from '../Effect/Effect';

export const { map, run, tap } = ArrayEffect;

class TransparentArrayEffect<T> extends ArrayEffect<Array<T>> implements Array<T> {

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
  immReverse(...args) {return map(target => target.slice().reverse(...args), this)}
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
  indexOf(...args) { return run(target => target.indexOf(...args), this)}
  includes(...args) { return run( target => target.includes(...args), this)}
  join(...args) { return run(target => target.join(...args), this)}
  lastIndexOf(...args) { return run(target => target.lastIndexOf(...args), this)}
  toString(...args) { return run(target => target.toString(...args), this)}
  toLocaleString(...args) { return run(target => target.toLocaleString(...args), this)}
  forEach(...args) { return run(target => target.forEach(...args), this) }
  find(...args) { return run(target => target.find(...args), this)}
  every(...args) { return run(target => target.every(...args), this)}
  some(...args) { return run(target => target.some(...args), this)}
  findIndex(...args) { return run(target => target.findIndex(...args), this) }


  // Invalid methods
  // TODO: more descriptive error messages
  push(): never { throw new Error('Invalid method')}
  pop(): never { throw new Error('Invalid method')}
  shift(): never{ throw new Error('Invalid method')}

  static of(x) {
    return new TransparentArrayEffect(() => x);
  }

  // implement return and throw
  #suspenseIterator = () => ({
    next: () => {
      return run(target => target.next(), this)
    },
    [Symbol.iterator]: function() { return this }
  });

  [Symbol.iterator]() { return this.#suspenseIterator(); }
  values() { return this.#suspenseIterator(); }
  keys() { return this.#suspenseIterator(); }
  entries() { return this.#suspenseIterator(); }
}

export default TransparentArrayEffect;
