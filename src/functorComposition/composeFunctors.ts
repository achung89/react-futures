export const composeFunctors = (functor1, functor2) => {
  const Functor1and2 = fun1 => ({
    get: () => fun1.get().get(),
    map(fn) {
      return Functor1and2(fun1.map(fun2 => fun2.map(fn)))
    },
    tap(fn) {
      return Functor1and2(fun1.tap(fun2 => fun2.tap(fn)))
    },
    get functor() {
      return Functor1and2.of
    }
  })

  Functor1and2.of = (x, ...rest) => Functor1and2(functor1.of(() => functor2.of(x, ...rest), ...rest))

  const staticKeys = new Set([
    ...Object.getOwnPropertyNames(functor1), 
    ...Object.getOwnPropertyNames(functor2)]
    .filter(key => !['of', 'length', 'name'].includes(key)))

  for (const key of staticKeys) {
    Functor1and2[key] = typeof functor1[key] === 'undefined' ? functor2[key] : functor1[key]
  }

  return Functor1and2;
}

