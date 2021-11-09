import { first, tapper } from "../utils"
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
    // tap(fn) {
    //   //TODO: comment
      
    //   return this.map(tapper(fn));
    // },

  }
}

PullCascade.of = PullCascade

export { PullCascade }