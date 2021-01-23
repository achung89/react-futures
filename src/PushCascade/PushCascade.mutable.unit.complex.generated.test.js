import { PushCascade } from "../internal";
import { throwOnce, throwTwice, throwThrice } from "./suspenseFuncs";
jest.useFakeTimers();

describe("Generated scenarios", () => {
    it("should run mutable to mutable to mutable to mutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.tap(obj => { obj.foo = 2 })

      const obj3 = obj2.tap(obj => { obj.bar = 3 })

      const obj4 = obj3.tap(obj => { 
        obj.baz = 4 
      })

      const obj5 = obj4.tap(obj => { obj.foobar = 5 })

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
    it("should run immutable to mutable to mutable to mutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

      const obj3 = obj2.tap(obj => { obj.bar = 3 })

      const obj4 = obj3.tap(obj => { obj.baz = 4 })

      const obj5 = obj4.tap(obj => { obj.foobar = 5 })

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
    it("should run mutable to immutable to mutable to mutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.tap(obj => { obj.foo = 2 })

      const obj3 = obj2.map(obj => ({ ...obj, bar: 3 }))

      const obj4 = obj3.tap(obj => { obj.baz = 4 })

      const obj5 = obj4.tap(obj => { obj.foobar = 5 })

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1, foo: 2 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
    it("should run mutable to mutable to immutable to mutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.tap(obj => { obj.foo = 2 })

      const obj3 = obj2.tap(obj => { obj.bar = 3 })

      const obj4 = obj3.map(obj => ({ ...obj, baz: 4 }))

      const obj5 = obj4.tap(obj => { obj.foobar = 5 })

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
    it("should run mutable to mutable to mutable to immutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.tap(obj => { obj.foo = 2 })

      const obj3 = obj2.tap(obj => { obj.bar = 3 })

      const obj4 = obj3.tap(obj => { obj.baz = 4 })

      const obj5 = obj4.map(obj => ({ ...obj, foobar: 5 }))

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
    it("should run immutable to immutable to mutable to mutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

      const obj3 = obj2.map(obj => ({ ...obj, bar: 3 }))

      const obj4 = obj3.tap(obj => { obj.baz = 4 })

      const obj5 = obj4.tap(obj => { obj.foobar = 5 })

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
    it("should run immutable to mutable to immutable to mutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

      const obj3 = obj2.tap(obj => { obj.bar = 3 })

      const obj4 = obj3.map(obj => ({ ...obj, baz: 4 }))

      const obj5 = obj4.tap(obj => { obj.foobar = 5 })

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
    it("should run immutable to mutable to mutable to immutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

      const obj3 = obj2.tap(obj => { obj.bar = 3 })

      const obj4 = obj3.tap(obj => { obj.baz = 4 })

      const obj5 = obj4.map(obj => ({ ...obj, foobar: 5 }))

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
    it("should run mutable to immutable to immutable to mutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.tap(obj => { obj.foo = 2 })

      const obj3 = obj2.map(obj => ({ ...obj, bar: 3 }))

      const obj4 = obj3.map(obj => ({ ...obj, baz: 4 }))

      const obj5 = obj4.tap(obj => { obj.foobar = 5 })

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1, foo: 2 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
    it("should run mutable to immutable to mutable to immutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.tap(obj => { obj.foo = 2 })

      const obj3 = obj2.map(obj => ({ ...obj, bar: 3 }))

      const obj4 = obj3.tap(obj => { obj.baz = 4 })

      const obj5 = obj4.map(obj => ({ ...obj, foobar: 5 }))

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1, foo: 2 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
    it("should run mutable to mutable to immutable to immutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.tap(obj => { obj.foo = 2 })

      const obj3 = obj2.tap(obj => { obj.bar = 3 })

      const obj4 = obj3.map(obj => ({ ...obj, baz: 4 }))

      const obj5 = obj4.map(obj => ({ ...obj, foobar: 5 }))

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
    it("should run imutable to imutable to imutable to mutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

      const obj3 = obj2.map(obj => ({ ...obj, bar: 3 }))

      const obj4 = obj3.map(obj => ({ ...obj, baz: 4 }))

      const obj5 = obj4.tap(obj => { obj.foobar = 5 })

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })

    it("should run immutable to immutable to mutable to immutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

      const obj3 = obj2.map(obj => ({ ...obj, bar: 3 }))

      const obj4 = obj3.tap(obj => { obj.baz = 4 })

      const obj5 = obj4.map(obj => ({ ...obj, foobar: 5 }))

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
    it("should run immutable to mutable to immutable to immutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

      const obj3 = obj2.tap(obj => { obj.bar = 3 })

      const obj4 = obj3.map(obj => ({ ...obj, baz: 4 }))

      const obj5 = obj4.map(obj => ({ ...obj, foobar: 5 }))

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
    it("should run mutable to immutable to immutable to immutable", async () => {
      const obj1 = PushCascade.of(throwOnce(() => ({ val: 1 })))

      const obj2 = obj1.tap(obj => { obj.foo = 2 })

      const obj3 = obj2.map(obj => ({ ...obj, bar: 3 }))

      const obj4 = obj3.map(obj => ({ ...obj, baz: 4 }))

      const obj5 = obj4.map(obj => ({ ...obj, foobar: 5 }))

      let obj1ThrowCount = 0;

      const cb = async () => {
        try {
          expect(obj1.get()).toStrictEqual({ val: 1, foo: 2 })
        } catch (errOrProm) {
          if (typeof errOrProm.then === "function") {
            obj1ThrowCount++;
            jest.advanceTimersByTime(55);
            await errOrProm;
            return;
          } else
            throw errOrProm;
        }

        expect(obj2.get()).toStrictEqual({ val: 1, foo: 2 })
        expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
        expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
        expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
      };

      await cb();
      expect(obj1ThrowCount).toEqual(1);
      await Promise.resolve();
      jest.runAllTimers();
      obj1ThrowCount = 0;
      await cb();
      expect(obj1ThrowCount).toEqual(0);
    })
});