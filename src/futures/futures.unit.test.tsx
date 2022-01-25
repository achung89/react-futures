import { waitFor } from "@testing-library/dom";
import { act } from "@testing-library/react";
import { Suspense } from "react";
import { FutureObject } from "../FutureObject/FutureObject";
import { createArrayResource } from "../internal";
import { reverseImm } from "../test-utils/reverseImm";
import { render } from "../test-utils/rtl-renderer";
import waitForSuspense from "../test-utils/waitForSuspense";
import { futureArray } from "./futures";


expect.extend(require("../test-utils/renderer-extended-expect"));


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
  FutureObj = createObjectResource(fetchJson);
  FutureArr = createArrayResource(fetchArray);
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
    expect(unwrapProxy(futureObj)).toBeInstanceOf(FutureObject);
    const result = await extractValue(futureObj);
    expect(result).toEqual(expectedJSON(3));
  });
});
//ure array should handle async functions
// future array throw if used inside render without a cache key
test.todo('futureArray should handle async functions')
test.todo('futureObject should handle async functions')
test.todo('futureArray should handle suspending inside async functions')
test.todo('futureObject should handle suspending inside async functions')
test.todo('futureArray should not cache if used outsider render')
test.todo('futureObject should not cache if used outside render')
test.todo('futureArray should throw if used inside render without cache key')
test.todo('futureObject should throw if used inside render without cache key')
test.todo('futureArray should cache in render and invalidate on change key')
test.todo('futureObject should cache in render and invalidate on change key')

test("futureArray should defer with map", async () => {
  const futureArr = new FutureArr(2); // 2 3 4 2
  const lazified = reverseImm(futureArr) // 2 4 3 2
    .map((val) => val + 1) // 3 5 4 3

  const value = extractValue(lazified);

  await waitForSuspense(150);
  expect(await value).toEqual([3, 5, 4, 3]);
  const lazified2 = futureArray(() => [3, 4, 5, 3].reverse());
  const value2 = extractValue(lazified2);
  await waitForSuspense(150);

  expect(await value2).toEqual([3, 4, 5, 3].reverse());
});

test("futureArray should handle nested future array outside render", async () => {
  const array = futureArray(() => futureArray(() => [1, 2, 3, 4]));
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

test("futureArray should handle nested future array outside render with map method", async () => {
  const array = futureArray(() => futureArray(() => [1, 2, 3, 4])).map(
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

test("futureArray should handle nested future array outside render with filter method", async () => {
  const array = futureArray(() => futureArray(() => [1, 2, 3, 4])).filter(
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

test("futureArray should handle nested future array inside render", async () => {
  let renderer;

  const App = ({ }) => {
    const array = futureArray(() => futureArray(() => [1, 2, 3, 4]));

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

test("futureArray should handle nested future array inside render with map method", async () => {
  let renderer;

  const App = ({ }) => {
    const array = futureArray(() => futureArray(() => [1, 2, 3, 4])).map(
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

test("futureArray should handle nested future array inside render with filter method", async () => {
  let renderer;

  const App = ({ }) => {
    const array = futureArray(() => futureArray(() => [1, 2, 3, 4])).filter(
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

test("futureArray should handle nested future array outside render", async () => {
  const array = futureArray(createArrayResource(async () => [1, 2, 3, 4]).of);
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

test("futureArray should handle nested future array outside render", async () => {
  const array = futureArray(createArrayResource(async () => [1, 2, 3, 4]).of).map(
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

test("futureArray should handle nested future array outside render 1", async () => {
  const array = futureArray(createArrayResource(async () => [1, 2, 3, 4]).of).filter(
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

test("futureArray should handle nested future array outside render 2", async () => {
  const array = futureArray(
    createArrayResource(async () => {
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

test("futureArray should handle nested future array inside render 1", async () => {
  let renderer;
  const prom = async () => [1, 2, 3, 4];
  const fut = createArrayResource(prom);

  const Comp = () => {
    const array = futureArray(fut.of);
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

test("futureArray should handle nested future array inside render 2", async () => {
  let renderer;
  const prom = async () => {
    await delay(100);
    return [1, 2, 3, 4];
  };
  const fut = createArrayResource(prom);

  const Comp = () => {
    const array = futureArray(fut.of);
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

test("futureArray should handle nested future array inside render with map 1", async () => {
  let renderer;
  const prom = async () => [1, 2, 3, 4];
  const fut = createArrayResource(prom);

  const Comp = () => {
    const array = futureArray(fut.of).map((val) => val + 1);
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

test("futureArray should handle nested future array inside render with map 2", async () => {
  let renderer;
  const prom = async () => {
    await delay(100);
    return [1, 2, 3, 4];
  };
  const fut = createArrayResource(prom);

  const Comp = () => {
    const array = futureArray(fut.of).map((val) => val + 1);
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

test("futureArray should handle nested future array inside render", async () => {
  let renderer;
  const prom = async () => [1, 2, 3, 4];
  const fut = createArrayResource(prom);

  const Comp = () => {
    const array = futureArray(fut.of).filter((val) => val % 2);
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