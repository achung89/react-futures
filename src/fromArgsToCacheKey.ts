const refCache = new WeakMap;

const UUIDGeneratorBrowser = () =>
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );

export const getObjectId = obj => {
  if(refCache.has(obj)) return refCache.get(obj);
  const uuid = UUIDGeneratorBrowser();
  refCache.set(obj, uuid);
  return uuid;
}

const stringifyKeys = args => args.map(arg => {
  if(typeof arg === 'object' && arg !== null) {
    return getObjectId(arg);
  }
  else return arg;
});

export const fromArgsToCacheKey = args => JSON.stringify(stringifyKeys(args));