import FutureArray from "./ArrayResource/FutureArr";
import FutureObject from "./FutureObject/FutureObj";

type Status = "pending" | "complete" | "error";

export const promiseCache = new WeakMap<Promise<any>, {
  value: any[] | null;
  status: Status;
}>();

type Future = FutureObject | FutureArray;
export const deferredOperations = new WeakMap<Future, (fut:Future) => Future>();

export const values = new WeakMap<Future, any>();