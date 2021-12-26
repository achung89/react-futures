import { LazyArray } from '../internal';

export class FutureArray<T> extends LazyArray<T> {


  constructor(cascade) {
    super(cascade);

  }
}
