import { PushCascade, CacheScopeCascade, composeFunctors } from "../internal";

const PushCacheCascade = composeFunctors(PushCascade, CacheScopeCascade);

export { PushCacheCascade }
