

export class ThrowablePromise extends Error {
  prom: Promise<any>;
  cause: ThrowablePromise;
  constructor(promOrThrowablePromise) {
    super();
    if(promOrThrowablePromise instanceof ThrowablePromise) {
      this.prom = promOrThrowablePromise.prom
      this.cause = promOrThrowablePromise;

    } else {
      this.prom = promOrThrowablePromise;
    }

    this.message = "Suspend detected outside a permitted zone, this may be caused by accessing a property on a future outside of react or of a suspend zone";
    this.name = "SuspendOutsideReactError";
  }
  then(...args) {
    return this.prom.then(...args);
  }
  finally(...args) {
    return this.prom.finally(...args);
  }
  catch(...args) {
    return this.prom.catch(...args);
  }
}
