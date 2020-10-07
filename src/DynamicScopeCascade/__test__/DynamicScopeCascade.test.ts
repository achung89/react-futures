import { DynamicScopeCascade } from "../../internal"

test('should set dynamicScope', () => {
  expect(DynamicScopeCascade.getDynamicScope()).toEqual(null);
  
  new DynamicScopeCascade(() => {
    expect(DynamicScopeCascade.getDynamicScope()).toEqual(1)
  }, 1)
  expect.assertions(2)

})

test('should set dynamicScope if using point', () => {
  expect(DynamicScopeCascade.getDynamicScope()).toEqual(null);
  
  DynamicScopeCascade.of(() => {
    expect(DynamicScopeCascade.getDynamicScope()).toEqual(1)
  }, 1)
  expect.assertions(2)
})
test('should set dynamicScope on map',() => {
  expect(DynamicScopeCascade.getDynamicScope()).toEqual(null);
  
  new DynamicScopeCascade(() => {
    return null
  }, 1)
    .map(() => {
      expect(DynamicScopeCascade.getDynamicScope()).toEqual(1)
    })

    expect.assertions(2)
})


test('should get value',() => {  
  {
  const val = new DynamicScopeCascade(() => 1, 1)
    .map(one =>  one + 1)
    .get()
    expect(val).toEqual(2);
  }
  {
    const val = new DynamicScopeCascade(() => 1, 1)
      .map(one => one + 1)
      .map(two => two + 1)
      .get()
    expect(val).toEqual(3);
  }
})

// TODO: test nested cascade