type SuspenseJob<T> = {
  status: T;
} & T extends "success"
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
  new (fn: (val: any) => any): SuspenseJobQueue;
  append(fn: (val: any) => any): SuspenseJobQueue;
  getJob(): SuspenseJob<"success" | "blocked" | "error">;
}

class SuspenseJobQueue implements SuspenseJobQueueType {
  
}