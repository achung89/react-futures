

test("should render very deeply", async () => {
  const getNumbers = () => new StubFutureArray(4)
                            .map(val => val + 1) // [2,3,4,5]
                            .concat([6, 7, 8]) // [2,3,4,5,6,7,8]
                            .filter(val => val % 2 === 0) // [2,4,6,8]
                            .immReverse(); // [8,6,4,2]
  let numbers = getNumbers();
  
  const AppVeryDeep = ({ nestedFuture = false, level }) => {
    const nums = nestedFuture ? createNestedFuture(numbers) : numbers
    return (
      <div>
        <DeepPassThrough level={level}>
          <Deep numbers={nums} />
        </DeepPassThrough>
      </div>
    );
  };

  await testSuspenseWithLoader(
    <AppVeryDeep level={5} />,
    "<div>".repeat(7) + `8642` + "</div>".repeat(7)
  );