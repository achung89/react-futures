
import React from 'react';
import ReactDOM from 'react-dom';
import { createFutureArray } from '../index';
import { act } from 'react-dom/test-utils';
import FutureArray from './FutureArray';


// TODO: setter should not suspend
// TODO: lazy before suspense, eager after suspense <=== does this still apply???????
// TODO: should entries, values, and keys throw, or return an iterator of FutureArrays?
// TODO: should push and unshift suspend since they require knowledge of length?
// TODO: all subsequently created arrays should all share the same promise
// TODO: test freeze, seal, delete
// TODO: test creating FutureArr instance in render
let Scheduler
let fetchArray = val => new Promise((res, rej) => {
  setTimeout(() => {
    res([2,3,4,val])
  }, 1000)
})

let container;
let FutureArr;
beforeEach(() => {
  FutureArr =  createFutureArray(fetchArray);
  Scheduler = require('scheduler')
  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  FutureArr = null;
  document.body.removeChild(container);
  container = null;
});
const LogSuspense = ({ action }) => {
  try {
    action();
    Scheduler.unstable_yieldValue('No Suspense');
    return <span prop={text} />;
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

  it.skip("should render properly", () => {
    let App = () => <div>
    </div>;
    act(() => {
      ReactDOM.createRoot(container).render(<App />)
    })

    expect(container.innerHTML).toEqual(`<div><div></div></div>`)
  });

  it.skip("should suspend when rendering", () => {
    let thrownValue;
    let App = () => <div>
      {new FutureArr(5)}
    </div>;

    act(() => {
      ReactDOM.createRoot(container).render(<App />)
    })
    // TODO: test render after resolve
  });

  test.each(['1', 2, '3', 4])(`should suspend on %i index access`, (index) => {
      const resources = new FutureArr(5);
      let App = () => {
        return <LogSuspense action={() => resolvedValue = resources[index]}>
          <div>
            foo
        </div>
        </LogSuspense>
      };

      act(() => {
        ReactDOM.createRoot(container).render(<App />)
      });
      expect(Scheduler).toFlushAndYieldThrough([
        'Suspend!'
      ]);
      jest.advanceTimersByTime(5000);
      expect(Scheduler).toFlushAndYieldThrough([
        'No Suspense'
      ])
      expect(resolvedValue).toEqual(3);
  })

  test.each(['bar', Symbol('foo'), {}, 'baz'])(`should not suspend on non-indexed %s access  access access`, key => {
      const resources = new FutureArr(5);
      let App = () => {
        return <LogSuspense action={() => resources[0]}>
          <div>
            foo
        </div>
        </LogSuspense>
      };

    console.log(container);
    act(() => {
      ReactDOM.createRoot(container).render(<App />)
    });
    expect(Scheduler).toFlushAndYieldThrough([
      'No Suspense'
    ]);
  });
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
    test.skip(`mutator method ${method} should defer outside render and throw in render`, () => {
      expect(() => resources[method]()).not.toThrow();
      act(() => {
        ReactDOM.createRoot(container).render(<LogSuspense action={() => resources[method]()}></LogSuspense>)
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
          ${'flatMap'}     | ${() => new ArrayResource([1, 2, createPromise([3, 4]), 5])
      .flatMap(i => i + 3)}
  `(({ name, method }) => {
        test(`Applies method ${name} lazily`, async () => {
          let created;
          const resources = new FutureArr(5);
          expect(() => method(resources)).not.toThrow();
          
          act(() => {
            ReactDOM.createRoot(container).render(<LogSuspense action={() => {
              created = method(resources);
            }}></LogSuspense>)
          })
          expect(Scheduler).toFlushAndYieldThrough(['No Suspense']);

          expect(created).toBeInstanceOf(FutureArray);


          let resourceResult = await FutureArray.toPromise(resources);
          let createdResult = await FutureArray.toPromise(created);

          expect(resourceResult).toStrictEqual([2, 3, 4, 5]);
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
        ReactDOM.createRoot(container).render(<LogSuspense action={() => {
          created = method(resource);
        }}></LogSuspense>)
      })
      expect(Scheduler).toFlushAndYieldThrough(['Suspend!']);
      jest.advanceTimersByTime(5000);
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
      ReactDOM.createRoot(container).render(<LogSuspense action={() => {
        created = Array.from(resource);
      }}></LogSuspense>)
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