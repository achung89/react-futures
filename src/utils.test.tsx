jest.mock("scheduler", () => require("scheduler/unstable_mock"));

import React, { Suspense } from "react";
import { futureObject, futureArray } from "./internal";
import { LazyObject } from "./internal";
import waitForSuspense from "./test-utils/waitForSuspense";
import { act } from "react-dom/test-utils";
import { render } from "./test-utils/rtl-renderer";
import { waitFor, wait } from "@testing-library/dom";
import { unwrapProxy, toPromise, lazyObject, lazyArray } from "./utils";
import extractValue from "./test-utils/extractValue";
import { reverseImm } from "./test-utils/reverseImm";
import ReactDOM from "react-dom";
import delay from "delay";

expect.extend(require("./test-utils/renderer-extended-expect"));

// TODO: test basic cache behaviour in and out of render
// TODO: test error handling
const expectedJSON = (value) => ({
  foo: "futon",
  bar: "barcandy",
  bazz: "bazzerita",
  value,
});
// TODO: test obj instance methods
// TODO: assert return values of Object/FutureObj static methods
const fetchJson = (val) =>
  new Promise((res, rej) => {
    setTimeout(() => {
      try {
        Scheduler.unstable_yieldValue("Promise Resolved");
        res(expectedJSON(val));
      } catch (err) {
        rej(err);
      }
    }, 100);
  }).catch((err) => {
    throw err;
  });
const fetchArray = (val) =>
  new Promise((res, rej) => {
    setTimeout(() => {
      try {
        Scheduler.unstable_yieldValue("Promise Resolved");
        res([2, 3, 4, val]);
      } catch (err) {
        console.error(err);
        throw err;
      }
    }, 100);
  }).catch((err) => {
    console.error(err);
    throw err;
  });

const App = ({ inRender }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogSuspense action={inRender}>
        <div>foo</div>
      </LogSuspense>
    </Suspense>
  );
};

const LogSuspense = ({ action, children }) => {
  try {
    action();
    Scheduler.unstable_yieldValue("No Suspense");

    return children;
  } catch (promise) {
    if (typeof promise.then === "function") {
      Scheduler.unstable_yieldValue(`Suspend!`);
    }
    throw promise;
  }
};
let FutureObj;
let container;
let Scheduler;
let FutureArr;
beforeEach(() => {
  jest.resetModules();
  jest.useFakeTimers();
  Scheduler = require("scheduler/unstable_mock");
  container = document.createElement("div");
  document.body.appendChild(container);
  FutureObj = futureObject(fetchJson);
  FutureArr = futureArray(fetchArray);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
  FutureObj = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
  FutureArr = null;
});

describe("getRaw", () => {
  test("extractValue", async () => {
    let futureObj;
    const inRender = () => {
      futureObj = new FutureObj(3);
    };
    let renderer;
    act(() => {
      renderer = render(<App inRender={inRender} />, container);
    });
    const { getByText } = renderer;
    await waitForSuspense(150);
    await waitFor(() => getByText("foo"));
    expect(Scheduler).toHaveYielded(["No Suspense", "Promise Resolved"]);
    expect(unwrapProxy(futureObj)).toBeInstanceOf(LazyObject);
    const result = await extractValue(futureObj);
    expect(result).toEqual(expectedJSON(3));
  });
});
const invert = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [value, key]));

describe("toPromise", () => {
  test("outside render", async () => {
    jest.useRealTimers();
    const makeFuture = (val) => new FutureObj(val);

    const futureObj = makeFuture(4);
    const expected = expectedJSON(4);
    const result = await toPromise(futureObj);
    expect(result).toEqual(expected);
    //test that it returns same result
    const secondTime = await toPromise(futureObj);
    expect(secondTime).toEqual(expected);
    const transformed = FutureObj.entries(makeFuture(5));
    const transformedExpected = Object.entries(expectedJSON(5));

    const transformedResult = await toPromise(transformed);

    expect(transformedResult).toEqual(transformedExpected);
  });

  test("outside render multiple", async () => {
    jest.useRealTimers();
    const makeFuture = (val) => new FutureObj(val);

    const transformed = FutureObj.assign(
      makeFuture(5),
      lazyObject(() => invert(makeFuture(4)))
    );

    const transformedExpected = Object.assign(
      expectedJSON(5),
      invert(expectedJSON(4))
    );
    const transformedResult = await toPromise(transformed);

    expect(transformedResult).toEqual(transformedExpected);
  });

  test("inside render", async () => {
    let result;
    const inRender = async () => {
      const futureObj = new FutureObj(3);
      result = await toPromise(futureObj);
    };
    let renderer;
    act(() => {
      renderer = render(<App inRender={inRender} />, container);
    });
    const { getByText } = renderer;
    await waitForSuspense(150);
    await waitFor(() => getByText("foo"));
    expect(result).toEqual(expectedJSON(3));
  });
  test("inside render multiple", async () => {
    let transformedResult;
    const inRender = async () => {
      const makeFuture = (val) => new FutureObj(val);

      const transformed = FutureObj.assign(
        makeFuture(5),
        lazyObject(() => invert(makeFuture(4)))
      );

      transformedResult = await toPromise(transformed);
    };
    let renderer;
    act(() => {
      renderer = render(<App inRender={inRender} />, container);
    });
    const { getByText } = renderer;
    await waitForSuspense(150);
    await waitFor(() => getByText("foo"));

    const transformedExpected = Object.assign(
      expectedJSON(5),
      invert(expectedJSON(4))
    );
    expect(transformedResult).toEqual(transformedExpected);
  });
});

test("lazyObject should defer ", async () => {
  const futureObj = new FutureObj(1);
  const lazified = lazyObject(() => invert(futureObj));
  const value = extractValue(lazified);
  await waitForSuspense(150);
  expect(await value).toEqual(invert(expectedJSON(1)));

  const lazified2 = lazyObject(() => invert(expectedJSON(2)));

  const value2 = extractValue(lazified2);
  await waitForSuspense(150);
  expect(await value2).toEqual(invert(expectedJSON(2)));
});

test.each([1, "3", null, undefined])(
  "lazyObject should throw if given %s",
  async (val) => {
    const expectedError = new TypeError('expected result of lazyObject to be of type object')
    await expect(
      async () => {
        await toPromise(lazyObject(() => val));
      }
    ).rejects.toEqual(expectedError)
  }
);

test.each([{}, 1, "3", null, undefined])(
  "lazyObject should throw if given %s",
  async (val) => {
    const expectedError = new TypeError('expected result of lazyArray to be of type array')
    await expect(
      (async () => {
        await toPromise(lazyArray(() => val));
      })()
    ).rejects.toEqual(expectedError);
  }
);
test("lazyArray should defer", async () => {
  const futureArr = new FutureArr(2);
  const lazified = lazyArray(() => reverseImm(futureArr));
  const value = extractValue(lazified);

  await waitForSuspense(150);
  expect(await value).toEqual([2, 3, 4, 2].reverse());
  const lazified2 = lazyArray(() => [2, 3, 4, 2].reverse());
  const value2 = extractValue(lazified2);
  await waitForSuspense(150);

  expect(await value2).toEqual([2, 3, 4, 2].reverse());
});

test("lazyArray should defer with map", async () => {
  const futureArr = new FutureArr(2); // 2 3 4 2
  const lazified = reverseImm(futureArr) // 2 4 3 2
    .map((val) => val + 1) // 3 5 4 3

  const value = extractValue(lazified);

  await waitForSuspense(150);
  expect(await value).toEqual([3, 5, 4, 3]);
  const lazified2 = lazyArray(() => [3, 4, 5, 3].reverse());
  const value2 = extractValue(lazified2);
  await waitForSuspense(150);

  expect(await value2).toEqual([3, 4, 5, 3].reverse());
});

test("lazyArray should handle nested lazy array outside render", async () => {
  const array = lazyArray(() => lazyArray(() => [1, 2, 3, 4]));
  let renderer;

  const App = ({ }) => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <div>{array}</div>
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(0);
  await waitFor(() => getByText("1234"));
});

test("lazyArray should handle nested lazy array outside render with map method", async () => {
  const array = lazyArray(() => lazyArray(() => [1, 2, 3, 4])).map(
    (val) => val + 1
  );
  let renderer;

  const App = ({ }) => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <div>{array}</div>
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(0);
  await waitFor(() => getByText("2345"));
});

test("lazyArray should handle nested lazy array outside render with filter method", async () => {
  const array = lazyArray(() => lazyArray(() => [1, 2, 3, 4])).filter(
    (val) => val % 2
  );
  let renderer;

  const App = ({ }) => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <div>{array}</div>
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(0);
  await waitFor(() => getByText("13"));
});

test("lazyArray should handle nested lazy array inside render", async () => {
  let renderer;

  const App = ({ }) => {
    const array = lazyArray(() => lazyArray(() => [1, 2, 3, 4]));

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <div>{array}</div>
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(0);
  await waitFor(() => getByText("1234"));
});

test("lazyArray should handle nested lazy array inside render with map method", async () => {
  let renderer;

  const App = ({ }) => {
    const array = lazyArray(() => lazyArray(() => [1, 2, 3, 4])).map(
      (val) => val + 1
    );

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <div>{array}</div>
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(0);
  await waitFor(() => getByText("2345"));
});

test("lazyArray should handle nested lazy array inside render with filter method", async () => {
  let renderer;

  const App = ({ }) => {
    const array = lazyArray(() => lazyArray(() => [1, 2, 3, 4])).filter(
      (val) => val % 2
    );
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <div>{array}</div>
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(0);
  await waitFor(() => getByText("13"));
});

test("lazyArray should handle nested future array outside render", async () => {
  const array = lazyArray(futureArray(async () => [1, 2, 3, 4]).of);
  let renderer;
  const Comp = () => <div>{array}</div>;

  const App = ({ }) => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Comp />
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(0);
  await waitFor(() => getByText("1234"));
});

test("lazyArray should handle nested future array outside render", async () => {
  const array = lazyArray(futureArray(async () => [1, 2, 3, 4]).of).map(
    (val) => val + 1
  );
  let renderer;
  const Comp = () => <div>{array}</div>;

  const App = ({ }) => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Comp />
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(0);
  await waitFor(() => getByText("2345"));
});

test("lazyArray should handle nested future array outside render 1", async () => {
  const array = lazyArray(futureArray(async () => [1, 2, 3, 4]).of).filter(
    (val) => val % 2
  );
  let renderer;
  const Comp = () => <div>{array}</div>;

  const App = ({ }) => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Comp />
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(0);
  await waitFor(() => getByText("13"));
});

test("lazyArray should handle nested future array outside render 2", async () => {
  const array = lazyArray(
    futureArray(async () => {
      await delay(100);
      return [1, 2, 3, 4];
    }).of
  ).filter((val) => val % 2);
  let renderer;
  const Comp = () => <div>{array}</div>;

  const App = ({ }) => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Comp />
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(100);
  await waitFor(() => getByText("13"));
});

test("lazyArray should handle nested future array inside render 1", async () => {
  let renderer;
  const prom = async () => [1, 2, 3, 4];
  const fut = futureArray(prom);

  const Comp = () => {
    const array = lazyArray(fut.of);
    return <div>{array}</div>;
  };

  const App = ({ }) => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Comp />
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(0);
  await waitFor(() => getByText("1234"));
});

test("lazyArray should handle nested future array inside render 2", async () => {
  let renderer;
  const prom = async () => {
    await delay(100);
    return [1, 2, 3, 4];
  };
  const fut = futureArray(prom);

  const Comp = () => {
    const array = lazyArray(fut.of);
    return <div>{array}</div>;
  };

  const App = ({ }) => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Comp />
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(100);
  await waitFor(() => getByText("1234"));
});

test("lazyArray should handle nested future array inside render with map 1", async () => {
  let renderer;
  const prom = async () => [1, 2, 3, 4];
  const fut = futureArray(prom);

  const Comp = () => {
    const array = lazyArray(fut.of).map((val) => val + 1);
    return <div>{array}</div>;
  };

  const App = ({ }) => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Comp />
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(0);
  await waitFor(() => getByText("2345"));
});

test("lazyArray should handle nested future array inside render with map 2", async () => {
  let renderer;
  const prom = async () => {
    await delay(100);
    return [1, 2, 3, 4];
  };
  const fut = futureArray(prom);

  const Comp = () => {
    const array = lazyArray(fut.of).map((val) => val + 1);
    return <div>{array}</div>;
  };

  const App = ({ }) => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Comp />
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(100);
  await waitFor(() => getByText("2345"));
});

test("lazyArray should handle nested future array inside render", async () => {
  let renderer;
  const prom = async () => [1, 2, 3, 4];
  const fut = futureArray(prom);

  const Comp = () => {
    const array = lazyArray(fut.of).filter((val) => val % 2);
    return <div>{array}</div>;
  };

  const App = ({ }) => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Comp />
      </Suspense>
    );
  };
  act(() => {
    renderer = render(<App />, container);
  });
  const { getByText } = renderer;
  await waitForSuspense(0);
  await waitFor(() => getByText("13"));
});

// TODO:
// useEffect: false
// in render: true
// outside render: false
// on click: false
//
// describe('isReactRendering', () => {
//   let container;
//   let root;
//   beforeEach(() => {
//     container = document.createElement('div');
//     document.body.appendChild(container);
//     root = ReactDOM.createRoot(container);
// });

// })

describe('setConfig', () => {
  it('should set error config', () => {

  })
})