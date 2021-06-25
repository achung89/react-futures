import { PushCacheCascade, DynamicScopeCascade } from "../../internal";


test('should set dynamicScope', () => {
  expect(JSON.stringify(PushCacheCascade.getDynamicScope())).toEqual(JSON.stringify({ cache: null, cacheCb: () => void 0}));
  
  const cascade = PushCacheCascade.of(() => {
    expect(PushCacheCascade.getDynamicScope()).toEqual(1)
  }, 1)
  expect.assertions(1)

  cascade.get()

  expect.assertions(2)

})

test('should set dynamicScope on map',() => {
  expect(JSON.stringify(PushCacheCascade.getDynamicScope())).toEqual(JSON.stringify({ cache: null, cacheCb: () => void 0}))
  
  const cascade = PushCacheCascade.of(() => {
    return null
  }, 1)
    .map(() => {
      expect(DynamicScopeCascade.getDynamicScope()).toEqual(1)
    })

    expect.assertions(1)

    cascade.get();

    expect.assertions(2);
})


test('should get value',() => {  
  {
  const val = PushCacheCascade.of(() => 1, 1)
    .map(one =>  one + 1)
    .get()
    expect(val).toEqual(2);
  }
  {
    const val = PushCacheCascade.of(() => 1, 1)
      .map(one => one + 1)
      .map(two => two + 1)
      .get()
      expect(val).toEqual(3);
    }
})
