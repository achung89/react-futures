



class ArrayResource extends Array {
  #value;
  constructor(...args) {
    super(...args)
    this.#value = args;

    return new Proxy(this, {
      get: (target, key, ...rest) => {
        const keyIsIndex = typeof key === 'number' && key < this.length && key > 0;
        const isThenable =  typeof this.#value[key].then === 'function';

        // should all thenables be permitted, or only instances of Promise?
        if(keyIsIndex && isThenable) {
          throw this.#value[key];
        }
        return Reflect.get(target, key, ...rest);
      }
    });
  };
  
}


