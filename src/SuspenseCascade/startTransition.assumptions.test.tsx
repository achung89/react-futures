jest.mock("scheduler", () => require("scheduler/unstable_mock"));
import { act } from "react-dom/test-utils";
import { Suspense } from "react";

import { upperCase, spaceOut, throwOnce, throwTwice } from "./suspenseFuncs";
import { startTransition, unstable_getCacheForType } from "react";
import { render } from "../test-utils/rtl-renderer";
import { waitFor } from "@testing-library/dom";
import waitForSuspense from "../test-utils/waitForSuspense";
expect.extend(require("../test-utils/renderer-extended-expect"));

let Scheduler;
let container;
beforeEach(() => {
  jest.useFakeTimers();

  Scheduler = require("scheduler/unstable_mock");
  container = document.createElement("div");
  document.body.appendChild(container);
});
afterEach(() => {
  jest.useRealTimers();

  document.body.removeChild(container);
  container = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
});

describe("startTransition assumptions", () => {
  it("should resolve thrown promise in startTransition", async () => {
    let renderer;
    let resolved;

    const setResolved = throwOnce(() => {
      Scheduler.unstable_yieldValue("resolved-transition");
      resolved = "resolved";
    });

    const App = () => {
      startTransition(() => {
        Scheduler.unstable_yieldValue("starting-transition");
        setResolved();
      });

      return <div>1</div>;
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
    expect(Scheduler).toHaveYielded(["starting-transition"]);

    await waitFor(() => getByText("Loading..."));
    act(() => {
      jest.runTimersToTime(50);
    });
    await waitForSuspense(0);
    expect(Scheduler).toHaveYielded([
      "starting-transition",
      "resolved-transition",
    ]);
    await waitFor(() => getByText("1"));
  });
  it("should maintain cache in startTransition", async () => {
    let renderer;
    let resolved;
    
    const cacheCb = () => [];
    const invokeThrow = throwOnce(() => {
      Scheduler.unstable_yieldValue("resolved-transition");
      resolved = "resolved";
    });
    const setResolved = () => {
      const arr = unstable_getCacheForType(cacheCb);
      arr.push("pushed");
      Scheduler.unstable_yieldValue(JSON.stringify(arr));
      invokeThrow();
    };

    const App = () => {
      startTransition(() => {
        Scheduler.unstable_yieldValue("starting-transition");
        setResolved();
      });

      return <div>1</div>;
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
    expect(Scheduler).toHaveYielded(["starting-transition",JSON.stringify(["pushed"])]);
    await waitFor(() => getByText("Loading..."));
    act(() => {
      jest.runTimersToTime(50);
    });
    await waitForSuspense(0);
    expect(Scheduler).toHaveYielded([
      "starting-transition",
      JSON.stringify(["pushed", "pushed"]),
      "resolved-transition",
    ]);
    await waitFor(() => getByText("1"));
  });
});
