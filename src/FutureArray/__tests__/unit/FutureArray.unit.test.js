
jest.useFakeTimers();
jest.mock('scheduler', () => require('scheduler/unstable_mock'));

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { createArrayType } from '../../../index';
import { act } from 'react-dom/test-utils';
import { thisMap } from '../../../Effect/Effect';
import { LazyArray, LazyIterator } from '../../LazyArray';
import { render } from '../../../test-utils/rtl-renderer';
import waitForSuspense from '../../../test-utils/waitForSuspense';
import { waitFor } from '@testing-library/dom';
import { unwrapProxy } from '../../../utils';
expect.extend(require('../../../test-utils/renderer-extended-expect'));

// TODO: setter should not suspend
// TODO: lazy before suspense, eager after suspense <=== does this still apply???????
// TODO: should entries, values, and keys throw, or return an iterator of FutureArrays?
// TODO: should push and unshift suspend since they require knowledge of length?
// TODO: all subsequently created arrays should all share the same promise
// TODO: test freeze, seal, delete
// TODO: test error handling
// TODO: imm methods
// TODO: future value shouldn't be accessible from outside render ( add get raw value function )
let Scheduler
let fetchArray = val => new Promise((res, rej) => {
  setTimeout(() => {
    Scheduler.unstable_yieldValue('Promise Resolved')
    res([2, 3, 4, val])
  }, 100)
})

let container;
let FutureArr;
beforeEach(() => {
  jest.resetModules();
  FutureArr = createArrayType(fetchArray);
  Scheduler = require('scheduler/unstable_mock')
  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  FutureArr.reset();
  FutureArr = null;
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
}
describe("In only render context", () => {
  it("should render properly", async () => {
    let App = () => <div></div>;
    act(() => {
      render(<App />, container)
    });
    await waitForSuspense(0);
    expect(container.innerHTML).toEqual(`<div></div>`)
  });

  it("should suspend when rendering", async () => {


    const MiniApp = () => <>{new FutureArr(5)}</>

    const App = () => <Suspense fallback={<div>Loading...</div>}>
      <div>
        <MiniApp />
      </div>
    </Suspense>;
    let renderer;
    act(() => {
      renderer = render(<App />, container)
    });
    const { getByText } = renderer;

    await waitFor(() => getByText('Loading...'))

    jest.runTimersToTime(150);
    expect(Scheduler).toHaveYielded([
      'Promise Resolved',
    ]);
    await waitForSuspense(0);
    await waitFor(() => getByText('2345'))

  });

  test.each(['1', 2, '3', 4])(`should suspend on %i index access`, async (index) => {
    const resources = new FutureArr(5);
    let resolvedValue
    let App = () => {
      return <Suspense fallback={<div>Loading...</div>}><LogSuspense action={() => resolvedValue = resources[index]}>
        <div>
          foo
        </div>
      </LogSuspense></Suspense>
    };
    let renderer;
    act(() => {
      renderer = render(<App />, container)
    });
    const { getByText } = renderer;


    await waitFor(() => getByText('Loading...'))
    expect(Scheduler).toHaveYielded([
      'Suspend!'
    ]);
    jest.runTimersToTime(150);
    expect(Scheduler).toHaveYielded([
      'Promise Resolved',
    ]);
    await waitForSuspense(0);
    await waitFor(() => getByText('foo'));

    expect(resolvedValue).toEqual([2, 3, 4, 5][index]);
  })
  test.each(['bar', Symbol('foo'), 'baz'])(`should suspend on %s property access`, async (index) => {
    const resources = new FutureArr(5);
    let resolvedValue
    let App = () => {
      return <Suspense fallback={<div>Loading...</div>}><LogSuspense action={() => resolvedValue = resources[index]}>
        <div>
          foo
      </div>
      </LogSuspense></Suspense>
    };
    let renderer;
    act(() => {
      renderer = render(<App />, container)
    });
    const { getByText } = renderer;


    await waitFor(() => getByText('Loading...'))
    expect(Scheduler).toHaveYielded([
      'Suspend!'
    ]);
    jest.runTimersToTime(150);
    expect(Scheduler).toHaveYielded([
      'Promise Resolved',
    ]);
    await waitForSuspense(0);
    await waitFor(() => getByText('foo'));

    expect(resolvedValue).toEqual(undefined);
  })

});

describe('Array operations', () => {
  test.each` name           |   method   
            ${'fill'}       |   ${arr => (arr.fill(1), arr)}            
            ${'reverse'}    |   ${arr => (arr.reverse(), arr)}   
            ${'unshift'}    |   ${arr => (arr.unshift(4), arr)}
            ${'sort'}       |   ${arr => (arr.sort((a,b) => b - a), arr)}
            ${'splice'}     |   ${arr => (arr.splice(2), arr)}
            ${'copyWithin'} |   ${arr => (arr.copyWithin(0, 2))} 
  `(`Mutator method $name should defer outside render and throw in render`, async ({method}) => {
    const futArr = new FutureArr(5);

    const inRender = () => expect(() => method(futArr)).toThrowError();

    const outsideRender = () => {
      expect(unwrapProxy(method(futArr))).toBeInstanceOf(LazyArray)
    };
    act(() => {
      outsideRender();
    })
    let renderer;
    act(() => {
      renderer = render(<Suspense fallback={<div>Loading...</div>}><LogSuspense action={inRender}>foo</LogSuspense></Suspense>, container)
    });
    await waitForSuspense(150);
  })

  test.each` name          |       method
          ${'concat'}      | ${arr => arr.concat([6, 7])}
          ${'filter'}      | ${arr => arr.filter(num => num % 2)}
          ${'slice'}       | ${arr => arr.slice(0, 1)}
          ${'map'}         | ${arr => arr.map(i => i + 3)}
          ${'reduce'}      | ${arr => arr.reduce((coll, i) => [...coll, i + 3], [])}
          ${'reduceRight'} | ${arr => arr.reduceRight((coll, i) => [...coll, i + 3], [])}
          ${'flat'}        | ${arr => arr.map(num => [num + 3]).flat()}
          ${'flatMap'}     | ${arr => arr.flatMap(i => [i + 3])}
  `(`Applies defers native immutable method $name both in and outside render `, async ({ method }) => {
    let created;
    const futrArr = new FutureArr(5);
    expect(() =>{ 
      expect(unwrapProxy(method(futrArr))).toBeInstanceOf(LazyArray)
    }).not.toThrow();
    let renderer;
    act(() => {
      renderer = render(<Suspense fallback={<div>Loading...</div>}><LogSuspense action={() => {
        created = method(futrArr);
      }}>foo</LogSuspense></Suspense>, container)
    })
    const {getByText} = renderer
    expect(Scheduler).toHaveYielded([
      'No Suspense'
    ]);

    await waitForSuspense(150);
    await waitFor(() => getByText('foo'))
    expect(unwrapProxy(created)).toBeInstanceOf(LazyArray);
    expect(created).toEqual(method([2, 3, 4, 5]));
  });
  test.each`
    name           | method
  ${'entries'}     | ${arr => arr.entries()}
  ${'values'}      | ${arr => arr.values()}                         
  ${'keys'}        | ${arr => arr.keys()}  
  `(`Applies defers native iterator-returning immutable method $name both in and outside render`, async ({method}) => {
    let created;
    const futrArr = new FutureArr(5);
    expect(() =>{ 
      expect(unwrapProxy(method(futrArr))).toBeInstanceOf(LazyIterator)
    }).not.toThrow();
    let renderer;
    act(() => {
      renderer = render(<Suspense fallback={<div>Loading...</div>}><LogSuspense action={() => {
        created = method(futrArr);
      }}>foo</LogSuspense></Suspense>, container)
    })
    const {getByText} = renderer
    expect(Scheduler).toHaveYielded([
      'No Suspense'
    ]);

    await waitForSuspense(150);
    await waitFor(() => getByText('foo'))
    expect(unwrapProxy(created)).toBeInstanceOf(LazyIterator);
    
    expect([...created]).toEqual([...method([2, 3, 4, 5])]);
  });



  test.each` name           |       expected                              |    method
          ${'immReverse'}   | ${arr => arr.slice().reverse()}             |  ${arr => arr.immReverse()}
          ${'immCopywithin'}| ${arr => arr.slice().copyWithin(1,2,3)}     | ${arr => arr. immCopyWithin(1,2,3)}
          ${'immSort'}      | ${arr => arr.slice().sort((a,b) => b-a)}    |  ${arr => arr.immSort((a,b) => b-a)}
          ${'immFill'}      | ${arr => arr.slice().fill(1)}               |  ${arr => arr.immFill(1)}
   `(`Applies defers non-native immutable method $name both in and outside render `, async ({ method, expected }) => {
    let created;
    const futrArr = new FutureArr(5);
    expect(() =>{ 
      expect(unwrapProxy(method(futrArr))).toBeInstanceOf(LazyArray)
    }).not.toThrow();
    let renderer;
    act(() => {
      renderer = render(<Suspense fallback={<div>Loading...</div>}><LogSuspense action={() => {
        created = method(futrArr);
      }}>foo</LogSuspense></Suspense>, container)
    })
    const {getByText} = renderer
    expect(Scheduler).toHaveYielded([
      'No Suspense'
    ]);

    await waitForSuspense(150);
    await waitFor(() => getByText('foo'))
    expect(unwrapProxy(created)).toBeInstanceOf(LazyArray);
    expect(created).toEqual(expected([2, 3, 4, 5]));
  });
  //indexOf, includes, join, lastIndexOf, toString, toSource, toLocaleString, pop, shift, every, find, findIndex, forEach, some, Symbol.iterator

  test.each`   name             |  method                             |        expected
    ${'indexOf'}         |  ${arr => arr.indexOf(2)}                  |     ${0}
    ${'includes'}        |  ${arr => arr.includes(3)}                 |     ${true}
    ${'join'}            |  ${arr => arr.join(' ')}                   |     ${'2 3 4 5'}
    ${'lastIndexOf'}     |  ${arr => arr.lastIndexOf(4)}              |     ${2}
    ${'toString'}        |  ${arr => arr.toString()}                  |     ${'2,3,4,5'}
    ${'toLocaleString'}  |  ${arr => arr.toLocaleString()}            |     ${'2,3,4,5'}
    ${'every'}           |  ${arr => arr.every(a => a % 2 === 0)}     |     ${false}
    ${'find'}            |  ${arr => arr.find(a => a === 5)}          |     ${5}
    ${'findIndex'}       |  ${arr => arr.findIndex(a => a === 5)}     |     ${3}
    ${'forEach'}         |  ${arr => arr.forEach(a => a)}             |     ${undefined}
    ${'some'}            |  ${arr => arr.some(a => a % 2 === 0)}      |     ${true}
    ${Symbol.iterator}   |  ${arr => [...arr, ...arr]}                  |     ${[2, 3, 4, 5, 2, 3, 4, 5]}
  `(`suspends on $name inside render and throws outside render`, async ({ method, expected }) => {
    const futureArr = new FutureArr(5);

    const inRender = () => method(futureArr);
    const outsideRender = () => expect(() => method(futureArr)).toThrowError(/** TODO: outofrender error */);

    act(() => {
      outsideRender();
    });

    let renderer;
    let created;
    expect(() => method(resource)).toThrow(); //TODO: specify error
    act(() => {
      renderer = render(<Suspense fallback={<div>Loading...</div>}><LogSuspense action={() => {
        created = inRender();
      }}>foo</LogSuspense></Suspense>, container)
    })
    const { getByText } = renderer;
    expect(Scheduler).toHaveYielded([
      'Suspend!'
    ]);

    jest.runTimersToTime(150);
    expect(Scheduler).toHaveYielded([
      'Promise Resolved',
    ]);
    await waitForSuspense(0);
    await waitFor(() => getByText('foo'))
    expect(Scheduler).toHaveYielded([
      'No Suspense',
    ])
    expect(created).toEqual(expected);
    //TODO: test created
  })
  //TODO: invalid methods pop shift and push

  test('subclasses Array', async () => {
    const resources = new FutureArr(5);
    //suspends on Array.from, Array.isArray, have Array.of static method
    expect(unwrapProxy(resources)).toBeInstanceOf(Array);
    expect(Array.isArray(resources)).toEqual(true);
    expect(() => Array.from(resources)).toThrow();




    let created;
    expect(() => Array.from(resources)).toThrowError(); //TODO: specify error
    let renderer;
    act(() => {
      renderer = render(<Suspense fallback={<div>Loading...</div>}><LogSuspense action={() => {
        created = Array.from(resources);
      }}>foo</LogSuspense></Suspense>, container)
    })
    const {getByText} = renderer;

    expect(Scheduler).toHaveYielded(['Suspend!']);
    await waitForSuspense(150);
    await waitFor(() => getByText('foo'))
    expect(created).toBeInstanceOf(Array);
    expect(created).not.toBeInstanceOf(FutureArr);
    expect(created).toEqual([2, 3, 4, 5])

    expect(unwrapProxy(FutureArr.of([2, 3, 4]))).toBeInstanceOf(LazyArray);

  });
  // it('has immutable static @@species', () => {
  //   let clss = ArrayResource[Symbol.species];
  //   ArrayResource[Symbol.species] = class {};
  //   expect(Object.is(clss, ArrayResource[Symbol.species])).toEqual(true);
  // });
    test.skip("should have debug method", () => { })
    test.skip('should have suspend method', () => { })

});
