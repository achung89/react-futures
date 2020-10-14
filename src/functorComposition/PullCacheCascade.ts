import { PullCascade, DynamicScopeCascade, composeFunctors } from "../internal";


const PullCacheCascade = composeFunctors(PullCascade, DynamicScopeCascade);

export { PullCacheCascade }
