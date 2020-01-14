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
  resources = new ArrayResource([createPromise(2), 
                                3, 
                                createPromise(4),
                                5,
                                createPromise(5)]);

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

  it('receives mutator methods', () => {
    // fill, push, reverse, unshift, sort, splice, copyWithin
    test("fill", () => {
    
    })
    test("push", () => {
      
    })
    test("reverse", () => {
      
    })
    test("unshift", () => {
      
    })
    test("sort", () => {
      
    })
    test("splice", () => {
      
    })
    test("copyWithin", () => {
      
    })
  });
  
  it('receives the immutable methods. Apply methods to resolved values lazily when needed', () => {
    //concat, filter, slice, entries, keys, map, reduce, reduceRight, values, flat, flatMap
    test("concat", () => {
    
    })
    test("filter", () => {
        
    })
    test("slice", () => {
        
    })
    test("entries", () => {
        
    })
    test("keys", () => {
        
    })
    test("map", () => {
        
    })
    test("reduce", () => {
        
    })
    test("reduceRight", () => {
        
    })
    test("values", () => {
        
    })
    test("flat", () => {
        
    })
    test("flatMap", () => {
        
    })
  })
  it('suspends on...', () => {
    //indexOf, includes, join, lastIndexOf, toString, toSource, toLocaleString, pop, shift, every, find, findIndex, forEach, some, Symbol.iterator
    test("indexOf", () => {
    
    })
    test("includes", () => {
        
    })
    test("join", () => {
        
    })
    test("lastIndexOf", () => {
        
    })
    test("toString", () => {
        
    })
    test("toSource", () => {
        
    })
    test("toLocaleString", () => {
        
    })
    test("pop", () => {
        
    })
    test("shift", () => {
        
    })
    test("every", () => {
        
    })
    test("find", () => {
        
    })
    test("findIndex", () => {
        
    })
    test("forEach", () => {
        
    })
    test("some", () => {
        
    })
    test("Symbol.iterator", () => {
        
    })
  });

  it('allows access and mutation of following methods without suspending and persist changes to resolved ArrayResource', () => {
    test("constructor", () => {
    
    })
    test("length", () => {
        
    })
    test("unscopables", () => {
        
    })
  });

  it('subclasses Array', () => {
    //suspends on Array.from, Array.isArray, have Array.of static method

  });
  it('has immutable static @@species', () => {

  });
  it('has debug and suspend method', () => {

  })
});