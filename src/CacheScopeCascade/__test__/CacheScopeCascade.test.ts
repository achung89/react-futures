import { CacheScopeCascade } from "../../internal"

test('should set dynamicScope', () => {
  expect(JSON.stringify(CacheScopeCascade.getCurrentScope())).toEqual(JSON.stringify(undefined));
  const cache = {
    cache: new Map(),
    cacheCb: () => new Map()
  };

  new CacheScopeCascade(() => {
    expect(CacheScopeCascade.getCurrentScope()).toBe(cache)
  }, cache)
  expect.assertions(2)

})

test('should set dynamicScope if using point', () => {
  expect(JSON.stringify(CacheScopeCascade.getCurrentScope())).toEqual(undefined);
  
  const cache = {
    cache: new Map(),
    cacheCb: () => new Map()
  };

  CacheScopeCascade.of(() => {
    expect(CacheScopeCascade.getCurrentScope()).toBe(cache)
  }, cache)

  expect.assertions(2)
})
test('should set dynamicScope on map',() => {
  
  expect(JSON.stringify(CacheScopeCascade.getCurrentScope())).toEqual(undefined);
  
  const cache = {
    cache: new Map(),
    cacheCb: () => new Map()
  };
  
  new CacheScopeCascade(() => {
    return null
  }, cache)
    .map(() => {
      expect(CacheScopeCascade.getCurrentScope()).toBe(cache)
    })

    expect.assertions(2)
})


test('should get value',() => {  
  {
  const val = new CacheScopeCascade(() => 1, { cache: new Map(), cacheCb: () => new Map()})
    .map(one =>  one + 1)
    .get()
    expect(val).toEqual(2);
  }
  {
    const val = new CacheScopeCascade(() => 1, { cache: new Map(), cacheCb: () => new Map()})
      .map(one => one + 1)
      .map(two => two + 1)
      .get()
    expect(val).toEqual(3);
  }
})

// TODO: test nested cascade