import { promiseStatusStore } from '../shared-properties';
import { LazyObject } from '../internal';
import { species } from '../internal';
import { ThrowablePromise } from '../ThrowablePromise/ThrowablePromise';

export class FutureObject<T extends object, K extends object | null> extends LazyObject<T, K> {
  static get [species]() {
    return LazyObject;
  }

  constructor(promise, createCascade) {
    super(createCascade(() => {

      let meta = promiseStatusStore.get(promise);

      if (typeof meta !== 'undefined') {
        var { status, value } = meta;
      } else {
        throw new Error('No status or value found for promise');
      }

      if (status === 'complete') {
        if (typeof value !== 'object' || typeof value === null) {
          throw new TypeError(
            'FutureObject received non-object value from promise'
          );
        }
        return value;
      }

      if (status === 'pending') {
        throw new ThrowablePromise(promise);
      }

      if (status === 'error') {
        //TODO: more descript error message
        //TODO: should I put error here?
        throw new Error('Unhandled promise exception');
      }
    }))
  }
}
