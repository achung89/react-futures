jest.mock("scheduler", () => require("scheduler/unstable_mock"));
import { Suspense, useEffect } from "react";
import { futureObject, toPromise } from "./internal";
import { act } from "react-dom/test-utils";
import { LazyArray, LazyIterator } from "./FutureArray/LazyArray";
import { render } from "./test-utils/rtl-renderer";
import waitForSuspense from "./test-utils/waitForSuspense";
import { wait, waitFor } from "@testing-library/dom";
import { unwrapProxy, lazyArray, lazyObject, getRaw } from "./utils";
import extractValue from "./test-utils/extractValue";
import { fetchArray, fetchObject } from "./fetches";
import { FutureArray } from "./internal";
import delay from "delay";

expect.extend(require("./test-utils/renderer-extended-expect"));

// TODO: setter should not suspend
// TODO: lazy before suspense, eager after suspense <=== does this still apply???????
// TODO: should entries, values, and keys throw, or return an iterator of futureArrays?
// TODO: should push and unshift suspend since they require knowledge of length?
// TODO: all subsequently created arrays should all share the same promise
// TODO: test freeze, seal, delete
// TODO: test error handling
// TODO: imm methods
// TODO: future value shouldn't be accessible from outside render ( add get raw value function )
let Scheduler;

let container;

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetModules();
  Scheduler = require("scheduler/unstable_mock");
  container = document.createElement("div");
  document.body.appendChild(container);
});
afterEach(async () => {
  document.body.removeChild(container);
  container = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
  	// Print the handles still opened

});

const LogSuspense = ({ action, children }) => {
  try {
    action();
    Scheduler.unstable_yieldValue("No Suspense");
    return children;
  } catch (promise) {
    if (typeof promise.then === "function") {
      Scheduler.unstable_yieldValue(`Suspend!`);
    } else {
      Scheduler.unstable_yieldValue(`Error!`);
    }
    throw promise;
  }
};

describe("Array operations", () => {
  test.each`
    name        | method
    ${"concat"} | ${(arr) => arr.concat([6, 7])}
    ${"filter"} | ${(arr) => arr.filter((num) => num % 2)}
  `(
    `Applies defers native immutable method $name both in and outside render `,
    async ({ method }) => {
      let created;
      const futrArr = fetchArray("https://about.com/blogs");

      expect(() => {
        expect(unwrapProxy(method(futrArr))).toBeInstanceOf(LazyArray);
      }).not.toThrow();

      let renderer;
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <LogSuspense
              action={() => {
                created = method(futrArr);
              }}
            >
              foo
            </LogSuspense>
          </Suspense>,
          container
        );
      });

      const { getByText } = renderer;

      expect(Scheduler).toHaveYielded(["No Suspense"]);

      // need to do it twice, one for the fetch and one for `.json()`
      await waitForSuspense(150);
      await waitForSuspense(0);
      expect(Scheduler).toHaveYielded(["Promise Resolved"]);
      await waitFor(() => getByText("foo"));

      expect(unwrapProxy(created)).toBeInstanceOf(LazyArray);

      const result = await extractValue(created);
      expect(result).toEqual(method([2, 3, 4, 5]));
    }
  );

  test.each`
    name         | method
    ${"entries"} | ${(arr) => arr.entries()}
    ${"values"}  | ${(arr) => arr.values()}
  `(
    `Applies defers native iterator-returning immutable method $name both in and outside render`,
    async ({ method }) => {
      let created;
      const futrArr = fetchArray("https://about.com/blogs");
      expect(() => {
        expect(unwrapProxy(method(futrArr))).toBeInstanceOf(LazyIterator);
      }).not.toThrow();
      let renderer;
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <LogSuspense
              action={() => {
                created = method(futrArr);
              }}
            >
              foo
            </LogSuspense>
          </Suspense>,
          container
        );
      });
      const { getByText } = renderer;

      expect(Scheduler).toHaveYielded(["No Suspense"]);

      await waitForSuspense(150);
      expect(Scheduler).toHaveYielded(["Promise Resolved"]);

      await waitFor(() => getByText("foo"));
      expect(unwrapProxy(created)).toBeInstanceOf(LazyIterator);
      const result = await extractValue(created);
      expect([...result]).toEqual([...method([2, 3, 4, 5])]);
    }
  );

  //indexOf, includes, join, lastIndexOf, toString, toSource, toLocaleString, pop, shift, every, find, findIndex, forEach, some, Symbol.iterator

  test.each`
    name         | method                                                    | expected
    ${"indexOf"} | ${(arr) => arr.indexOf(2)}                                | ${0}
    ${"reduce"}  | ${(arr) => arr.reduce((coll, i) => [...coll, i + 3], [])} | ${[5, 6, 7, 8]}
  `(
    `suspends on $name inside render and throws outside render`,
    async ({ method, expected }) => {
      const futureArray = fetchArray("https://about.com/blogs");

      const inRender = () => method(futureArray);
      const outsideRender = () =>
        expect(() =>
          method(futureArray)
        ).toThrowError(/** TODO: outofrender error */);

      act(() => {
        outsideRender();
      });

      let renderer;
      let created;
      expect(() => method(futureArray)).toThrow(); //TODO: specify error
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <LogSuspense
              action={() => {
                created = inRender();
              }}
            >
              foo
            </LogSuspense>
          </Suspense>,
          container
        );
      });
      const { getByText } = renderer;
      expect(Scheduler).toHaveYielded(["Suspend!"]);

      await waitForSuspense(150);
      await waitForSuspense(0);
      expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspense"]);
      await waitFor(() => getByText("foo"));
      expect(created).toEqual(expected);
      //TODO: test created
    }
  );
  //TODO: invalid methods pop shift and push

  test("subclasses Array", async () => {
    const resources = fetchArray("https://about.com/blogs");
    //suspends on Array.from, Array.isArray, have Array.of static method
    expect(unwrapProxy(resources)).toBeInstanceOf(Array);
    expect(Array.isArray(resources)).toEqual(true);
    expect(() => Array.from(resources)).toThrow();

    let created;
    expect(() => Array.from(resources)).toThrowError(); //TODO: specify error
    let renderer;
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <LogSuspense
            action={() => {
              created = Array.from(resources);
            }}
          >
            foo
          </LogSuspense>
        </Suspense>,
        container
      );
    });
    const { getByText } = renderer;

    expect(Scheduler).toHaveYielded(["Suspend!"]);
    await waitForSuspense(150);
    await waitFor(() => getByText("foo"));
    expect(created).toBeInstanceOf(Array);
    expect(created).not.toBeInstanceOf(FutureArray);
    expect(created).toEqual([2, 3, 4, 5]);

    expect(unwrapProxy(LazyArray.of(() => [2, 3, 4]))).toBeInstanceOf(
      LazyArray
    );
  });
});

describe("Running iteration callbacks in parallel", () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  test("filter outside render", async () => {
    const futureArray = fetchArray("https://about.com/blogs");

    const without3 = futureArray.filter(
      (num) =>
        num + fetchObject("https://about.com/person?value=" + num).value !== 6
    );

    const without3Res = await toPromise(without3);

    // timeout of futureArray + timeout of FutureVal
    expect(without3Res).toEqual([2, 4, 5]);
  }, 400);

  test("map outside render", async () => {
    const futureArray = fetchArray("https://about.com/blogs");
    let double = futureArray.map(
      (num) => num + fetchObject("https://about.com/person?value=" + num).value
    );
    const doubleRes = await toPromise(double);
    expect(doubleRes).toEqual([4, 6, 8, 10]);
  }, 400);

  test("flatMap outside render", async () => {
    const futureArray = fetchArray("https://about.com/blogs");

    let flatted = futureArray.flatMap((num) =>
      fetchArray("https://about.com/blogs?value=" + num)
    );

    const flattedRes = await toPromise(flatted);
    expect(flattedRes).toEqual([
      2, 3, 4, 2, 2, 3, 4, 3, 2, 3, 4, 4, 2, 3, 4, 5,
    ]);
  }, 400);

  test("find", async () => {
    const futureArray = fetchArray("https://about.com/blogs");
    let val;
    const arr = lazyArray(() => {
      val = futureArray.find(
        (num) =>
          num + fetchObject("https://about.com/person?value=" + num).value === 6
      );
      return [];
    });
    await toPromise(arr);
    expect(val).toEqual(3);
  }, 400);

  test("every", async () => {
    const futureArray = fetchArray("https://about.com/blogs");
    let val;
    const arr = lazyArray(() => {
      val = futureArray.every(
        (num) =>
          num === fetchObject("https://about.com/person?value=" + num).value
      );
      return [];
    });
    await toPromise(arr);
    expect(val).toEqual(true);
  }, 400);

  test("some", async () => {
    const futureArray = fetchArray("https://about.com/blogs");
    let val;
    const arr = lazyArray(() => {
      val = futureArray.some((num) => {
        let fetchNum;
        if (num === 3) {
          fetchNum = 4;
        } else {
          fetchNum = num;
        }

        const value = fetchObject(
          "https://about.com/person?value=" + fetchNum
        ).value;
        return num !== value;
      });
      return [];
    });
    await toPromise(arr);
    expect(val).toEqual(true);
  }, 400);
  test("findIndex", async () => {
    const futureArray = fetchArray("https://about.com/blogs");
    let val;
    const arr = lazyArray(() => {
      val = futureArray.findIndex(
        (num) =>
          num + fetchObject("https://about.com/person?value=" + num).value === 6
      );
      return [];
    });

    await toPromise(arr);
    expect(val).toEqual(1);
  }, 400);
});

describe("callback as inputs", () => {
  it("should yield correct value for given string input", async () => {
    const arr = fetchArray("https://about.com/blogs?value=1");
    let renderer;
    const App = () => <div>{arr}</div>;

    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>,
        container
      );
    });

    const { getByText } = renderer;
    await waitForSuspense(0);
    await waitForSuspense(150);
    
    expect(Scheduler).toHaveYielded(["Promise Resolved"]);
    await waitFor(() => getByText("2341"));
  });

  // callbacks as inputs
  it("should allow callbacks as inputs", async () => {
    const arr = fetchArray(() => "https://about.com/blogs?value=1");
    let renderer;
    const App = () => <div>{arr}</div>;
    
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>,
        container
      );
    });

    const { getByText } = renderer;

    await waitForSuspense(0);
    await waitForSuspense(150);
    await waitFor(() => getByText("2341"));
  });

  it("input callbacks should be a suspend zone", async () => {
    const Val = futureObject(async (val) => {
      await delay(100);
      return { value: 1 };
    });

    

    const arr = fetchArray(
      () => `https://about.com/blogs?value=${Val.of("key").value}`
    );
    const App = () => {

      return <div>{arr}</div>;
    }

    let renderer;
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>,
        container
      );
    });

    const { getByText } = renderer;
    await waitForSuspense(0);
    await waitForSuspense(100);
    expect(Scheduler).toHaveYielded([]);
    await waitForSuspense(100);
  
    await waitFor(() => getByText("2341"));
  });

});

