type SuspenseJob<T> = {
  status: T;
} & T extends "done"
  ? {
      value: any;
    }
  : T extends "blocked"
  ? {
      blocker: Promise<any>;
    }
  : T extends "error"
  ? {
      error: Error;
    }
  : {};

interface SuspenseJobQueueType {
  append(fn: (val: any) => any): SuspenseJobQueue;
  getJob(): SuspenseJob<"done" | "blocked" | "error">;
}


export class SuspenseJobQueue implements SuspenseJobQueueType {
  #job: SuspenseJob<"done" | "blocked" | "error">

  constructor(cb) {
    try {
      const value = cb();
      this.#job = {
        status: 'done',
        value
      }
    } catch(errOrProm) {
      if(typeof errOrProm.then === 'function') {
        this.#job = {
          status: 'blocked',
          blocker: errOrProm.then( value => {
            this.#job = {
              status: 'done',
              value
            }
          })
        }
      } else {
        this.#job = {
          status: 'error',
          error: errOrProm
        }
      }
    }
  }
  append(cb) {
    return new SuspenseJobQueue()
  }
  getJob() {
    return this.#job;
  }
}