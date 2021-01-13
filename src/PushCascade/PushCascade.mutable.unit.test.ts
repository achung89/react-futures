import { PushCascade } from "../internal"


describe('mutable operations', () => {
  it("should run single mutable operation", () => {
    const cascade = PushCascade.of(() => ({ val: 1 }))
    
    let mutated = cascade.tap(target => {
      target.val = 2
    })
    expect(cascade.get()).toStrictEqual({ val: 2 })
    expect(mutated.get()).toStrictEqual({ val: 2 })
  })

  it("should run mutable to immutable operation", () => {
    const cascade = PushCascade.of(() => ({ val: 1}))
    let mutated = cascade
                    .tap(target => {
                      target.val = 2
                    })
                    .map(obj => ({...obj, bar: 3}))

    expect(cascade.get()).toStrictEqual({ val: 2 })
    expect(mutated.get()).toStrictEqual({ val: 2, bar: 3 })
  })

  it("should run immutable to mutable operation", () => {
    const cascade = PushCascade.of(() => ({ val: 1}))
    let mutated = cascade                    
                    .map(obj => ({...obj, bar: 3}))
                    .tap(target => {
                      target.val = 2
                    })

    expect(cascade.get()).toStrictEqual({ val: 1 })
    expect(mutated.get()).toStrictEqual({ val: 2, bar: 3 })
  })

  it("should run immutable to mutable to immutable operation", () => {
    const cascade = PushCascade.of(() => ({ val: 1}))
    let mutated = cascade
                    .map(obj => ({...obj, bar: 3}))
                    .tap(target => {
                      target.val = 2
                    })

    const immutated = mutated.map(obj => ({ ...obj, foo: 4}))

    expect(cascade.get()).toStrictEqual({ val: 1 })
    expect(mutated.get()).toStrictEqual({ val: 2, bar: 3 })
    expect(immutated.get()).toStrictEqual({ val: 2, bar: 3, foo:4})
  })

  it("should run mutable to immutable to mutable", () => {
    const cascade = PushCascade.of(() => ({ val: 1}))
    let mutated = cascade
                    .tap(target => {
                      target.val = 2
                    })
    const mutated2 = mutated.map(obj => ({...obj, bar: 3}))


    const immutated = mutated2.tap(obj => {
      obj.val = 4
    })

    expect(cascade.get()).toStrictEqual({ val: 2 })
    expect(mutated.get()).toStrictEqual({ val: 2})
    expect(mutated2.get()).toStrictEqual({ val: 4, bar: 3 })
    expect(immutated.get()).toStrictEqual({ val: 4, bar: 3 })
  })
})



