import { PushCascade, DynamicScopeCascade, composeFunctors } from "../internal";
const PushCacheCascade = composeFunctors(PushCascade, DynamicScopeCascade);

export { PushCacheCascade }
