import { first, tap } from "../utils"
// TODO: test
const PullCascade = cb => {
  const firstCb = first(cb);

  return {
    get() {
      return firstCb()
    },
    map(fn) {
      //TODO: comment
      
      return PullCascade(() => fn(firstCb()))
    },
    tap(fn) {
      //TODO: comment
      
      return this.map(tap(fn));
    },
    get functor() {
      return PullCascade.of
    }
  }
}

PullCascade.of = PullCascade

export { PullCascade }