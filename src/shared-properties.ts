type Status = 'pending' | 'complete' | 'error';
type StatusCacheValue = {
  value: any[] | null;
  status: Status;
};

export const promiseStatusStore = new WeakMap<Promise<any>, StatusCacheValue>();