import { promiseStatusStore } from '../shared-properties';
import { LazyArray } from '../internal';
import {  species } from '../internal';
import { ThrowablePromise } from '../ThrowablePromise/ThrowablePromise';

export class FutureArray<T> extends LazyArray<T> {
  static get [species]() {
    return LazyArray;
  }

  constructor(promise, createCascade) {
    super(createCascade(() => {


      let promiseFSM = promiseStatusStore.get(promise);

      if (typeof promiseFSM !== 'undefined') {
        var { status, value } = promiseFSM;
      } else {
        throw new Error('No status or value found for promise');
      }

      if (status === 'complete') {
        if (!Array.isArray(value)) {
          throw new Error(
            'TypeError: FutureArray received non-array value from promise'
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
    }));

  }
}
