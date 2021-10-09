jest.mock('scheduler', () => require('scheduler/unstable_mock'));
import { Suspense } from "react";
import { futureArray } from "../../../futures";
import { testSuspenseWithLoader } from "../../../test-utils/testSuspense";
import waitForSuspense from "../../../test-utils/waitForSuspense";
import { lazyArray } from "../../../utils";

expect.extend(require('../../../test-utils/renderer-extended-expect'));

let container;
let FutureArr;
let Scheduler;
jest.useFakeTimers();

jest.resetModules();
let fetchArray = val =>
  new Promise((res, rej) => {
    setTimeout(() => {
      res([2, 3, 4, val]);
    }, 100);
  });

beforeEach(() => {
  FutureArr = futureArray(fetchArray);
  Scheduler = require('scheduler/unstable_mock');
  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  FutureArr = null;
  document.body.removeChild(container);
  container = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
});
describe('Nested future arrays', () => {
  it('should suspend when rendering deeply nested future', async () => {
    const MiniApp = () => createNestedFuture(new FutureArr(5));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    await testSuspenseWithLoader(<App />, `<div>34</div>`, async () => {
      await waitForSuspense(100)
      await waitForSuspense(100)

    });

  });

  it('should suspend when rendering deeply nested future that has a nested prefetched array', async () => {
    const MiniApp = () => createMoreComplexNestedFuture(new FutureArr(5));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    await testSuspenseWithLoader(<App />, `<div>46812</div>`, async () => {
      await waitForSuspense(100)
      await waitForSuspense(100)

    });
  });
  it('should suspend when rendering deeply nested future that has a nested prefetched array and nested array', async () => {
    const MiniApp = () => createEvenMoreComplexNestedFuture(new FutureArr(5));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    await testSuspenseWithLoader(<App />, `<div>612</div>`, async () => {
      await waitForSuspense(100)
      await waitForSuspense(100)

    });
  });
  it('should suspend when rendering deeply nested future that has a nested prefetched array and nested array in div', async () => {
    const MiniApp = () => <div>{createEvenMoreComplexNestedFuture(new FutureArr(5))}</div>

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );

    await testSuspenseWithLoader(<App />, `<div><div>612</div></div>`, async () => {
      await waitForSuspense(100)
      await waitForSuspense(100)

    });
  });
})

describe('Nested Future array instantiated in lazy array chain', () => {
  it('should suspend when rendering deeply nested future', async () => {
    const MiniApp = () => createNestedFuture(lazyArray(() =>[2,3,4,5]));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    await testSuspenseWithLoader(<App />, `<div>34</div>`, async () => {
      await waitForSuspense(100)

    });

  });
  it('should suspend when rendering deeply nested future that has a nested prefetched array', async () => {
    const MiniApp = () => createMoreComplexNestedFuture(lazyArray(() =>[2,3,4,5]));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    await testSuspenseWithLoader(<App />, `<div>46812</div>`, async () => {
      await waitForSuspense(100)
      await waitForSuspense(100)

    });

  });
  it('should suspend when rendering deeply nested future that has a nested prefetched array and nested array', async () => {
    const MiniApp = () => createEvenMoreComplexNestedFuture(lazyArray(() =>[2,3,4,5]));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    await testSuspenseWithLoader(<App />, `<div>612</div>`, async () => {
      await waitForSuspense(100)
      await waitForSuspense(100)

    });

  });
  it('should suspend when rendering deeply nested future that has a nested prefetched array and nested array in div', async () => {
    const MiniApp = () => <div>{createEvenMoreComplexNestedFuture(lazyArray(() =>[2,3,4,5]))}</div>

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    await testSuspenseWithLoader(<App />, `<div><div>612</div></div>`, async () => {
      await waitForSuspense(100)
      await waitForSuspense(100)

    });

  });
})



describe('Nested Future arrays instantiated in lazy array chain with lazy array being instatiated outside render', () => {
  it('should suspend when rendering deeply nested future', async () => {
    const lazyArr = lazyArray(() => [2,3,4,5])
    const MiniApp = () => createNestedFuture(lazyArr);

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    await testSuspenseWithLoader(<App />, `<div>34</div>`, async () => {
      await waitForSuspense(100)
    });
  });
  it('should suspend when rendering lazyArray that uses a future in its callback', async () => {
    const lazyArr = lazyArray(() => [2,3,4,5])
    const MiniApp = () => createNestedFuture(lazyArr);

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    await testSuspenseWithLoader(<App />, `<div>34</div>`, async () => {
      await waitForSuspense(100)
    });

  })
  it('should suspend when rendering deeply nested future that has a nested prefetched array', async () => {
    const lazyArr = lazyArray(() =>[2,3,4,5])
    const MiniApp = () => createMoreComplexNestedFuture(lazyArr);

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    await testSuspenseWithLoader(<App />, `<div>46812</div>`, async () => {
      await waitForSuspense(100)
      await waitForSuspense(100)
    });

  });
  it('should suspend when rendering deeply nested future that has a nested prefetched array and nested array', async () => {
    const lazyArr = lazyArray(() =>[2,3,4,5])

    const MiniApp = () => createEvenMoreComplexNestedFuture(lazyArr);

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    await testSuspenseWithLoader(<App />, `<div>612</div>`, async () => {
      await waitForSuspense(100)
      await waitForSuspense(100)
    });

  });
  it('should suspend when rendering deeply nested future that has a nested prefetched array and nested array in div', async () => {
    const lazyArr = lazyArray(() =>[2,3,4,5])

    const MiniApp = () => <div>{createEvenMoreComplexNestedFuture(lazyArr)}</div>

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    await testSuspenseWithLoader(<App />, `<div><div>612</div></div>`, async () => {
      await waitForSuspense(100)
      await waitForSuspense(100)
    });

  });
})

const createNestedFuture = (numbers) => {

  return numbers
    .filter(num => new FutureArr(1.5)
      .map(num => num * 2)
      .includes(num)
    );
};
const createMoreComplexNestedFuture = (numbers) => {
  let numbers2 = new FutureArr(7); //[1,2,3,7];
  return numbers
    .map((num, ind) => num + numbers2[ind]) // [9,8,7,9]
}

const createEvenMoreComplexNestedFuture = (numbers) => {
  let numbers2 = new FutureArr(7); //[1,2,3,7];
  return numbers
    .map((num, ind) => num + numbers2[ind]) // [9,8,7,9]
    .filter(num => new FutureArr(8) // [1,2,3,8]
                    .map(num => num * 3) // [3,6,9,24]
                    .includes(num)
    ) //[9,9]
}
