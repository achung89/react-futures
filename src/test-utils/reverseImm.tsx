import { futureArray } from '../utils';

export let reverseImm = arr => {
  return futureArray(() => {
    let a = [];
    for (let i = arr.length - 1; i >= 0; i--) {
      a.push(arr[i]);
    }
    return a;
  });
};
