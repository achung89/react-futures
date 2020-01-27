import { act } from 'react-dom/test-utils';
import React, { Suspense } from 'react';
import ReactNoop from 'react-noop-renderer';


// TODO: setter should not suspend
// TODO: lazy before suspense, eager after suspense
// TODO: should entries, values, and keys throw, or return an iterator of FutureArrays?
// TODO: should push and unshift suspend since they require knowledge of length?
// TODO: all subsequently created arrays should all share the same promise
// TODO: test freeze, seal, delete
let Scheduler
let fetchArray = () => new Promise((res, rej) => {
  setTimeout(() => {
    res([2,3,4,5])
  }, 1000)
})

let container;
let resources;
beforeEach(() => {
  resources = new ArrayResource(fetchArray());
  Scheduler = require('scheduler')
});
afterEach(() => {
  resources = null;
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

    ReactNoop.render(<App />)

    expect(ReactNoopRenderer.getChildren()).toEqual({ type: 'div', hidden: 'false', children: [] })
  });

  it.skip("should suspend when rendering", () => {
    let thrownValue;
    let App = () => <div>
      {resources}
    </div>;
    ReactNoop.render(<App />)

    // TODO: test render after resolve
  });

  ['1', 2, '3', 4].forEach((index) => {
    it(`should suspend on ${JSON.stringify(index)} index access`, () => {

      let AppSuspense = () => {
        return <LogSuspense action={() => resolvedValue = resources[index]}>
          <div>
            foo
        </div>
        </LogSuspense>
      };

      ReactNoop.render(<AppSuspense />);
      expect(Scheduler).toFlushAndYieldThrough([
        'Suspend!'
      ]);
      jest.advanceTimersByTime(5000);
      expect(Scheduler).toFlushAndYieldThrough([
        'No Suspense'
      ])
      expect(resolvedValue).toEqual(3);
    });
  })

});

['bar', Symbol('foo'), {}, 'baz'].forEach(key => {
  it(`should not suspend on non-indexed ${key} access  access access`, () => {

    let App = () => {
      return <LogSuspense action={() => resources[0]}>
        <div>
          foo
      </div>
      </LogSuspense>
    };
  })


  ReactNoop.render(<App />);
  expect(Scheduler).toFlushAndYieldThrough([
    'No Suspense'
  ]);
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
    test.skip(`mutator method ${method} shouldn't throw in n' out of render`, () => {
      expect(() => resources[method]()).not.toThrow();
      ReactNoop.render(<LogSuspense action={() => resources[method]()}></LogSuspense>)
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
          expect(() => method(resources)).not.toThrow();
          ReactNoop.render(<LogSuspense action={() => {
            created = method(resources);
          }}></LogSuspense>)
          expect(Scheduler).toFlushAndYieldThrough(['No Suspense']);

          expect(created).toBeInstanceOf(ArrayResource);


          let resourceResult = await Promise.all(resources);
          let createdResult = await Promise.all(created);

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
    ${Symbol.iterator} |  ${arr => [...arr, ...arr]}                  |     ${[2,3,4,5,2,3,4,5]}
  `(({ name, method, expected }) => {
    it(`suspends on ${name}`, () => {
      let created;
      expect(() => method(resource)).toThrow(); //TODO: specify error
      ReactNoop.render(<LogSuspense action={() => {
        created = method(resource);
      }}></LogSuspense>)
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
    ReactNoop.render(<LogSuspense action={() => {
      created = Array.from(resource);
    }}></LogSuspense>)
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