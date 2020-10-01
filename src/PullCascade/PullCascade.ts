import { first, tap } from "../utils"
// TODO: test
const PullCascade = cb => {
  const firstCb = first(cb);
  return {
  
    get() {
      return cb()
    },
    map(fn) {
      //TODO: comment
      let firstFn = first(() => fn(firstCb()))
      return PullCascade(firstFn)
    },
    tap(fn) {
      //TODO: comment
      let firstFn = first(tap(() => fn(firstCb())))
      return PullCascade(firstFn);
    },
    get functor() {
      return PullCascade.of
    }
  }
}

PullCascade.of = PullCascade

export default PullCascade;