import { PushCascade } from "../internal"
import {  throwOnce, throwTwice, throwThrice } from "./suspenseFuncs";

describe("complex mutable operations", () => {
  it("should run mutable to mutable", () => {
    const obj1 = PushCascade.of(() => ({ val: 1 }))

    const obj2 = obj1.tap(obj => { obj.foo = 2 })

    const obj3 = obj2.tap(obj => { obj.bar = 3 })


    expect(obj1.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
    expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
    expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
 })
  it("should run immutable to mutable", () => {
    const obj1 = PushCascade.of(() => ({ val: 1 }))

    const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

    const obj3 = obj2.tap(obj => { obj.bar = 3 })


    expect(obj1.get()).toStrictEqual({ val: 1 })
    expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
    expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
  })
  it("should run mutable to immutable", () => {
    const obj1 = PushCascade.of(() => ({ val: 1 }))

    const obj2 = obj1.tap(obj => { obj.foo = 2 })

    const obj3 = obj2.map(obj => ({ ...obj, bar: 3 }))


    expect(obj1.get()).toStrictEqual({ val: 1, foo: 2 })
    expect(obj2.get()).toStrictEqual({ val: 1, foo: 2 })
    expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
  })


  it("should run immutable to immutable", () => {
    const obj1 = PushCascade.of(() => ({ val: 1 }))

    const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

    const obj3 = obj2.map(obj => ({ ...obj, bar: 3 }))



    expect(obj1.get()).toStrictEqual({ val: 1 })
    expect(obj2.get()).toStrictEqual({ val: 1, foo: 2 })
    expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
  })
})