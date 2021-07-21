import { PullCascade, CacheScopeCascade, composeFunctors } from "../internal";


const PullCacheCascade = composeFunctors(PullCascade, CacheScopeCascade);

export { PullCacheCascade }
