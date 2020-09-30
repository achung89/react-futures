const refCache = new WeakMap;
class ObjectKey {
  uuid: string;
  constructor(uuid) {
    this.uuid = uuid;
  }
}
// https://www.30secondsofcode.org/js/s/uuid-generator-browser
const UUIDGeneratorBrowser = () =>
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );

const replaceObjWithUUID = args => args.map(arg => {
  if(refCache.has(arg)) return refCache.get(arg);
  
  if(typeof arg === 'object' && arg !== null) {
    const uuid = new ObjectKey(UUIDGeneratorBrowser());
    refCache.set(arg, uuid);
    return uuid;
  } 
  else return arg;
});

export default args => JSON.stringify(replaceObjWithUUID(args));