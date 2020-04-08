
jest.useFakeTimers();
jest.mock('scheduler', () => require('scheduler/unstable_mock'));

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { createFutureArray } from '../../../index';
import { act } from 'react-dom/test-utils';
import { thisMap } from '../../../Effect/Effect';
import { TransparentArrayEffect } from '../../TransparentArrayEffect';
import  {render} from '../../../test-utils/rtl-renderer';
import waitForSuspense from '../../../test-utils/waitForSuspense';
import { waitFor } from '@testing-library/dom';
expect.extend(require('../../../test-utils/renderer-extended-expect'));	  

// TODO: setter should not suspend
// TODO: lazy before suspense, eager after suspense <=== does this still apply???????
// TODO: should entries, values, and keys throw, or return an iterator of FutureArrays?
// TODO: should push and unshift suspend since they require knowledge of length?
// TODO: all subsequently created arrays should all share the same promise
// TODO: test freeze, seal, delete
// TODO: test creating FutureArr instance in render
// TODO: test error handling
let Scheduler
let fetchArray = val => new Promise((res, rej) => {
  setTimeout(() => {
    Scheduler.unstable_yieldValue('Promise Resolved')
    res([2,3,4,val])
  }, 100)
})

let container;
let FutureArr;
beforeEach(() => {
  jest.resetModules();
  FutureArr =  createFutureArray(fetchArray);
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
const LogSuspense = ({ action }) => {
  try {
    action();
    Scheduler.unstable_yieldValue('No Suspense');
    return null;
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


    const MiniApp = () =><>{new FutureArr(5)}</>

    const App = () => <Suspense fallback={<div>Loading...</div>}>
      <div>
        <MiniApp />
      </div>
    </Suspense>;
    let renderer;
    act(() => {
      renderer = render(<App />, container)
    });
    const {getByText} = renderer;
    await waitFor(() => getByText('Loading...'))

    jest.runTimersToTime(150);
    expect(Scheduler).toHaveYielded([
      'Promise Resolved',
    ]);
    await waitForSuspense(0);
    await waitFor(() => getByText('2345'))

  });

  test.each(['1', 2, '3', 4,'bar', Symbol('foo'), {}, 'baz'])(`should suspend on %i index access`, (index) => {
      const resources = new FutureArr(5);
      let resolvedValue
      let App = () => {
        return <Suspense fallback={<div>Loading...</div>}><LogSuspense action={() => resolvedValue = resources[index]}>
          <div>
            foo
        </div>
        </LogSuspense></Suspense>
      };

      act(() => {
        render(<App />, container)
      });

      expect(Scheduler).toHaveYielded([
        'Suspend!'
      ]);

      jest.advanceTimersByTime(2000);
      expect(Scheduler).toHaveYielded([
        'No Suspense'
      ])
      expect(resolvedValue).toEqual(3);
  })

});

//TODO: these should suspend
describe('Array operations', () => {
  [
    'fill',
    'push',
    'reverse',
    'unshift',
    'sort',
    'splice',
    'copyWithin'
  ].forEach(method => {
    const resources = new FutureArr(5);
    test(`mutator method ${method} should defer outside render and throw in render`, () => {
      expect(() => resources[method]()).not.toThrow();
      act(() => {
        render(<LogSuspense action={() => resources[method]()}></LogSuspense>, container)
      });
      expect(Scheduler).toFlushAndYieldThrough(['No Suspense'])
      // TODO: test lazy results
    })
  })


  test.each` name          |       method
          ${'concat'}      | ${arr => arr.concat([6, 7])}
          ${'filter'}      | ${arr => arr.filter(num => num % 2)}
          ${'slice'}       | ${arr => arr.slice(0, 1)}
          ${'entries'}     | ${arr => arr.entries()}
          ${'keys'}        | ${arr => arr.keys()}
          ${'map'}         | ${arr => arr.map(i => i + 3)}
          ${'reduce'}      | ${arr => arr.reduce((coll, i) => [...coll, i + 3], [])}
          ${'reduceRight'} | ${arr => arr.reduceRight((coll, i) => [...coll, i + 3], [])}
          ${'values'}      | ${arr => arr.values()}
          ${'flat'}        | ${() => new ArrayResource([1, 2, createPromise([3, 4]), 5]).flat()}
          ${'flatMap'}     | ${() => new ArrayResource([1, 2, createPromise([3, 4]), 5]).flatMap(i => i + 3)}
  `(({ name, method }) => {
        test(`Applies method ${name} lazily`, async () => {
          let created;
          const resources = new FutureArr(5);
          expect(() => method(resources)).not.toThrow();
          
          act(() => {
            render(<LogSuspense action={() => {
              created = method(resources);
            }}></LogSuspense>, container)
          })
          expect(Scheduler).toFlushAndYieldThrough(['No Suspense']);

          expect(thisMap(created)).toBeInstanceOf(TransparentArrayEffect);


          expect(createdResult).toStrictEqual(method([2, 3, 4, 5]));
        })
      })

  //indexOf, includes, join, lastIndexOf, toString, toSource, toLocaleString, pop, shift, every, find, findIndex, forEach, some, Symbol.iterator

  // TODO: Expected values
  test.each`   name             |  method                             |        expected
    ${'indexOf'}         |  ${arr => arr.indexOf(2)}                  |     ${0}
    ${'includes'}        |  ${arr => arr.includes(3)}                 |     ${true}
    ${'join'}            |  ${arr => arr.join(' ')}                   |     ${'2 3 4 5'}
    ${'lastIndexOf'}     |  ${arr => arr.lastIndexOf(4)}              |     ${2}
    ${'toString'}        |  ${arr => arr.toString()}                  |     ${'2,3,4,5'}
    ${'toSource'}        |  ${arr => arr.toSource()}                  |     ${''}
    ${'toLocaleString'}  |  ${arr => arr.toLocaleString()}            |     ${''}
    ${'pop'}             |  ${arr => arr.pop()}                       |     ${5}
    ${'shift'}           |  ${arr => arr.shift()}                     |     ${2}
    ${'every'}           |  ${arr => arr.every(a => a % 2 === 0)}     |     ${false}
    ${'find'}            |  ${arr => arr.find(a => a === 5)}          |     ${5}
    ${'findIndex'}       |  ${arr => arr.findIndex(a => a === 5)}     |     ${3}
    ${'forEach'}         |  ${arr => arr.forEach(a => a)}             |     ${undefined}
    ${'some'}            |  ${arr => arr.some(a => a % 2 === 0)}      |     ${true}
    ${Symbol.iterator}   |  ${arr => [...arr, ...arr]}                  |     ${[2,3,4,5,2,3,4,5]}
  `(({ name, method, expected }) => {
    it(`suspends on ${name}`, () => {
      let created;
      expect(() => method(resource)).toThrow(); //TODO: specify error
      act(() => {
        render(<LogSuspense action={() => {
          created = method(resource);
        }}></LogSuspense>, container)
      })
      expect(Scheduler).toFlushAndYieldThrough(['Suspend!']);
      jest.advanceTimersByTime(2000);
      expect(Scheduler).toFlushAndYieldThrough([
        'No Suspense'
      ])
      expect(created).toEqual(expected)
      //TODO: test created
    });
  })


  it('subclasses Array', () => {
    const resources = new FutureArr(5);
    //suspends on Array.from, Array.isArray, have Array.of static method
    expect(resources).toBeInstanceOf(Array);
    expect(Array.isArray(resources)).toEqual(true);
    expect(() => Array.from(resources)).toThrow();
    

    try {
      Array.from(resources);
    } catch (promise) {
      expect(promise).toBeInstanceOf(Promise);
    }

    let created;
    expect(() => Array.from(resources)).toThrow(); //TODO: specify error
    act(() => {
      render(<LogSuspense action={() => {
        created = Array.from(resource);
      }}></LogSuspense>, container)
    })
    expect(Scheduler).toFlushAndYieldThrough(['Suspend!']);
    jest.advanceTimersByTime(5000);
    expect(Scheduler).toFlushAndYieldThrough([
      'No Suspense'
    ])
    expect(created).toBeInstanceOf(Array);
    expect(created).not.toBeInstanceOf(ArrayResource);
    expect(created).toEqual([2, 3, 4, 5])

    expect(ArrayResource.of([2, 3, 4])).toBeInstanceOf(ArrayResource);

  });
  // it('has immutable static @@species', () => {
  //   let clss = ArrayResource[Symbol.species];
  //   ArrayResource[Symbol.species] = class {};
  //   expect(Object.is(clss, ArrayResource[Symbol.species])).toEqual(true);
  // });
  it('has debug and suspend method', () => {
    test.skip("should have debug method", () => { })
    test.skip('should have suspend method', () => { })
  });
});