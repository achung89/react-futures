

type Status = "pending" | "complete" | "error";

export const promiseStatusCache = new WeakMap<Promise<any>, {
  value: any[] | null;
  status: Status;
}>();


export const keyPromiseCache = new WeakMap<any, Promise<any>>();