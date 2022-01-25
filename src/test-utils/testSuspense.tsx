import waitForSuspense from './waitForSuspense';
import waitForLoading from './waitForLoading';
import { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import Scheduler from 'scheduler/unstable_mock';
import { waitFor } from '@testing-library/dom';


// TODO: remove this once we have a better rtl-renderer
global.IS_REACT_ACT_ENVIRONMENT = true;

export const testSuspenseWithLoader = async (
  el,
  expected,
  waitForRender
) => {

  let container;
  let root;
  act(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  act(() => {
    root = ReactDOM.createRoot(container);
  });
   act( () => {
    root.render(<Suspense fallback={<div>Loading...</div>}>{el}</Suspense>);
  });
  await waitForSuspense(0)

  await waitFor(() => {
    expect(container.innerHTML).toEqual(`<div>Loading...</div>`);
  });
  await waitForRender()

  await waitFor(() => {
    expect(container.innerHTML).toEqual(expected);
  });
};

export const testRenderWithoutSuspense = async (el, expected) => {
  let container;
  let root;
  act(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  act(() => {
    root = ReactDOM.createRoot(container);
  });
  await act(async () => {
    root.render(<Suspense fallback={<div>Loading...</div>}>{el}</Suspense>);
  });
  await waitForSuspense(0);
  Scheduler.unstable_advanceTime(0);
  Scheduler.unstable_flushExpired();
  await act(async () => {
    expect(container.innerHTML).toEqual(expected);
  });
};
