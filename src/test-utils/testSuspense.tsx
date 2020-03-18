import waitForSuspense from "./waitForSuspense";
import waitForLoading from "./waitForLoading";
import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
export const testSuspenseWithLoader = async (el, expected, suspenseTime = 2000) => {
  let container;
  let root;
  act(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  })
  act(() => {
    root = ReactDOM.createRoot(container);
  });
  await act(async () => {
    root.render(<Suspense fallback={<div>Loading...</div>}>{el}</Suspense>);
  });
  waitForLoading();
  await act(async () => {
    expect(container.innerHTML).toEqual(`<div>Loading...</div>`);
  });
  await act(async () => {
    await waitForSuspense(suspenseTime);
  });
  await act(async () => {
    expect(container.innerHTML).toEqual(expected);
  });
};

export const testRenderWithoutSuspense = async (el, expected) => {
  let container;
  let root;
  act(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  })
  act(() => {
    root = ReactDOM.createRoot(container);
  });
  await act(async () => {
    root.render(<Suspense fallback={<div>Loading...</div>}>{el}</Suspense>);
  });
  jest.runOnlyPendingTimers();
  await act(async () => {
    expect(container.innerHTML).toEqual(expected);
  });
}