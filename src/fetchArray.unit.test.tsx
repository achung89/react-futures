jest.useFakeTimers();
jest.mock('scheduler', () => require('scheduler/unstable_mock'));
import { Suspense } from 'react';
import { act } from 'react-dom/test-utils';
import { render } from './test-utils/rtl-renderer';
import waitForSuspense from './test-utils/waitForSuspense';
import { waitFor } from '@testing-library/dom';
import { fetchArray } from './fetches';
expect.extend(require('./test-utils/renderer-extended-expect'));

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
let fetchArrayPromise = val => () =>
  new Promise((res, rej) => {
    setTimeout(() => {
      Scheduler.unstable_yieldValue('Promise Resolved');
      res([2, 3, 4, val]);
    }, 100);
  });

  const objectProm = value => () => new Promise( (res, rej) => {
    value = Number(value)
    try {
      setTimeout(() => {
        res({value})
      }, 200)
    } catch(err) {
      throw err;
    }
  })
let container;

beforeEach(() => {
  global.Request = class Request {
    [Symbol.hasInstance]() {
      return false;
    }
  }
  global.fetch = jest.fn().mockImplementation(async (path) => {
    const url = new URL(path, 'http://about.com');
    const value = url.searchParams.get('value')
    switch(url.pathname) {
      case '/blogs': 
        return ({ json() { return fetchArrayPromise(value ?? 5)() } })
      case '/person': 
        return ({ json() { return objectProm(value)() } })
      default:
        throw new Error("Invalid Route:" + path)
    }
  });
  jest.useFakeTimers();
  jest.resetModules();
  Scheduler = require('scheduler/unstable_mock');
  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  global.fetch.mockRestore();
  delete global.Request
  delete global.fetch;
  document.body.removeChild(container);
  container = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
});

const LogSuspense = ({ action, children }) => {
  try {
    action();
    Scheduler.unstable_yieldValue('No Suspense');
    return children;
  } catch (promise) {
    if (typeof promise.then === 'function') {
      Scheduler.unstable_yieldValue(`Suspend!`);
    } else {
      Scheduler.unstable_yieldValue(`Error!`);
    }
    throw promise;
  }
};

describe.skip('In only render context', () => {
  it('should render properly', async () => {
    let App = () => <div></div>;
    act(() => {
      render(<App />, container);
    });
    await waitForSuspense(0);
    expect(container.innerHTML).toEqual(`<div></div>`);
  });

  it('should suspend when rendering', async () => {
    const MiniApp = () => {
      const futureArray = fetchArray('/blogs')
      return <>{futureArray}</>
    };

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
    await waitFor(() => getByText('Loading...'));

    await waitForSuspense(150);
    expect(Scheduler).toHaveYielded(['Promise Resolved']);
    await waitFor(() => getByText('2345'));
  });

  test.each(['1', 2, '3', 4])(
    `should suspend on %i index access`,
    async index => {
      const resources = fetchArray('/blogs');
      let resolvedValue;
      let App = () => {
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <LogSuspense action={() => (resolvedValue = resources[index])}>
              <div>foo</div>
            </LogSuspense>
          </Suspense>
        );
      };
      let renderer;
      act(() => {
        renderer = render(<App />, container);
      });
      const { getByText } = renderer;
      await waitForSuspense(0);
      await waitFor(() => getByText('Loading...'));
      expect(Scheduler).toHaveYielded(['Suspend!']);
      await waitForSuspense(150);
      expect(Scheduler).toHaveYielded(['Promise Resolved']);
      await waitFor(() => getByText('foo'));

      expect(resolvedValue).toEqual([2, 3, 4, 5][index]);
    }
  );
  test.each(['bar', Symbol('foo'), 'baz'])(
    `should suspend on %s property access`,
    async index => {
      const resources = fetchArray('/blogs');
      let resolvedValue;
      let App = () => {
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <LogSuspense action={() => (resolvedValue = resources[index])}>
              <div>foo</div>
            </LogSuspense>
          </Suspense>
        );
      };
      let renderer;
      act(() => {
        renderer = render(<App />, container);
      });
      const { getByText } = renderer;
      await waitForSuspense(0)
      await waitFor(() => getByText('Loading...'));
      expect(Scheduler).toHaveYielded(['Suspend!']);
      await waitForSuspense(150);
      expect(Scheduler).toHaveYielded(['Promise Resolved']);
      await waitForSuspense(0);
      await waitFor(() => getByText('foo'));

      expect(resolvedValue).toEqual(undefined);
    }
  );
});

