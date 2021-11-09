
const unwrapPromise = (promOrThrowable: any): any => {

    if (promOrThrowable instanceof Promise) {
        return promOrThrowable;
    }

    if (promOrThrowable instanceof ThrowablePromise) {
        return promOrThrowable.prom;
    }

    if (promOrThrowable instanceof Error) {
        return new ThrowablePromise(promOrThrowable);
    }

    return new ThrowablePromise(new Error(`${promOrThrowable} is not a promise or a ThrowablePromise`));
}

export class ThrowablePromise extends Error {
  prom: Promise<any>;
  cause: ThrowablePromise;
  constructor(promOrThrowablePromise) {
    super();
    this.prom = unwrapPromise(promOrThrowablePromise);
    this.cause = promOrThrowablePromise;


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
