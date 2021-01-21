
const createThrower = (throws, callback) => {
  let callCount = 0;
  let promise = new Promise<void>((res, rej) => {
    setTimeout(() => {
      res()
    }, 50)
  })
  return (...args) => {
    if (callCount >= throws) {
      return callback(...args)
    }
    callCount++;
    throw promise
  }
}
export const suspenseHandler = async cb => {
  try {
    return cb()
  } catch (errOrProm) {
    if (typeof errOrProm.then === 'function') {
      await errOrProm
      return cb()
    }
    throw errOrProm
  }
}

export const throwOnce = cb => createThrower(1, cb);
export const throwTwice = cb => createThrower(2, cb);
export const throwThrice = cb => createThrower(3, cb);
export const upperCase = string => string.toUpperCase()
export const spaceOut = string => string.split('').join(' ')
export const dunder = string => `__${string}`
export const dollar = string => string  + '$'