jest.mock("scheduler", () => require("scheduler/unstable_mock"));

import { createFutureArray } from "../index";
import waitForSuspense from "../test-utils/waitForSuspense";
import waitForLoading from "../test-utils/waitForLoading";
// import renderer, { act} from 'react-test-renderer'
import React, { Suspense } from "react";
import ReactDOM from "react-dom";

import { act } from "react-dom/test-utils";
jest.useFakeTimers();

// test resetting value array prop with future array
/** obj.foo = new Array(() => obj.foo).map() EDIT: will be taken cae of by oblique types*/
// test suspending in same function as instantiation
// test suspending in child
// testing iterating in parent and in child and accessing in child or subchild

let StubFutureArray;
let container;
let root;
const PassThrough = ({ children }) => {
  return <div>{children}</div>;
};
const PropDrill = ({ prop, level }) => {
  const Drilled = [...Array(level)].reduce(
    Comp => {
      return ({ prop }) => <Comp prop={prop} />;
    },
    ({ prop }) => <div>{prop}</div>
  );
  return <Drilled prop={prop} />;
};
const DeepPassThrough = ({ children, level }) => {
  return [...Array(level)].reduce(el => {
    return <PassThrough>{el}</PassThrough>;
  }, children);
};

beforeEach(() => {
  StubFutureArray = createFutureArray(
    val =>
      new Promise((res, rej) => {
        setTimeout(() => {
          try {
            res([1, 2, 3, val]);
          } catch (err) {
            console.error(err);
            rej(err);
          }
        }, 1000);
      })
  );
});
afterEach(() => {
  StubFutureArray.reset();

  StubFutureArray = null;

});
let Deep = ({ numbers }) => <div>{numbers}</div>;

describe("Deep render scenarios", () => {
  test("should render ", async () => {
    let App = ({ nestedFuture = false }) => {
      let numbers = new StubFutureArray(4)
        .map(val => val + 1) // [2,3,4,5]
        .concat([6, 7, 8]) // [2,3,4,5,6,7,8]
        .filter(val => val % 2 === 0) // [2,4,6,8]
        .immReverse(); // [8,6,4,2]

        if (nestedFuture) {
          numbers = createNestedFuture(numbers) // [9,9]
        }
      return <div>{numbers}</div>;
    };

    await testSuspense(<App />, `<div>8642</div>`);

    StubFutureArray.reset();

    await testSuspense(<App nestedFuture />, `<div>99</div>`, 5000);
  });

  test("should render deeply", async () => {
    let App = ({ nestedFuture = false }) => {
      let numbers = new StubFutureArray(4)
        .map(val => val + 1) // [2,3,4,5]
        .concat([6, 7, 8]) // [2,3,4,5,6,7,8]
        .filter(val => val % 2 === 0) // [2,4,6,8]
        .immReverse(); // [8,6,4,2]
        if (nestedFuture) {
          numbers = createNestedFuture(numbers) // [9,9]
        }
      return (
        <div>
          <Deep numbers={numbers} />
        </div>
      );
    };

    await testSuspense(<App />, `<div><div>8642</div></div>`);
    StubFutureArray.reset();
    await testSuspense(<App nestedFuture />, `<div><div>99</div></div>`);
  });

  test("should render very deeply", async () => {
    let AppVeryDeep = ({ nestedFuture = false, level }) => {
      let numbers = new StubFutureArray(4)
        .map(val => val + 1) // [2,3,4,5]
        .concat([6, 7, 8]) // [2,3,4,5,6,7,8]
        .filter(val => val % 2 === 0) // [2,4,6,8]
        .immReverse(); // [8,6,4,2]
        if (nestedFuture) {
          numbers = createNestedFuture(numbers)
        }
      return (
        <div>
          <DeepPassThrough level={level}>
            <Deep numbers={numbers} />
          </DeepPassThrough>
        </div>
      );
    };
    await testSuspense(
      <AppVeryDeep level={5} />,
      `<div><div><div><div><div><div><div>8642</div></div></div></div></div></div></div>`
    );

    StubFutureArray.reset();

    await testSuspense(
      <AppVeryDeep level={5} nestedFuture />,
      `<div><div><div><div><div><div><div>99</div></div></div></div></div></div></div>`
    );

    StubFutureArray.reset();

    await testSuspense(
      <AppVeryDeep level={200} />,
      `<div>`.repeat(202) + "8642" + `</div>`.repeat(202)
    );

    StubFutureArray.reset();

    await testSuspense(
      <AppVeryDeep nestedFuture level={200} />,
      `<div>`.repeat(202) + "99" + `</div>`.repeat(202)
    );
  });
  test("should render with prop drilling", async () => {
    const App = ({ level, nestedFuture = false }) => {
      let numbers = new StubFutureArray(4)
        .map(val => val + 1) // [2,3,4,5]
        .concat([6, 7, 8]) // [2,3,4,5,6,7,8]
        .filter(val => val % 2 === 0) // [2,4,6,8]
        .immReverse(); // [8,6,4,2]

        if (nestedFuture) {
          numbers = createNestedFuture(numbers) // [9,9]
        }
      return <PropDrill prop={numbers} level={level} />;
    };

    await testSuspense(<App level={10} />, "<div>8642</div>");

    StubFutureArray.reset();

    await testSuspense(<App level={10} nestedFuture />, "<div>99</div>");

    StubFutureArray.reset();

    await testSuspense(<App level={200} />, `<div>8642</div>`);

    StubFutureArray.reset();

    await testSuspense(<App level={200} nestedFuture />, `<div>99</div>`);

  });
  test("should render intermediate transformations", async () => {
    const Nested = ({level, nestedFuture, numbers}) => {
      if (nestedFuture) {
        numbers = createNestedFuture(numbers) // [9,9]
      }
      return <PropDrill prop={numbers} level={level}/>
    }
    const App = ({ level, nestedFuture = false }) => {
      let numbers = new StubFutureArray(4)
        .map(val => val + 1) // [2,3,4,5]
        .concat([6, 7, 8]) // [2,3,4,5,6,7,8]
        .filter(val => val % 2 === 0) // [2,4,6,8]
        .immReverse(); // [8,6,4,2]

      return <DeepPassThrough level={level}>
        <Nested level={level} numbers={numbers} nestedFuture={nestedFuture} />
      </DeepPassThrough>;
    };

    await testSuspense(<App level={10} />, "<div><div><div><div><div><div><div><div><div><div><div>8642</div></div></div></div></div></div></div></div></div></div></div>");

    StubFutureArray.reset();

    await testSuspense(<App level={10} nestedFuture={true}/>, "<div><div><div><div><div><div><div><div><div><div><div>99</div></div></div></div></div></div></div></div></div></div></div>")

    StubFutureArray.reset();

    await testSuspense(<App level={200} />, "<div>".repeat(201) + "8642" + "</div>".repeat(201));

    StubFutureArray.reset();

    await testSuspense(<App level={200} nestedFuture={true}/>, "<div>".repeat(201) +"99"+ "</div>".repeat(201))

  });
});

const createNestedFuture = numbers =>{
  let numbers2 = new StubFutureArray(7); //[1,2,3,7];
  return numbers
    .map((num, ind) => num + numbers2[ind]) // [9,8,7,9]
    .filter(num =>
      new StubFutureArray(8) // [1,2,3,8]
        .map(num => num * 3) // [3,6,9,24]
        .includes(num)
    ); //[9,9]
}







const testSuspense = async (el, expected, suspenseTime = 2000) => {
  act(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  act(() => {
    root = ReactDOM.createRoot(container);
  });

  await act(async () => {
    root.render(<Suspense fallback={<div>Loading...</div>}>{el}</Suspense>);
  });

  waitForLoading();

  act(() => {
    expect(container.innerHTML).toEqual(`<div>Loading...</div>`);
  });

  await waitForSuspense(suspenseTime);

  act(() => {
    expect(container.innerHTML).toEqual(expected);
  });

  await act(async () => {
    root.unmount();
  });

  act(() => {
    container.remove();
    container = null;
  });
};
