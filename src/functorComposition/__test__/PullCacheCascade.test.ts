import { PullCacheCascade } from "../../internal";


test('should set dynamicScope', () => {
  expect(PullCacheCascade.getDynamicScope()).toEqual(null);
  
  const cascade = PullCacheCascade.of(() => {
    expect(PullCacheCascade.getDynamicScope()).toEqual(1)
  }, 1)
  expect.assertions(1)

  cascade.get()

  expect.assertions(2)

})

test('should set dynamicScope on map',() => {
  expect(PullCacheCascade.getDynamicScope()).toEqual(null);
  
  const cascade = PullCacheCascade.of(() => {
    return null
  }, 1)
    .map(() => {
      expect(PullCacheCascade.getDynamicScope()).toEqual(1)
    })

    expect.assertions(1)

    cascade.get();

    expect.assertions(2);
})


test('should get value',() => {  
  {
  const val = PullCacheCascade.of(() => 1, 1)
    .map(one =>  one + 1)
    .get()
    expect(val).toEqual(2);
  }
  {
    const val = PullCacheCascade.of(() => 1, 1)
      .map(one => one + 1)
      .map(two => two + 1)
      .get()
      expect(val).toEqual(3);
    }
})
