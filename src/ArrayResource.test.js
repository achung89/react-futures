import { act } from 'react-dom/test-utils';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Scheduler } from 'react'


const SuspenseMock = ({ onThrow, children }) => {
  class ErrorBoundary extends React.Component {
    componentDidCatch(err) {
      onThrow(err);
    }
    render() {
      return this.props.children
    }
  };

  return <ErrorBoundary>
    {children}
  </ErrorBoundary>
}


let createPromise = val => new Promise((res, rej) => {
  setTimeout(() => {
    res(val)
  }, 1000)
})

let container;
let resources;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  resources = new ArrayResource([2, 
                                createPromise(3), 
                                createPromise(4),
                                5]);

});
afterEach(() => {
  document.body.removeChild(container);
  container = null;
  resources = null;
});

describe("In only render context", () => {

  it("should render properly", () => {
    let thrownValue;
    let App = () => <div>
      <SuspenseMock onThrow={thrown => thrownValue = thrown}>
        Value
      </SuspenseMock>
    </div>;

    act(() => {
      ReactDOM.createRoot(<App />, container)
    });
    expect(thrownValue).toEqual(resources);
    // TODO: test render after resolve
  });

  it("should suspend when rendering", () => {
    let thrownValue;
    let App = () => <div>
      <SuspenseMock onThrow={thrown => thrownValue = thrown}>
        {resources}
      </SuspenseMock>
    </div>;

    act(() => {
      ReactDOM
        .createRoot(container)
        .render(<App />)
    });
    expect(thrownValue).toEqual(resources);
    // TODO: test render after resolve
  });

  it("should suspend on property access", () => {
    let thrownValue;
    let App = () => {
      resources[1];
      return <div>
        foo
      </div>
    };

    act(() => {
      ReactDOM.createRoot(container)
              .render(<SuspenseMock onThrow={thrown => thrownValue = thrown}><App /></SuspenseMock>);
    });
    expect(thrownValue).toEqual(resources);
    // TODO: test render after resolve
  });
});

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
      test(`mutator method ${method} shouldn't throw`, () => {
        expect(() => resources[method]()).not.toThrow();

      })
    })

  
  test.each`   method                                                    |        expected
            ${arr => arr.concat([6,7])}                                  |    ${[2,3,4,5,6,7]}
            ${arr => arr.filter( num => num % 2)}                        |    ${[3,5]}      
            ${arr => arr.slice(0,1)}                                     |    ${[2,3]}    
            ${arr => arr.entries()}                                      |    ${[2,3,4,5].entries()}    
            ${arr => arr.keys()}                                         |    ${[2,3,4,5].keys()}     
            ${arr => arr.map(i => i + 3)}                                |    ${[5,6,7,8]}   
            ${arr => arr.reduce((coll, i) => [...coll, i + 3], [])}      |    ${[5,6,7,8]}
            ${arr => arr.reduceRight((coll, i) => [...coll, i + 3], [])} |    ${[5,6,7,8]}
            ${arr => arr.values()}                                       |    ${[2,3,4,5]}   
            ${() => new ArrayResource([1,2,createPromise([3,4]),5])}     |    ${[1,2,3,4,5]}  
            ${() => new ArrayResource([1,2,createPromise([3,4]),5])
                          .flatMap(i => i + 3)}                          |    ${[4,5,6,7,8]}      
  `(({method, expected}) => {
    test(`Applies method ${method} lazily`, () => {
      try {
        method(resources);
      } catch (promise) {
        return promise
          .then(result => {
            expect(result).toStrictEqual(exptected)
          })
      }
    })
  })
    
    //indexOf, includes, join, lastIndexOf, toString, toSource, toLocaleString, pop, shift, every, find, findIndex, forEach, some, Symbol.iterator
    [
      'indexOf',
      'includes',
      'join',
      'lastIndexOf',
      'toString',
      'toSource',
      'toLocaleString',
      'pop',
      'shift',
      'every',
      'find',
      'findIndex',
      'forEach',
      'some',
      Symbol.iterator
    ].forEach(method =>{
      it(`suspends on ${method}`, () => {

        expect(() => resources[method]()).toThrow();

        try {
          resources[method]()
        } catch(thrownValue) {

          expect(thrownValue).toBeInstanceOf(Promise);
          return thrownValue
                  .then( result => {
                    expect(result).toStrictEqual([2,3,4,5])
                  });
        }
      });
    })


  it('subclasses Array', () => {
    //suspends on Array.from, Array.isArray, have Array.of static method
    expect(resources).toBeInstanceOf(Array);
    expect(Array.isArray(resources)).toEqual(true);
    expect(Array.from(resources)).toThrow();

    try {
      Array.from(resources);
    } catch(promise) {
      expect(promise).toBeInstanceOf(Promise);
      promise
        .then(results => {
          expect(results).toStrictEqual([2,3,4,5]);
        })
    }
    expect(ArrayResource.of([2,3,4])).toBeInstanceOf(ArrayResource);

  });
  it('has immutable static @@species', () => {
    let clss = ArrayResource[Symbol.species];
    ArrayResource[Symbol.species] = class {};
    expect(Object.is(clss, ArrayResource[Symbol.species])).toEqual(true);
  });
  it('has debug and suspend method', () => {
    test.skip("should have debug method", () => {})
    test.skip('should have suspend method', () => {})
  })
});