jest.mock('scheduler', () => require('scheduler/unstable_mock'));

import { act } from 'react-dom/test-utils';
import { futureArray } from '../../../futures';
import { render } from '../../../test-utils/rtl-renderer';
import { Suspense, unstable_useCacheRefresh as useCacheRefresh, unstable_Cache as Cache} from 'react';
import { waitFor } from '@testing-library/dom';
import Scheduler from 'scheduler/unstable_mock'
import waitForSuspense from '../../../test-utils/waitForSuspense';
expect.extend(require('../../../test-utils/renderer-extended-expect'));

let fetchArray = val =>
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

  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  FutureArr = null;
  jest.useRealTimers()
  document.body.removeChild(container);
  container = null;
  Scheduler.unstable_clearYields();
  // renderer && renderer.unmount()
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
describe('useCacheRefresh', () => {
  it('should refresh cache on useCacheRefresh', async () => {
    let refresh;
    let renderer;
    const App = () => {
      const futArr = new FutureArr('test-key');

      refresh = useCacheRefresh();

      
      return <div>
        {futArr}
      </div>;
    }
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>, container);
    });
    const {getByText} = renderer;
    

    await waitFor(() => getByText('Loading...'));
    expect(Scheduler).toHaveYielded([])
    
    act(() => {
      jest.runTimersToTime(150);
    })

    expect(Scheduler).toHaveYielded(['Promise Resolved. value: test-key'])

    await waitForSuspense(0)
    await waitFor(() => getByText('234test-key'));

    act(() => {
      refresh();
    })

    await waitFor(() => getByText('Loading...'));
    expect(Scheduler).toHaveYielded([])
    
    act(() => {
      jest.runTimersToTime(150);
    })

    expect(Scheduler).toHaveYielded(['Promise Resolved. value: test-key'])

    await waitForSuspense(0)
    await waitFor(() => getByText('234test-key'));
  });
  it('shouldn\'t refresh cache on useCacheRefresh if future was created outside render', async () => {
    let refresh;
    let renderer;
    const futArr = new FutureArr('test-key');

    const App = () => {

      refresh = useCacheRefresh();

      
      return <div>
        {futArr}
      </div>;
    }
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>, container);
    });
    const {getByText} = renderer;
    

    await waitFor(() => getByText('Loading...'));
    expect(Scheduler).toHaveYielded([])
    
    act(() => {
      jest.runTimersToTime(150);
    })

    expect(Scheduler).toHaveYielded(['Promise Resolved. value: test-key'])

    await waitForSuspense(0)
    await waitFor(() => getByText('234test-key'));

    act(() => {
      refresh();
    })

    await waitFor(() => getByText('234test-key'));
    
    act(() => {
      jest.runTimersToTime(150);
    })

    expect(Scheduler).not.toHaveYielded(['Promise Resolved. value: test-key'])

    await waitForSuspense(0)
    await waitFor(() => getByText('234test-key'));
  });

  it('should refresh cache on useCacheRefresh if future created in <Cache />', async () => {
    let refresh;
    let renderer;
    const App = () => {
      const futArr = new FutureArr('test-key');

      refresh = useCacheRefresh();

      return <div>
        {futArr}
      </div>;
    }

    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <div>
            <Cache>
            <App />
            </Cache>
          </div>
        </Suspense>, container);
    });

    const {getByText} = renderer;

    await waitFor(() => getByText('Loading...'));
    expect(Scheduler).toHaveYielded([])
    
    act(() => {
      jest.runTimersToTime(150);
    })

    expect(Scheduler).toHaveYielded(['Promise Resolved. value: test-key'])

    await waitForSuspense(0)
    await waitFor(() => getByText('234test-key'));

    act(() => {
      refresh();
    })

    await waitFor(() => getByText('Loading...'));
    expect(Scheduler).toHaveYielded([])
    
    act(() => {
      jest.runTimersToTime(150);
    })

    expect(Scheduler).toHaveYielded(['Promise Resolved. value: test-key'])

    await waitForSuspense(0)
    await waitFor(() => getByText('234test-key'));
  });
  it('shouldn\'t refresh cache on useCacheRefresh if future was created outside <Cache />', async () => {
    let refresh;
    let renderer;

    const Wrapper = () => {
      const futArr = new FutureArr('test-key');
      return <Cache><App futArr={futArr} /></Cache>
    }

    const App = ({futArr}) => {

      refresh = useCacheRefresh();

      return <div>
        {futArr}
      </div>;
    }

    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <Wrapper />
        </Suspense>, container);
    });
    const {getByText} = renderer;
    

    await waitFor(() => getByText('Loading...'));
    expect(Scheduler).toHaveYielded([])
    
    act(() => {
      jest.runTimersToTime(150);
    })

    expect(Scheduler).toHaveYielded(['Promise Resolved. value: test-key'])

    await waitForSuspense(0)
    await waitFor(() => getByText('234test-key'));

    act(() => {
      refresh();
    })

    await waitFor(() => getByText('234test-key'));
    
    act(() => {
      jest.runTimersToTime(150);
    })

    expect(Scheduler).not.toHaveYielded(['Promise Resolved. value: test-key'])

    await waitForSuspense(0)
    await waitFor(() => getByText('234test-key'));
  });
  // it should refresh cache for futures made in callback of another futuer
  // it shouldn't refresh cache for futures not made incallbacks of other futures.
  // it should refresh global cache when using createCacheRefresh
})