import { promiseStatusStore } from '../shared-properties';
import { LazyObject } from '../internal';
import { ThrowablePromise } from '../ThrowablePromise/ThrowablePromise';

export class FutureObject<T extends object, K extends object | null> extends LazyObject<T, K> {


  constructor(cascade) {
    super(cascade)
  }
}
