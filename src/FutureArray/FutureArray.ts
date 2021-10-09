import { promiseStatusStore } from '../shared-properties';
import { LazyArray } from '../internal';
import { isRendering, species } from '../internal';
import { __internal, SuspendOperationOutsideRenderError } from '../internal';

export class FutureArray<T> extends LazyArray<T> {
  static get [species]() {
    return LazyArray;
  }

  constructor(promise, createCascade) {
    super(() => {

      if (!(isRendering() || __internal.suspenseHandlerCount > 0)) {
          // TODO: add custom error message per method
        throw new SuspendOperationOutsideRenderError(`suspend`);
      }

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
        throw promise;
      }

      if (status === 'error') {
        //TODO: more descript error message
        //TODO: should I put error here?
        throw new Error('Unhandled promise exception');
      }
    }, createCascade);

  }
}
