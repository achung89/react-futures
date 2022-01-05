jest.mock("scheduler", () => require("scheduler/unstable_mock"));
import { waitFor } from "@testing-library/dom";
import { Suspense } from "react";
import { act } from "react-dom/test-utils";
import { futureArray } from "../../../internal";
import { render } from "../../../test-utils/rtl-renderer";
import waitForSuspense from "../../../test-utils/waitForSuspense";
import { futureArray } from "../../../utils";

expect.extend(require("../../../test-utils/renderer-extended-expect"));

let container;
let FutureArr;
let Scheduler;
jest.useFakeTimers();

jest.resetModules();
let fetchArray = (val) =>
  new Promise((res, rej) => {
    setTimeout(() => {
      Scheduler.unstable_yieldValue("Promise Resolved");

      res([2, 3, 4, val]);
    }, 100);
  });
beforeEach(() => {
  FutureArr = futureArray(fetchArray);
  Scheduler = require("scheduler/unstable_mock");
  container = document.createElement("div");
  document.body.appendChild(container);
});
afterEach(async () => {
  await waitForSuspense(0)
  FutureArr = null;
  document.body.removeChild(container);
  container = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
});
describe("Nested future arrays", () => {
  it("should suspend when rendering deeply nested future", async () => {
    const MiniApp = () => createNestedFuture(new FutureArr(5));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;

    await waitForSuspense(0);
    expect(Scheduler).toHaveYielded([]);
    await waitFor(() => getByText("Loading..."));

    await waitForSuspense(100);
    expect(Scheduler).toHaveYielded(["Promise Resolved"]);

    
    await waitForSuspense(100);
    expect(Scheduler).toHaveYielded(["Promise Resolved"]);
    await waitFor(() => getByText("34"));
  });
  it("should suspend when rendering deeply nested future that has a nested prefetched array", async () => {
    const MiniApp = () => createMoreComplexNestedFuture(new FutureArr(5));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;
    jest.runOnlyPendingTimers();
    await waitFor(() => getByText("Loading..."));

    await waitForSuspense(100);
    expect(Scheduler).toHaveYielded(["Promise Resolved", "Promise Resolved"]);

    await waitFor(() => getByText("46812"));
  });
  it("should suspend when rendering deeply nested future that has a nested prefetched array and nested array", async () => {
    const MiniApp = () => createEvenMoreComplexNestedFuture(new FutureArr(5));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;

    await waitForSuspense(0)
    await waitFor(() => getByText("Loading..."));

    
    await waitForSuspense(100);
    await waitForSuspense(100);

    expect(Scheduler).toHaveYielded(["Promise Resolved", "Promise Resolved", "Promise Resolved"]);
    await waitFor(() => getByText("612"));
  });
  it("should suspend when rendering deeply nested future that has a nested prefetched array and nested array in div", async () => {
    const MiniApp = () => (
      <div>{createEvenMoreComplexNestedFuture(new FutureArr(5))}</div>
    );

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;
    jest.runOnlyPendingTimers();
    await waitFor(() => getByText("Loading..."));
    
    await waitForSuspense(100);
    await waitForSuspense(100);

    expect(Scheduler).toHaveYielded(["Promise Resolved", "Promise Resolved", "Promise Resolved"]);
    await waitFor(() => getByText("612"));
  });
});

describe("Nested Future arrays in future array", () => {
  it("should suspend when rendering deeply nested future", async () => {
    const MiniApp = () => createNestedFuture(futureArray(() => [2, 3, 4, 5]));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;
    jest.runOnlyPendingTimers();
    await waitFor(() => getByText("Loading..."));

    jest.runTimersToTime(100);
    expect(Scheduler).toHaveYielded(["Promise Resolved"]);
    await waitForSuspense(0);
    await waitFor(() => getByText("34"));
  });
  it("should suspend when rendering deeply nested future that has a nested prefetched array", async () => {
    const MiniApp = () =>
      createMoreComplexNestedFuture(futureArray(() => [2, 3, 4, 5]));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;
    jest.runOnlyPendingTimers();
    await waitFor(() => getByText("Loading..."));

    jest.runTimersToTime(100);
    expect(Scheduler).toHaveYielded(["Promise Resolved"]);
    await waitForSuspense(0);
    await waitFor(() => getByText("46812"));
  });
  it("should suspend when rendering deeply nested future that has a nested prefetched array and nested array", async () => {
    const MiniApp = () =>
      createEvenMoreComplexNestedFuture(futureArray(() => [2, 3, 4, 5]));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;
    jest.runOnlyPendingTimers();
    await waitFor(() => getByText("Loading..."));

    await waitForSuspense(100);
    await waitForSuspense(100);

    expect(Scheduler).toHaveYielded(["Promise Resolved", "Promise Resolved"]);
    await waitFor(() => getByText("612"));
  });
  it("should suspend when rendering deeply nested future that has a nested prefetched array and nested array in div", async () => {
    const MiniApp = () => (
      <div>
        {createEvenMoreComplexNestedFuture(futureArray(() => [2, 3, 4, 5]))}
      </div>
    );

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;
    await waitForSuspense(0)
    await waitFor(() => getByText("Loading..."));

    await waitForSuspense(100);
    await waitForSuspense(100);
    expect(Scheduler).toHaveYielded(["Promise Resolved","Promise Resolved"]);
    await waitFor(() => getByText("612"));
  });
});

describe("Nested Future array in future array callback", () => {
  it("should render simple array", async () => {
    const numbers = futureArray(() => [...new FutureArr(5)]); // [2,3,4,5]
    const App = ({ nestedFuture = false }) => {
      const nums = nestedFuture ? createNestedFuture(numbers) : numbers;
      return <div>{nums}</div>;
    };
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
    await waitForSuspense(0)
    await waitFor(() => getByText("Loading..."));

    await waitForSuspense(100);
    expect(Scheduler).toHaveYielded(["Promise Resolved"]);
    await waitFor(() => getByText("2345"));
  });
  it("should render simple nested array", async () => {
    const numbers = futureArray(() => [...new FutureArr(5)]); // [2,3,4,5]

    const App = ({ nestedFuture = false }) => {
      const nums = nestedFuture
        ? createSimpleNestedFuture(numbers) /** [5, 5, 5, 6] */
        : numbers;
      return <div>{nums}</div>;
    };

    let renderer;
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <App nestedFuture />
        </Suspense>,
        container
      );
    });
    const { getByText } = renderer;
    await waitForSuspense(0)
    await waitFor(() => getByText("Loading..."));

    await waitForSuspense(100);
    await waitForSuspense(100);
    expect(Scheduler).toHaveYielded(["Promise Resolved","Promise Resolved"]);
    await waitFor(() => getByText("46810"));
  });
  it("should suspend when instantiating future array in render", async () => {
    const MiniApp = () =>
      createNestedFuture(futureArray(() => [...new FutureArr(5)]));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;
    await waitForSuspense(0)
    await waitFor(() => getByText("Loading..."));

    
    await waitForSuspense(100);
    await waitForSuspense(100);
    expect(Scheduler).toHaveYielded(["Promise Resolved", "Promise Resolved"]);
    await waitFor(() => getByText("34"));
  });
  it("should suspend when instantiating future array outside render", async () => {
    const futureArr = futureArray(() => [...new FutureArr(5)]);
    const MiniApp = () => createNestedFuture(futureArr);

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;
    jest.runOnlyPendingTimers();
    await waitFor(() => getByText("Loading..."));

    await waitForSuspense(100);
    await waitForSuspense(100);
    expect(Scheduler).toHaveYielded(["Promise Resolved","Promise Resolved"]);
    await waitFor(() => getByText("34"));
  }, 999000);
});
describe("Nested Future arrays in future array with future array being declared outside render", () => {
  it("should suspend when rendering deeply nested future", async () => {
    const futureArr = futureArray(() => [2, 3, 4, 5]);
    const MiniApp = () => createNestedFuture(futureArr);

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;
    await waitForSuspense(0)
    await waitFor(() => getByText("Loading..."));

    await waitForSuspense(100);
    expect(Scheduler).toHaveYielded(["Promise Resolved"]);
    await waitFor(() => getByText("34"));
  });
  it("should suspend when rendering deeply nested future that has a nested prefetched array", async () => {
    const futureArr = futureArray(() => [2, 3, 4, 5]);
    const MiniApp = () => createMoreComplexNestedFuture(futureArr);

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;
    jest.runOnlyPendingTimers();
    await waitFor(() => getByText("Loading..."));

    await waitForSuspense(100);
    expect(Scheduler).toHaveYielded(["Promise Resolved"]);
    await waitFor(() => getByText("46812"));
  });
  it("should suspend when rendering deeply nested future that has a nested prefetched array and nested array", async () => {
    const futureArr = futureArray(() => [2, 3, 4, 5]);

    const MiniApp = () => createEvenMoreComplexNestedFuture(futureArr);

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;
    await waitForSuspense(0)
    await waitFor(() => getByText("Loading..."));

    await waitForSuspense(100)
    await waitForSuspense(100);
    expect(Scheduler).toHaveYielded(["Promise Resolved","Promise Resolved"]);
    await waitFor(() => getByText("612"));
  });
  it("should suspend when rendering deeply nested future that has a nested prefetched array and nested array in div", async () => {
    const futureArr = futureArray(() => [2, 3, 4, 5]);

    const MiniApp = () => (
      <div>{createEvenMoreComplexNestedFuture(futureArr)}</div>
    );

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;
    await waitForSuspense(0);

    await waitFor(() => getByText("Loading..."));

    await waitForSuspense(100);
    await waitForSuspense(100)
    expect(Scheduler).toHaveYielded([
      "Promise Resolved",
      "Promise Resolved",
    ]);
    await waitFor(() => getByText("612"));
  });
});

const createSimpleNestedFuture = (numbers) =>
  numbers.map((num, i) => num + new FutureArr(5)[i]);

const createNestedFuture = (numbers) => {
  return numbers.filter((num) =>
    new FutureArr(1.5).map((num) => num * 2).includes(num)
  );
};
const createMoreComplexNestedFuture = (numbers) => {
  let numbers2 = new FutureArr(7); //[1,2,3,7];
  return numbers.map((num, ind) => num + numbers2[ind]); // [9,8,7,9]
};

const createEvenMoreComplexNestedFuture = (numbers) => {
  let numbers2 = new FutureArr(7); //[1,2,3,7];
  return numbers
    .map((num, ind) => num + numbers2[ind]) // [9,8,7,9]
    .filter((num) =>
      new FutureArr(8) // [1,2,3,8]
        .map((num) => num * 3) // [3,6,9,24]
        .includes(num)
    ); //[9,9]
};
