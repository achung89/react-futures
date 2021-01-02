
export const createNestedFuture = (numbers, NestedConstructor) => {
  let numbers2 = new NestedConstructor(7); //[1,2,3,7];

  return numbers
    .map((num, ind) => num + numbers2[ind]) // [9,8,7,9]
    .filter(num => new NestedConstructor(8) // [1,2,3,8]
      .map(num => num * 3) // [3,6,9,24]
      .includes(num)
    ); //[9,9]
};
