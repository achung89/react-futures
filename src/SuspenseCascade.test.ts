import SuspenseCascade from "./SuspenseCascade";
import { testSuspenseWithLoader } from "./test-utils/testSuspense";

const createThrower = (throws, callback) => {
  let callCount = 0;
  return (...args) => {
    if (callCount === throws) {
      return callback(...args)
    }
    callCount++;
    throw new Promise((res, rej) => {
      setTimeout(res, 100)
    })
  }
}


const throwOnce = cb => createThrower(1, cb);
const throwTwice = cb => createThrower(2, cb);
const upperCase = string => string.toUpperCase()
const spaceOut = string => string.split('').join(' ')
const dunder = string => `__${string}`


describe('SuspenseCascade', () => {

  it('should return value if no promises throw', () => {
    const suspense = SuspenseCascade(() => 'johnny bravo')
    expect(suspense.get()).toEqual('johnny bravo')
  })
  it('should map callbacks', () => {
    {
      const suspense = SuspenseCascade(() => 'johnny bravo')
        .map(upperCase);
      expect(suspense.get()).toEqual('JOHNNY BRAVO')
    }
    {
      const suspense = SuspenseCascade(() => 'johnny bravo')
        .map(upperCase)
        .map(spaceOut)
      expect(suspense.get()).toEqual('J O H N N Y   B R A V O')
    }
  })
  it('should throw suspense', async () => {
    {
      let suspender = SuspenseCascade(() => 'johnny bravo')
                        .map(throwOnce(upperCase))
      try {
        expect(() => suspender.get()).toThrow();
        suspender.get();
      } catch (prom) {
        expect(prom).toBeInstanceOf(Promise);
        await prom
      }
      expect(suspender.get()).toEqual('JOHNNY BRAVO')

    }

  })
})