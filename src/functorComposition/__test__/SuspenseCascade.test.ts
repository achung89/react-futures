import { SuspenseCascade } from "../../internal";

const initialCacheValue = undefined
test('should set dynamicScope', () => {
  expect(JSON.stringify(SuspenseCascade.getCurrentScope())).toEqual(initialCacheValue);
  
  const cascade = SuspenseCascade.of(() => {
    expect(SuspenseCascade.getCurrentScope()).toEqual(1)
  }, 1)
  expect.assertions(1)

  cascade.get()

  expect.assertions(2)

})

test('should set dynamicScope on map',() => {
  expect(JSON.stringify(SuspenseCascade.getCurrentScope())).toEqual(initialCacheValue)
  
  const cascade = SuspenseCascade.of(() => {
    return null
  }, 1)
    .map(() => {
      expect(SuspenseCascade.getCurrentScope()).toEqual(1)
    })

    expect.assertions(1)

    cascade.get();

    expect.assertions(2);
})


test('should get value',() => {  
  {
  const val = SuspenseCascade.of(() => 1, 1)
    .map(one =>  one + 1)
    .get()
    expect(val).toEqual(2);
  }
  {
    const val = SuspenseCascade.of(() => 1, 1)
      .map(one => one + 1)
      .map(two => two + 1)
      .get()
      expect(val).toEqual(3);
    }
})
