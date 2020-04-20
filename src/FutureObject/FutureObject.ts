import { promiseStatusStore } from '../shared-properties';
import { LazyObject } from '../internal';
import { isRendering } from '../internal';

export class FutureObject<T extends object> extends LazyObject<T> {
  constructor(promise) {
    super(() => {
      if (!isRendering()) {
        throw new Error('cannot suspend outside render');
      }
      let meta = promiseStatusStore.get(promise);
      if (typeof meta !== 'undefined') {
        var { status, value } = meta;
      } else {
        throw new Error('No status or value found for promise');
      }
      if (status === 'complete') {
        if (typeof value !== 'object' || typeof value === null) {
          throw new Error(
            'TypeError: FutureObject received non-object value from promise'
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
    });
  }
}
