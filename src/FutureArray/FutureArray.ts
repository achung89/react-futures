import { promiseStatusStore } from '../shared-properties';
import { LazyArray } from '../internal';
import { isRendering } from '../internal';
import React from 'react';
export class FutureArray<T> extends LazyArray<T> {
  static get [Symbol.species]() {
    return LazyArray;
  }

  constructor(promise) {
    super(() => {
      let meta = promiseStatusStore.get(promise);

      if (typeof meta !== 'undefined') {
        var { status, value } = meta;
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
        if (!isRendering()) {
          // TODO: add custom error message per method
          throw new Error(`cannot suspend outside render`);
        }

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
