import DynamicScopeCascade from "../DynamicScopeCascade/DynamicScopeCascade";
import PullCascade from "../PullCascade/PullCascade";
import { composeFunctors } from "./composeFunctors";
const PullCacheCascade = composeFunctors(PullCascade, DynamicScopeCascade);

export default PullCacheCascade
