

type Status = "pending" | "complete" | "error";

export const promiseCache = new WeakMap<Promise<any>, {
  value: any[] | null;
  status: Status;
}>();
