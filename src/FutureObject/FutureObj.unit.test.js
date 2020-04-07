
    jest.mock('scheduler', () => require('scheduler/unstable_mock'));
    jest.useFakeTimers();

import React, { Suspense } from 'react';
import { createFutureObject } from '../index';
import { eachObjectStatic, eachFutureObjectStatic, getterObjectStaticEach, noopObjectStaticEach, mutableObjectStaticEach, invalidObjectStaticEach } from './FutureObj-statics';
import waitForSuspense from '../test-utils/waitForSuspense';
import { act } from 'react-dom/test-utils';
import { render } from '../test-utils/rtl-renderer';
import { waitFor } from '@testing-library/dom';
import {TransparentObjectEffect, isEffect} from '../internal';
import {unwrapProxy, suspend} from '../internal';
import {TransparentArrayEffect} from '../internal';
expect.extend(require('../test-utils/renderer-extended-expect'));	  


// TODO: test error handling
const expectedJSON = value => ({
  foo: "futon",
  bar: "barcandy",
  bazz: "bazzerita",
  value,
});
// TODO: test obj instance methods
// TODO: assert return values of Object/FutureObj static methods
let resolved = undefined;
const fetchJson = val => new Promise((res, rej) => {
  setTimeout(() => {
    try {
      Scheduler.unstable_yieldValue('Promise Resolved')
      res(expectedJSON(val))
    } catch (err) {
      rej(err)
    }

  }, 100);
}).catch(err => {throw err});


const LogSuspense = ({ action }) => {
  try {
    const val = action();
    Scheduler.unstable_yieldValue('No Suspense');
    if(isEffect(val)) {
      suspend(val);
    }
    if(typeof val !== 'undefined') {
      resolved = val;
    }
    return 'foo';
  } catch (promise) {
    if (typeof promise.then === 'function') {
      Scheduler.unstable_yieldValue(`Suspend!`);
    } 
    throw promise
  }

}
let FutureObj;
let container;
let Scheduler;
beforeEach(() => {
  jest.resetModules();
  Scheduler = require('scheduler/unstable_mock');
  container = document.createElement('div');
  document.body.appendChild(container);
  FutureObj = createFutureObject(fetchJson);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
  FutureObj.reset();
  FutureObj = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
  resolved = null;
});

describe("Object and FutureObject static methods behaviour", () => {
  //  eachObjectStatic('Expect sync object static method $staticMethod to $inRender in render and $outRender outside render', inRenderOutRenderTests);
  // eachFutureObjectStatic('Expect $constructor object static method $staticMethod to $inRender in render and $outRender outside render', inRenderOutRenderTests);
});

async function inRenderOutRenderTests ({ constructor, staticMethod, inRender, outRender, returnType, expected })  {
  const futureObj = new FutureObj(1);
  const method = typeof staticMethod === 'string' 
                  ? (constructor === 'Object' ?  Object[staticMethod] :
                  constructor === 'FutureObject' ? FutureObj[staticMethod] : new Error("invalid methodType")) : 
                  staticMethod;
  const assertionsOutsideRender = {
    throw: () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */),
    defer: () => {
      let Constructor;
      if(returnType === 'object') {
        Constructor = TransparentObjectEffect;
      }
      if(returnType === 'array') {
        Constructor = TransparentArrayEffect;
      }
      expect(unwrapProxy(method(futureObj))).toBeInstanceOf(Constructor)
    },
    none: () => expect(() => method(futureObj)).not.toThrow(),
    suspend: () => method(futureObj)
  }

  const assertionsInsideRender = {
    none: () => expect(() => method(futureObj)).not.toThrow(),
    suspend: () => method(futureObj),
    defer: () => {
      let Constructor;
      if(returnType === 'object') {
        Constructor = TransparentObjectEffect;
      }
      if(returnType === 'array') {
        Constructor = TransparentArrayEffect;
      }
      const val = method(futureObj)
      expect(unwrapProxy(val)).toBeInstanceOf(Constructor)
      return val;
    },
    throw: () => {
      expect(() => method(futureObj)).toThrowError();
    }
  }
  
  act(() => {
    assertionsOutsideRender[outRender]();
  })

  const App = ({ render }) => {
    return <Suspense fallback={<div>Loading...</div>}>
      {render ? <LogSuspense action={() => assertionsInsideRender[inRender]()}>
        <div>
          foo
      </div> 
      </LogSuspense> : null}
    </Suspense>

  };

  let renderer;
  act(() => {
    renderer = render(<App render />, container)  
  });
  let {getByText} = renderer;

  switch (inRender) {
    case "suspend":
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
      const expected = constructor === 'Object' 
      ? method(expectedJSON(1))
      : constructor === 'FutureObject'
      ? method(new TransparentObjectEffect(() => expectedJSON(1)))
      : undefined;
      expect(resolved).toEqual(expected)
      break;
    case "throw":
      jest.runTimersToTime(150);

      break;
    case "defer":
      expect(Scheduler).toHaveYielded([
        'No Suspense',
        'Suspend!'
      ]);
      jest.runTimersToTime(150);
      expect(Scheduler).toHaveYielded([
        'Promise Resolved',
      ]);
      await waitForSuspense(0);
      await waitFor(() => getByText('foo'))

      expect(resolved).toEqual(method(expectedJSON(1)))
      expect(Object.getOwnPropertyDescriptors(resolved)).toEqual(Object.getOwnPropertyDescriptors(method(expectedJSON(1))))
      break;
    case "none":
      expect(Scheduler).toHaveYielded(['No Suspense']);
      await waitForSuspense(150);
      await waitFor(() => getByText('foo'))
      expect(Scheduler).toHaveYielded([          
        "Promise Resolved"
      ])
      break;
    default:
      throw new Error(`Invalid value for inRender "${inRender}"`)
  }
}

describe('Object static methods', () => {
  getterObjectStaticEach('Expect static getter $staticMethod to suspend in render and throw outside render', async ({ staticMethod }) => {
    const futureObj = new FutureObj(1);
    const method = typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;

    const inRender =  () => method(futureObj);
    const outsideRender = () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */);

    act(() => {
      outsideRender();
    });

    const App = ({ render }) => {
      return <Suspense fallback={<div>Loading...</div>}>
        {render ? <LogSuspense action={() => inRender()}>
          <div>
            foo
        </div> 
        </LogSuspense> : null}
      </Suspense>

    };

    let renderer;
    act(() => {
      renderer = render(<App render />, container)  
    });
    const {getByText} = renderer;
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
    const expected = method(expectedJSON(1))
    expect(resolved).toEqual(expected);
  });

  noopObjectStaticEach('Expect method $staticMethod to do nothing', async ({ staticMethod }) => {
    const futureObj = new FutureObj(1);
    const method = typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;

    const inRender =  () => {
      expect(() => method(futureObj)).not.toThrow(Promise);
      //TODO: add more error types
      expect(() => method(futureObj)).not.toThrow(Error);

      expect(unwrapProxy(method(futureObj))).toBe(undefined);
      expect(unwrapProxy(method(futureObj))).toBe(undefined);
    };
    const outsideRender = inRender;

    act(() => {
      outsideRender();
    });

    const App = ({ render }) => {
      return <Suspense fallback={<div>Loading...</div>}>
        {render ? <LogSuspense action={() => inRender()}>
          <div>
            foo
        </div> 
        </LogSuspense> : null}
      </Suspense>

    };

    let renderer;
    act(() => {
      renderer = render(<App render />, container)  
    });
    const {getByText} = renderer;

    expect(Scheduler).toHaveYielded(['No Suspense']);
    await waitForSuspense(150);
    await waitFor(() => getByText('foo'))
    expect(Scheduler).toHaveYielded([          
      "Promise Resolved"
    ])
  });
  mutableObjectStaticEach('Expect method $staticMethod to throw in render and defer outside render', async ({ staticMethod, returnType }) => {
    const futureObj = new FutureObj(1);
    const method = typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;
    // TODO: specify error
    const inRender = () => expect(() => method(futureObj)).toThrowError();

    const outsideRender = () => {
      let Constructor;
      if(returnType === 'object') {
        Constructor = TransparentObjectEffect;
      }
      if(returnType === 'array') {
        Constructor = TransparentArrayEffect;
      }
      
      expect(unwrapProxy(method(futureObj))).toBeInstanceOf(Constructor)
    };

    act(() => {
      outsideRender();
    });

    const App = ({ render }) => {
      return <Suspense fallback={<div>Loading...</div>}>
        {render ? <LogSuspense action={inRender}>
          <div>
            foo
        </div> 
        </LogSuspense> : null}
      </Suspense>

    };

    let renderer;
    act(() => {
      renderer = render(<App render />, container)  
    });
    jest.runTimersToTime(150);

  });
  invalidObjectStaticEach('Expect method $staticMethod to error both in and out of render', () => {
    const futureObj = new FutureObj(1);

    const inRender = () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */);
    const outsideRender = inRender;

    act(() => {
      outsideRender();
    });

    const App = ({ render }) => {
      return <Suspense fallback={<div>Loading...</div>}>
        {render ? <LogSuspense action={inRender}>
          <div>
            foo
        </div> 
        </LogSuspense> : null}
      </Suspense>

    };

    let renderer;
    act(() => {
      renderer = render(<App render />, container)  
    });
    jest.runTimersToTime(150);

  })
});