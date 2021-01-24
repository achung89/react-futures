import { PushCascade } from "../internal"
import {  throwOnce, throwTwice, throwThrice } from "./suspenseFuncs";

describe("complex mutable operations", () => {
  it("should run mutable to mutable to mutable", () => {
    const obj1 = PushCascade.of(() => ({ val: 1 }))

    const obj2 = obj1.tap(obj => { obj.foo = 2 })

    const obj3 = obj2.tap(obj => { obj.bar = 3 })

    const obj4 = obj3.tap(obj => { obj.baz = 4 })

    expect(obj1.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
    expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
    expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
    expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
 })
  it("should run immutable to mutable to mutable", () => {
    const obj1 = PushCascade.of(() => ({ val: 1 }))

    const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

    const obj3 = obj2.tap(obj => { obj.bar = 3 })

    const obj4 = obj3.tap(obj => { obj.baz = 4 })

    expect(obj1.get()).toStrictEqual({ val: 1 })
    expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
    expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
    expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
  })
  it("should run mutable to immutable to mutable", () => {
    const obj1 = PushCascade.of(() => ({ val: 1 }))

    const obj2 = obj1.tap(obj => { obj.foo = 2 })

    const obj3 = obj2.map(obj => ({ ...obj, bar: 3 }))

    const obj4 = obj3.tap(obj => { obj.baz = 4 })


    expect(obj1.get()).toStrictEqual({ val: 1, foo: 2 })
    expect(obj2.get()).toStrictEqual({ val: 1, foo: 2 })
    expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
    expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
  })
  it("should run mutable to mutable to immutable", () => {
    const obj1 = PushCascade.of(() => ({ val: 1 }))

    const obj2 = obj1.tap(obj => { obj.foo = 2 })

    const obj3 = obj2.tap(obj => { obj.bar = 3 })

    const obj4 = obj3.map(obj => ({ ...obj, baz: 4 }))


    expect(obj1.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
    expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
    expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
    expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
  })

  it("should run immutable to immutable to mutable", () => {
    const obj1 = PushCascade.of(() => ({ val: 1 }))

    const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

    const obj3 = obj2.map(obj => ({ ...obj, bar: 3 }))

    const obj4 = obj3.tap(obj => { obj.baz = 4 })


    expect(obj1.get()).toStrictEqual({ val: 1 })
    expect(obj2.get()).toStrictEqual({ val: 1, foo: 2 })
    expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
    expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
  })
  it("should run immutable to mutable to immutable", () => {
    const obj1 = PushCascade.of(() => ({ val: 1 }))

    const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

    const obj3 = obj2.tap(obj => { obj.bar = 3 })

    const obj4 = obj3.map(obj => ({ ...obj, baz: 4 }))

    expect(obj1.get()).toStrictEqual({ val: 1 })
    expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
    expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
    expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
  })

  it("should run mutable to immutable to immutable", () => {
    const obj1 = PushCascade.of(() => ({ val: 1 }))

    const obj2 = obj1.tap(obj => { obj.foo = 2 })

    const obj3 = obj2.map(obj => ({ ...obj, bar: 3 }))

    const obj4 = obj3.map(obj => ({ ...obj, baz: 4 }))


    expect(obj1.get()).toStrictEqual({ val: 1, foo: 2 })
    expect(obj2.get()).toStrictEqual({ val: 1, foo: 2 })
    expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
    expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
  })
 
  it("should run imutable to imutable to imutable", () => {
    const obj1 = PushCascade.of(() => ({ val: 1 }))

    const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

    const obj3 = obj2.map(obj => ({ ...obj, bar: 3 }))

    const obj4 = obj3.map(obj => ({ ...obj, baz: 4 }))


    expect(obj1.get()).toStrictEqual({ val: 1 })
    expect(obj2.get()).toStrictEqual({ val: 1, foo: 2 })
    expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
    expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
  })
})