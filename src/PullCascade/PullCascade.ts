import { first, tap } from "../utils"
// TODO: test
const PullCascade = cb => {
  return {
    get() {
      return cb()
    },
    map(fn) {
      //TODO: comment
      const firstCb = first(cb);

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