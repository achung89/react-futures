jest.mock("scheduler", () => require("scheduler/unstable_mock"));

import { act } from "react-dom/test-utils";
import { futureArray } from "../../../futures";
import { render } from "../../../test-utils/rtl-renderer";
import {
  Suspense,
  unstable_getCacheForType as getCacheForType,
  unstable_useCacheRefresh as useCacheRefresh,
  unstable_Cache as Cache,
} from "react";
import { waitFor } from "@testing-library/dom";
import waitForSuspense from "../../../test-utils/waitForSuspense";
import { useFetchRefresh } from "../../cacheRefresh";
expect.extend(require("../../../test-utils/renderer-extended-expect"));

let Scheduler;

let fetchArray = (val) =>
  new Promise((res, rej) => {
    setTimeout(() => {
      Scheduler.unstable_yieldValue(`Promise Resolved. value: ${val}`);
      res([2, 3, 4, val]);
    }, 100);
  });

let container;
let FutureArr;

beforeEach(() => {
  jest.useFakeTimers();

  jest.resetModules();
  FutureArr = futureArray(fetchArray);
  Scheduler = require("scheduler/unstable_mock");

  container = document.createElement("div");
  document.body.appendChild(container);
});
afterEach(async () => {
  FutureArr = null;
  jest.useRealTimers();
  document.body.removeChild(container);
  container = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
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

// during experimental phase, certain assumptions about react cache may not hold.
//this is to catch whenever those assumptions change

describe("Assumptions", () => {
  it("getCacheForType uses same cache as global cache", () => {
    const cacheMaker = () => new Map();
    let cache1;
    let cache2;
    let renderer;
    const Wrapper = () => {
      cache1 = getCacheForType(cacheMaker);
      return (
        <Cache>
          <App />
        </Cache>
      );
    };
    const App = () => {
      cache2 = getCacheForType(cacheMaker);

      return <div>1</div>;
    };
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <Wrapper />
        </Suspense>,
        container
      );
    });
    expect(cache1 === cache2).toBeTruthy();
  });

  it("getCacheForType uses same cache for nested <Cache />", () => {
    const cacheMaker = () => new Map();
    let cache1;
    let cache2;
    let renderer;
    const Wrapper = () => {
      cache1 = getCacheForType(cacheMaker);
      return (
        <Cache>
          <App />
        </Cache>
      );
    };
    const App = () => {
      cache2 = getCacheForType(cacheMaker);

      return <div>1</div>;
    };
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <Cache>
            <Wrapper />
          </Cache>
        </Suspense>,
        container
      );
    });
    expect(cache1 === cache2).toBeTruthy();
  });

  it("getCacheForType uses different cache as parent after refresh", () => {
    const cacheMaker = () => new Map();
    let cache1;
    let cache2;
    let refresh;
    let renderer;
    const Wrapper = () => {
      cache1 = getCacheForType(cacheMaker);
      return (
        <Cache>
          <App />
        </Cache>
      );
    };
    const App = () => {
      cache2 = getCacheForType(cacheMaker);
      refresh = useCacheRefresh();
      return <div>1</div>;
    };
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <Wrapper />
        </Suspense>,
        container
      );
    });
    expect(cache1 === cache2).toBeTruthy();

    act(() => {
      refresh();
    });

    expect(cache1 !== cache2);
  });

  it.todo("getCacheForType should throw outside render");

  it("top level cache should still containing key value of nested cache even if nested cache is cleared", () => {
    const cacheMaker = () => new Map();
    let cache1;
    let cache2;
    let refresh;
    let renderer;
    const addToCache = () => {
      cache1.set("key", "value");
    };
    const Wrapper = () => {
      cache1 = getCacheForType(cacheMaker);

      return (
        <Cache>
          <App />
        </Cache>
      );
    };
    const App = () => {
      cache2 = getCacheForType(cacheMaker);
      refresh = useCacheRefresh();
      return <div>1</div>;
    };
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <Wrapper />
        </Suspense>,
        container
      );
    });

    addToCache();

    expect(cache1 === cache2).toBeTruthy();
    expect([...cache1]).toStrictEqual([["key", "value"]]);

    act(() => {
      refresh();
    });

    expect(cache1 !== cache2);
    expect([...cache1]).toStrictEqual([["key", "value"]]);
    expect([...cache2]).toStrictEqual([]);
  });
});

describe("useCacheRefresh", () => {
  it("should refresh cache on useCacheRefresh", async () => {
    let refresh;
    let renderer;
    const App = () => {
      const futArr = new FutureArr("test-key");

      refresh = useCacheRefresh();

      return <div>{futArr}</div>;
    };
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <Cache>
            <App />
          </Cache>
        </Suspense>,
        container
      );
    });
    const { getByText } = renderer;

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    expect(Scheduler).toHaveYielded(["Promise Resolved. value: test-key"]);
    await waitFor(() => getByText("234test-key"));

    act(() => {
      refresh();
    });

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    await waitFor(() => getByText("234test-key"));

    expect(Scheduler).toHaveYielded(["Promise Resolved. value: test-key"]);
  });
  it("shouldn't refresh cache on useCacheRefresh if future was created outside render", async () => {
    let refresh;
    let renderer;
    const futArr = new FutureArr("test-key");

    const App = () => {
      refresh = useCacheRefresh();

      return <div>{futArr}</div>;
    };
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <Cache>
            <App />
          </Cache>
        </Suspense>,
        container
      );
    });
    const { getByText } = renderer;

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    expect(Scheduler).toHaveYielded(["Promise Resolved. value: test-key"]);

    await waitFor(() => getByText("234test-key"));

    act(() => {
      refresh();
    });

    await waitFor(() => getByText("234test-key"));

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    expect(Scheduler).not.toHaveYielded(["Promise Resolved. value: test-key"]);

    await waitFor(() => getByText("234test-key"));
  });

  it("should refresh cache on useCacheRefresh if future created in <Cache />", async () => {
    let refresh;
    let renderer;
    const App = () => {
      const futArr = new FutureArr("test-key");

      refresh = useCacheRefresh();

      return <div>{futArr}</div>;
    };

    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <div>
            <Cache>
              <App />
            </Cache>
          </div>
        </Suspense>,
        container
      );
    });

    const { getByText } = renderer;

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    expect(Scheduler).toHaveYielded(["Promise Resolved. value: test-key"]);

    await waitFor(() => getByText("234test-key"));

    act(() => {
      refresh();
    });

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    expect(Scheduler).toHaveYielded(["Promise Resolved. value: test-key"]);

    await waitFor(() => getByText("234test-key"));
  });
  it("shouldn't refresh cache on useCacheRefresh if future was created outside <Cache />", async () => {
    let refresh;
    let renderer;

    const Wrapper = () => {
      const futArr = new FutureArr("test-key");
      return (
        <Cache>
          <App futArr={futArr} />
        </Cache>
      );
    };

    const App = ({ futArr }) => {
      refresh = useCacheRefresh();

      return <div>{futArr}</div>;
    };

    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <Wrapper />
        </Suspense>,
        container
      );
    });
    const { getByText } = renderer;

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    expect(Scheduler).toHaveYielded(["Promise Resolved. value: test-key"]);

    await waitFor(() => getByText("234test-key"));

    act(() => {
      refresh();
    });

    await waitFor(() => getByText("234test-key"));

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    expect(Scheduler).not.toHaveYielded(["Promise Resolved. value: test-key"]);

    await waitFor(() => getByText("234test-key"));
  });

  it("should cascade refresh down children <Cache /> on parent cache refresh", async () => {
    let refresh;
    let renderer;

    const Wrapper = () => {
      refresh = useCacheRefresh();

      const futrArr = new FutureArr("test-key");
      return (
        <Cache>
          <App futrArr={futrArr} />
        </Cache>
      );
    };
    const App = ({ futrArr }) => {
      const futArr2 = new FutureArr("test-key2");

      return (
        <div>
          {futrArr}
          {futArr2}
        </div>
      );
    };

    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <div>
            <Cache>
              <Wrapper />
            </Cache>
          </div>
        </Suspense>,
        container
      );
    });

    const { getByText } = renderer;

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    expect(Scheduler).toHaveYielded([
      "Promise Resolved. value: test-key",
      "Promise Resolved. value: test-key2",
    ]);

    await waitFor(() => getByText("234test-key234test-key2"));

    act(() => {
      refresh();
    });

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    expect(Scheduler).toHaveYielded([
      "Promise Resolved. value: test-key",
      "Promise Resolved. value: test-key2",
    ]);

    await waitFor(() => getByText("234test-key234test-key2"));
  });

  it("should refresh cache on useCacheRefresh if future is instantiated in a future callback", async () => {
    let refresh;
    let renderer;
    const futArr = new FutureArr("test-key");
    const App = () => {
      const nestedFutrArr = futArr.map(
        (val, ind) => new FutureArr(val)[ind] + val
      );
      refresh = useCacheRefresh();

      return <div>{nestedFutrArr}</div>;
    };

    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <div>
            <Cache>
              <App />
            </Cache>
          </div>
        </Suspense>,
        container
      );
    });

    const { getByText } = renderer;

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);

    expect(Scheduler).toHaveYielded([
      "Promise Resolved. value: test-key",
      "Promise Resolved. value: 2",
      "Promise Resolved. value: 3",
      "Promise Resolved. value: 4",
      "Promise Resolved. value: test-key",
    ]);

    await waitFor(() => getByText("468test-keytest-key"));

    act(() => {
      refresh();
    });

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    // all but the future instantiated outside render should refetch
    expect(Scheduler).toHaveYielded([
      "Promise Resolved. value: 2",
      "Promise Resolved. value: 3",
      "Promise Resolved. value: 4",
      "Promise Resolved. value: test-key",
    ]);

    await waitFor(() => getByText("468test-keytest-key"));
  });

  it("shouldn't refresh cache on useCacheRefresh if future made in a nested callback was created outside <Cache />", async () => {
    let refresh;
    let renderer;

    const Wrapper = () => {
      const futArr = new FutureArr("test-key");
      return (
        <Cache>
          <App futArr={futArr} />
        </Cache>
      );
    };

    const App = ({ futArr }) => {
      const nestedFutrArr = futArr.map(
        (val, ind) => new FutureArr("test-key2")[ind] + val
      );
      refresh = useCacheRefresh();

      return <div>{nestedFutrArr}</div>;
    };

    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <Wrapper />
        </Suspense>,
        container
      );
    });
    const { getByText } = renderer;

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });
    await waitForSuspense(0);

    expect(Scheduler).toHaveYielded([
      "Promise Resolved. value: test-key",
      "Promise Resolved. value: test-key2",
    ]);

    await waitFor(() => getByText("468test-key2test-key"));

    act(() => {
      refresh();
    });

    await waitFor(() => getByText("Loading..."));

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    expect(Scheduler).not.toHaveYielded(["Promise Resolved. value: test-key2"]);

    await waitFor(() => getByText("468test-key2test-key"));
  });

  it("should refresh cache on useCacheRefresh if future is instantiated in a future callback and shouldn't refresh cache on useCacheRefresh if future made in a nested callback was created outside <Cache />", async () => {
    let refresh;
    let renderer;

    const futArr = new FutureArr("test-key");

    const Wrapper = () => {
      const futrArr2 = futArr.map((val) => val + new FutureArr(1)[3]);
      return (
        <Cache>
          <App futArr={futrArr2} />
        </Cache>
      );
    };

    const App = ({ futArr }) => {
      const nestedFutrArr = futArr.map(
        (val, ind) => new FutureArr("test-key2")[ind] + val
      );
      refresh = useCacheRefresh();

      return <div>{nestedFutrArr}</div>;
    };

    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <Wrapper />
        </Suspense>,
        container
      );
    });
    const { getByText } = renderer;

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });
    await waitForSuspense(0);

    expect(Scheduler).toHaveYielded([
      "Promise Resolved. value: test-key",
      "Promise Resolved. value: 1",
      "Promise Resolved. value: test-key2",
    ]);

    await waitFor(() => getByText("579test-key2test-key1"));

    act(() => {
      refresh();
    });

    await waitFor(() => getByText("Loading..."));

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    expect(Scheduler).not.toHaveYielded(["Promise Resolved. value: test-key2"]);

    await waitFor(() => getByText("579test-key2test-key1"));
  });

  it("should cascade refresh cache down future callbacks through child <Cache />", async () => {
    let refresh;
    let renderer;

    const Wrapper = () => {
      const futArr = new FutureArr("test-key");
      refresh = useCacheRefresh();

      return (
        <Cache>
          <App futrArr={futArr} />
        </Cache>
      );
    };

    const App = ({ futrArr }) => {
      const nestedFutrArr = futrArr.map(
        (val, ind) => new FutureArr("test-key2")[ind] + val
      );
      return <div>{nestedFutrArr}</div>;
    };

    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <div>
            <Cache>
              <Wrapper />
            </Cache>
          </div>
        </Suspense>,
        container
      );
    });

    const { getByText } = renderer;

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);

    expect(Scheduler).toHaveYielded([
      "Promise Resolved. value: test-key",
      "Promise Resolved. value: test-key2",
    ]);

    await waitFor(() => getByText("468test-key2test-key"));

    act(() => {
      refresh();
    });

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    expect(Scheduler).toHaveYielded([
      "Promise Resolved. value: test-key",
      "Promise Resolved. value: test-key2",
    ]);

    await waitFor(() => getByText("468test-key2test-key"));
  });

  it("should refresh cache on useFetchRefresh if future was created outside render", async () => {
    let renderer;

    const futArr = new FutureArr("test-key");
    let refresh;

    const App = () => {
      refresh = useFetchRefresh(futArr);

      return <div>{futArr}</div>;
    };
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>,
        container
      );
    });
    const { getByText } = renderer;

    await waitFor(() => getByText("Loading..."));
    expect(Scheduler).toHaveYielded([]);

    act(() => {
      jest.runTimersToTime(150);
    });
    await waitForSuspense(0);

    expect(Scheduler).toHaveYielded(["Promise Resolved. value: test-key"]);

    await waitFor(() => getByText("234test-key"));

    act(() => {
      refresh();
    });

    await waitFor(() => getByText("Loading..."));

    act(() => {
      jest.runTimersToTime(150);
    });

    await waitForSuspense(0);
    expect(Scheduler).not.toHaveYielded(["Promise Resolved. value: test-key"]);

    await waitFor(() => getByText("234test-key"));
  });
});
