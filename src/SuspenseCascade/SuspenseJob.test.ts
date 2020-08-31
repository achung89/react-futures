import { SuspenseJob } from "./SuspenseCascade"
import { upperCase, spaceOut, throwOnce, throwTwice, throwThrice, dunder, dollar } from "./suspenseFuncs";

describe('SuspenseJob', () => {
  describe('throws once', () => {
    it('should throw on suspense', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(spaceOut);
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwOnce(upperCase))
        .map(spaceOut);
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("J O H N N Y   B R A V O")
    })
    it('should handle maps not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(throwOnce(spaceOut));
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwOnce(upperCase))
        .map(throwOnce(spaceOut));
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwOnce(upperCase))
        .map(spaceOut)
        .map(throwOnce(dunder))
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwOnce(upperCase))
        .map(spaceOut)
        .map(throwOnce(dunder))
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwOnce(upperCase))
        .map(spaceOut)
        .map(throwOnce(dunder))
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(throwOnce(spaceOut))
        .map(dunder)
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw -> not-throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwOnce(upperCase))
        .map(spaceOut)
        .map(throwOnce(dunder))
        .map(dollar)
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
  
    it('should handle maps not-throw -> throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(throwOnce(spaceOut))
        .map(dunder)
        .map(throwOnce(dollar))
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
    it('should handle maps not-throw -> throw -> throw -> not-throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(throwOnce(spaceOut))
        .map(throwOnce(dunder))
        .map(dollar)
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
    it('should handle maps throw -> not-throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwOnce(upperCase))
        .map(spaceOut)
        .map(dunder)
        .map(throwOnce(dollar))
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
    it('should handle maps throw -> throw -> throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwOnce(upperCase))
        .map(throwOnce(spaceOut))
        .map(throwOnce(dunder))
        .map(throwOnce(dollar))
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
    it('should handle maps not-throw -> not-throw -> not-throw -> not-throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(spaceOut)
        .map(dunder)
        .map(dollar)
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
  })
  describe('throws twice', () => {
    it('should throw on suspense', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(spaceOut);
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwTwice(upperCase))
        .map(spaceOut);
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("J O H N N Y   B R A V O")
    })
    it('should handle maps not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(throwTwice(spaceOut));
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwTwice(upperCase))
        .map(throwTwice(spaceOut));
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwTwice(upperCase))
        .map(spaceOut)
        .map(throwTwice(dunder))
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwTwice(upperCase))
        .map(spaceOut)
        .map(throwTwice(dunder))
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwTwice(upperCase))
        .map(spaceOut)
        .map(throwTwice(dunder))
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(throwTwice(spaceOut))
        .map(dunder)
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw -> not-throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwTwice(upperCase))
        .map(spaceOut)
        .map(throwTwice(dunder))
        .map(dollar)
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
  
    it('should handle maps not-throw -> throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(throwTwice(spaceOut))
        .map(dunder)
        .map(throwTwice(dollar))
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
    it('should handle maps not-throw -> throw -> throw -> not-throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(throwTwice(spaceOut))
        .map(throwTwice(dunder))
        .map(dollar)
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
    it('should handle maps throw -> not-throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwTwice(upperCase))
        .map(spaceOut)
        .map(dunder)
        .map(throwTwice(dollar))
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
    it('should handle maps throw -> throw -> throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwTwice(upperCase))
        .map(throwTwice(spaceOut))
        .map(throwTwice(dunder))
        .map(throwTwice(dollar))
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
    it('should handle maps not-throw -> not-throw -> not-throw -> not-throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(spaceOut)
        .map(dunder)
        .map(dollar)
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
  })
  describe('throws thrice', () => {
    it('should throw on suspense', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(spaceOut);
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwThrice(upperCase))
        .map(spaceOut);
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("J O H N N Y   B R A V O")
    })
    it('should handle maps not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(throwThrice(spaceOut));
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwThrice(upperCase))
        .map(throwThrice(spaceOut));
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwThrice(upperCase))
        .map(spaceOut)
        .map(throwThrice(dunder))
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwThrice(upperCase))
        .map(spaceOut)
        .map(throwThrice(dunder))
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwThrice(upperCase))
        .map(spaceOut)
        .map(throwThrice(dunder))
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(throwThrice(spaceOut))
        .map(dunder)
  
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O")
    })
    it('should handle maps throw -> not-throw -> throw -> not-throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwThrice(upperCase))
        .map(spaceOut)
        .map(throwThrice(dunder))
        .map(dollar)
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
  
    it('should handle maps not-throw -> throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(throwThrice(spaceOut))
        .map(dunder)
        .map(throwThrice(dollar))
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
    it('should handle maps not-throw -> throw -> throw -> not-throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(throwThrice(spaceOut))
        .map(throwThrice(dunder))
        .map(dollar)
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
    it('should handle maps throw -> not-throw -> not-throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwThrice(upperCase))
        .map(spaceOut)
        .map(dunder)
        .map(throwThrice(dollar))
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
    it('should handle maps throw -> throw -> throw -> throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(throwThrice(upperCase))
        .map(throwThrice(spaceOut))
        .map(throwThrice(dunder))
        .map(throwThrice(dollar))
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
    it('should handle maps not-throw -> not-throw -> not-throw -> not-throw', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
        .map(upperCase)
        .map(spaceOut)
        .map(dunder)
        .map(dollar)
      try {
        expect(() => cascade.get()).toThrow();
        cascade.get()
      } catch (errOrProm) {
        if (typeof errOrProm.then === 'function') {
          await errOrProm
        } else {
          throw errOrProm
        }
      }
  
      expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
  })
  describe('mix and match throw count', () => {
    it('should handle mix and match of throw counts', async () => {
      const cascade = new SuspenseJob(Promise.resolve('johnny bravo'))
      .map(throwOnce(upperCase))
      .map(spaceOut)
      .map(throwTwice(dunder))
      .map(throwThrice(dollar))
    try {
      expect(() => cascade.get()).toThrow();
      cascade.get()
    } catch (errOrProm) {
      if (typeof errOrProm.then === 'function') {
        await errOrProm
      } else {
        throw errOrProm
      }
    }

    expect(cascade.get()).toEqual("__J O H N N Y   B R A V O$")
    })
  })
})