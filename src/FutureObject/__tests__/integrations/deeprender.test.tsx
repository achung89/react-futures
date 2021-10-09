jest.mock('scheduler', () => require('scheduler/unstable_mock'));
import { futureObject } from '../../../futures';

import { testSuspenseWithLoader } from '../../../test-utils/testSuspense';
import waitForSuspense from '../../../test-utils/waitForSuspense';

jest.useFakeTimers();
const expectedJSON = value => ({
  foo: 'futon',
  bar: 'barcandy',
  bazz: 'bazzerita',
  value,
});
// TODO: test obj instance methods
// TODO: assert return values of Object/FutureObj static methods
const fetchJson = val =>
  new Promise((res, rej) => {
    setTimeout(() => {
      try {
        res(expectedJSON(val));
      } catch (err) {
        rej(err);
      }
    }, 100);
  }).catch(err => {
    throw err;
  });
// test resetting value array prop with future array
/** obj.foo = new Array(() => obj.foo).map() EDIT: will be taken cae of by oblique types*/
// test suspending in same function as instantiation
// test suspending in child
// testing iterating in parent and in child and accessing in child or subchild

let StubFutureObject;
const PassThrough = ({ children }) => {
  return <div>{children}</div>;
};
const PropDrill = ({ prop, level }) => {
  const Drilled = [...Array(level)].reduce(
    Comp => {
      return ({ prop }) => <Comp prop={prop} />;
    },
    ({ prop }) => <div>{prop}</div>
  );
  return <Drilled prop={prop} />;
};
const DeepPassThrough = ({ children, level }) => {
  return [...Array(level)].reduce(el => {
    return <PassThrough>{el}</PassThrough>;
  }, children);
};

beforeEach(() => {
  StubFutureObject = futureObject(fetchJson);
});

afterEach(() => {
  StubFutureObject = null;
});

let Deep = ({ numbers }) => <div>{numbers}</div>;

describe('Instantiate in render, deep render scenarios', () => {
  test('should render ', async () => {
    let App = ({ nestedFuture = false }) => {
      const transformed = StubFutureObject.fromEntries(
        StubFutureObject.entries(new StubFutureObject(4)) // [['foo', 'futon'], ['bar', 'barcandy'], ['baz', 'bazzerita'], ['value', '4']]
        .map(([key, val]) => [key, 'a ' + String(val)]) // [[ 'foo', 'a futon' ], [ 'bar', 'a barcandy' ], [ 'baz', 'a bazzerita' ], [ 'value', 'a 4' ]]
      ) // {foo: 'a futon', bar: 'a barcandy', baz: 'a bazzerita', value: 'a 4' }


      const makeRender = obj => Object.keys(obj).concat(Object.values(obj));
      const rendered  = nestedFuture ? createNestedFuture(transformed) : transformed; // 

      return <div>{makeRender(rendered)}</div>;
    };

    await testSuspenseWithLoader(<App />, `<div>foobarbazzvaluea futona barcandya bazzeritaa 4</div>`, async () => {
        await waitForSuspense(100);
    });

    StubFutureObject = futureObject(fetchJson);

    await testSuspenseWithLoader(<App nestedFuture />, `<div>7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4</div>`, async () =>{
      await waitForSuspense(100);
      await waitForSuspense(100);
    });
  });

  test('should render deeply', async () => {
    const makeRender = obj => Object.keys(obj).concat(Object.values(obj));

    let App = ({ nestedFuture = false }) => {
      const transformed = StubFutureObject.fromEntries(
        StubFutureObject.entries(new StubFutureObject(4)) // [['foo', 'futon'], ['bar', 'barcandy'], ['baz', 'bazzerita'], ['value', '4']]
        .map(([key, val]) => [key, 'a ' + String(val)]) // [[ 'foo', 'a futon' ], [ 'bar', 'a barcandy' ], [ 'baz', 'a bazzerita' ], [ 'value', 'a 4' ]]
      ) // {foo: 'a futon', bar: 'a barcandy', baz: 'a bazzerita', value: 'a 4' }

      const result = nestedFuture
        ? createNestedFuture(transformed) 
        : transformed;

      return (
        <div>
          <Deep numbers={makeRender(result)} />
        </div>
      );
    };

    await testSuspenseWithLoader(<App />, `<div><div>foobarbazzvaluea futona barcandya bazzeritaa 4</div></div>`, async () => {
      await waitForSuspense(100);

    });
    StubFutureObject = futureObject(fetchJson);
    await testSuspenseWithLoader(
      <App nestedFuture />,
      `<div><div>7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4</div></div>`,
      async () => {
        await waitForSuspense(100);
        await waitForSuspense(100);

      }
    );
  });

  test('should render very deeply', async () => {
    
    let AppVeryDeep = ({ nestedFuture = false, level }) => {
      const transformed = StubFutureObject.fromEntries(
        StubFutureObject.entries(new StubFutureObject(4)) // [['foo', 'futon'], ['bar', 'barcandy'], ['baz', 'bazzerita'], ['value', '4']]
        .map(([key, val]) => [key, 'a ' + String(val)]) // [[ 'foo', 'a futon' ], [ 'bar', 'a barcandy' ], [ 'baz', 'a bazzerita' ], [ 'value', 'a 4' ]]
      ) // {foo: 'a futon', bar: 'a barcandy', baz: 'a bazzerita', value: 'a 4' }

      const makeRender = obj => Object.keys(obj).concat(Object.values(obj));

      const result = nestedFuture ? createNestedFuture(transformed) : transformed;

      return (
        <div>
          <DeepPassThrough level={level}>
            <Deep numbers={makeRender(result)} />
          </DeepPassThrough>
        </div>
      );
    };
    await testSuspenseWithLoader(
      <AppVeryDeep level={5} />,
      `<div><div><div><div><div><div><div>foobarbazzvaluea futona barcandya bazzeritaa 4</div></div></div></div></div></div></div>`,
      async () => {
        await waitForSuspense(100);
      }
    );

    StubFutureObject = futureObject(fetchJson);

    await testSuspenseWithLoader(
      <AppVeryDeep level={5} nestedFuture />,
      `<div><div><div><div><div><div><div>7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4</div></div></div></div></div></div></div>`,
      async () => {
        await waitForSuspense(100);
        await waitForSuspense(100);

      }
    );

    StubFutureObject = futureObject(fetchJson);

    await testSuspenseWithLoader(
      <AppVeryDeep level={200} />,
      `<div>`.repeat(202) + 'foobarbazzvaluea futona barcandya bazzeritaa 4' + `</div>`.repeat(202),
      async () => {        await waitForSuspense(100);
      }
    );

    StubFutureObject = futureObject(fetchJson);

    await testSuspenseWithLoader(
      <AppVeryDeep nestedFuture level={200} />,
      `<div>`.repeat(202) + '7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4' + `</div>`.repeat(202),
      async () => {
        await waitForSuspense(100);
        await waitForSuspense(100);

      }
    );
  });
  test('should render with prop drilling', async () => {
    const App = ({ level, nestedFuture = false }) => {
      const transformed = StubFutureObject.fromEntries(
        StubFutureObject.entries(new StubFutureObject(4)) // [['foo', 'futon'], ['bar', 'barcandy'], ['baz', 'bazzerita'], ['value', '4']]
        .map(([key, val]) => [key, 'a ' + String(val)]) // [[ 'foo', 'a futon' ], [ 'bar', 'a barcandy' ], [ 'baz', 'a bazzerita' ], [ 'value', 'a 4' ]]
      ) // {foo: 'a futon', bar: 'a barcandy', baz: 'a bazzerita', value: 'a 4' }

      const makeRender = obj => Object.keys(obj).concat(Object.values(obj));
      const result = nestedFuture
        ? createNestedFuture(transformed) /** [9,9] */
        : transformed;

      return <PropDrill prop={makeRender(result)} level={level} />;
    };

    await testSuspenseWithLoader(<App level={10} />, '<div>foobarbazzvaluea futona barcandya bazzeritaa 4</div>', async () =>{
      await waitForSuspense(100)
    });

    StubFutureObject = futureObject(fetchJson);

    await testSuspenseWithLoader(
      <App level={10} nestedFuture />,
      '<div>7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4</div>', async () => {
        await waitForSuspense(100)
        await waitForSuspense(100)

      }
    );

    StubFutureObject = futureObject(fetchJson);

    await testSuspenseWithLoader(<App level={200} />, `<div>foobarbazzvaluea futona barcandya bazzeritaa 4</div>`, async () =>{
      await waitForSuspense(100)

    });

    StubFutureObject = futureObject(fetchJson);

    await testSuspenseWithLoader(
      <App level={200} nestedFuture />,
      `<div>7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4</div>`, async () => {
        await waitForSuspense(100)
        await waitForSuspense(100)

      }
    );
  });
  test('should render intermediate transformations', async () => {
    const Nested = ({ level, nestedFuture, transformed }) => {
      const result = nestedFuture
        ? createNestedFuture(transformed) 
        : transformed;
      const makeRender = obj => Object.keys(obj).concat(Object.values(obj));
      return <PropDrill prop={makeRender(result)} level={level} />;
    };
    const App = ({ level, nestedFuture = false }) => {
      const transformed = StubFutureObject.fromEntries(
        StubFutureObject.entries(new StubFutureObject(4)) // [['foo', 'futon'], ['bar', 'barcandy'], ['baz', 'bazzerita'], ['value', '4']]
        .map(([key, val]) => [key, 'a ' + String(val)]) // [[ 'foo', 'a futon' ], [ 'bar', 'a barcandy' ], [ 'baz', 'a bazzerita' ], [ 'value', 'a 4' ]]
      ) // {foo: 'a futon', bar: 'a barcandy', baz: 'a bazzerita', value: 'a 4' }


      return (
        <DeepPassThrough level={level}>
          <Nested level={level} transformed={transformed} nestedFuture={nestedFuture} />
        </DeepPassThrough>
      );
    };

    await testSuspenseWithLoader(
      <App level={10} />,
      '<div><div><div><div><div><div><div><div><div><div><div>foobarbazzvaluea futona barcandya bazzeritaa 4</div></div></div></div></div></div></div></div></div></div></div>',
      async () => {
        await waitForSuspense(100)
      }
    );

    StubFutureObject = futureObject(fetchJson);

    await testSuspenseWithLoader(
      <App level={10} nestedFuture={true} />,
      '<div><div><div><div><div><div><div><div><div><div><div>7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4</div></div></div></div></div></div></div></div></div></div></div>',
      async () => {
        await waitForSuspense(100)
        await waitForSuspense(100)

      }
    );

    StubFutureObject = futureObject(fetchJson);

    await testSuspenseWithLoader(
      <App level={200} />,
      '<div>'.repeat(201) + 'foobarbazzvaluea futona barcandya bazzeritaa 4' + '</div>'.repeat(201),
      async () => {
        await waitForSuspense(100)

      }
    );

    StubFutureObject = futureObject(fetchJson);

    await testSuspenseWithLoader(
      <App level={200} nestedFuture={true} />,
      '<div>'.repeat(201) + '7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4' + '</div>'.repeat(201),
      async () => {
        await waitForSuspense(100)
        await waitForSuspense(100)

      }
    );
  });
});

describe('Instantiate outside render, deep render scenario', () => {
  test('should render ', async () => {
    const transformed = StubFutureObject.fromEntries(
      StubFutureObject.entries(new StubFutureObject(4)) // [['foo', 'futon'], ['bar', 'barcandy'], ['baz', 'bazzerita'], ['value', '4']]
      .map(([key, val]) => [key, 'a ' + String(val)]) // [[ 'foo', 'a futon' ], [ 'bar', 'a barcandy' ], [ 'baz', 'a bazzerita' ], [ 'value', 'a 4' ]]
    ) // {foo: 'a futon', bar: 'a barcandy', baz: 'a bazzerita', value: 'a 4' }


    const App = ({ nestedFuture = false }) => {
      const makeRender = obj => Object.keys(obj).concat(Object.values(obj));

      const result = nestedFuture ? createNestedFuture(transformed) : transformed;
      return <div>{makeRender(result)}</div>;
    };

    await testSuspenseWithLoader(<App />, `<div>foobarbazzvaluea futona barcandya bazzeritaa 4</div>`, async () => {
      await waitForSuspense(100)

    });

    StubFutureObject = futureObject(fetchJson);

    await testSuspenseWithLoader(<App nestedFuture />, `<div>7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4</div>`, async () => {
      await waitForSuspense(100)
      await waitForSuspense(100)

    });

  });

  test('should render deeply', async () => {
    const transformed = StubFutureObject.fromEntries(
      StubFutureObject.entries(new StubFutureObject(4)) // [['foo', 'futon'], ['bar', 'barcandy'], ['baz', 'bazzerita'], ['value', '4']]
      .map(([key, val]) => [key, 'a ' + String(val)]) // [[ 'foo', 'a futon' ], [ 'bar', 'a barcandy' ], [ 'baz', 'a bazzerita' ], [ 'value', 'a 4' ]]
    ) // {foo: 'a futon', bar: 'a barcandy', baz: 'a bazzerita', value: 'a 4' }

    const makeRender = obj => Object.keys(obj).concat(Object.values(obj));

    const App = ({ nestedFuture = false }) => {
      const result = nestedFuture ? createNestedFuture(transformed) : transformed;
      return (
        <div>
          <Deep numbers={makeRender(result)} />
        </div>
      );
    };

    await testSuspenseWithLoader(<App />, `<div><div>foobarbazzvaluea futona barcandya bazzeritaa 4</div></div>`, async () => {
      await waitForSuspense(100)
    });

    StubFutureObject = futureObject(fetchJson);

    await testSuspenseWithLoader(
      <App nestedFuture />,
      `<div><div>7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4</div></div>`,
      async () => {
        await waitForSuspense(100)
        await waitForSuspense(100)

      }
    );

  });

  test('should render very deeply', async () => {
    const getObject = () => StubFutureObject.fromEntries(
      StubFutureObject.entries(new StubFutureObject(4)) // [['foo', 'futon'], ['bar', 'barcandy'], ['baz', 'bazzerita'], ['value', '4']]
      .map(([key, val]) => [key, 'a ' + String(val)]) // [[ 'foo', 'a futon' ], [ 'bar', 'a barcandy' ], [ 'baz', 'a bazzerita' ], [ 'value', 'a 4' ]]
    ) // {foo: 'a futon', bar: 'a barcandy', baz: 'a bazzerita', value: 'a 4' }

    let transformed = getObject();

    const AppVeryDeep = ({ nestedFuture = false, level }) => {
      const result = nestedFuture ? createNestedFuture(transformed) : transformed;
      const makeRender = obj => Object.keys(obj).concat(Object.values(obj));
      return (
        <div>
          <DeepPassThrough level={level}>
            <Deep numbers={makeRender(result)} />
          </DeepPassThrough>
        </div>
      );
    };

    await testSuspenseWithLoader(
      <AppVeryDeep level={5} />,
      '<div>'.repeat(7) + `foobarbazzvaluea futona barcandya bazzeritaa 4` + '</div>'.repeat(7),
      async () => {
        await waitForSuspense(100)

      }
    );

    StubFutureObject = futureObject(fetchJson);
    transformed = getObject();

    await testSuspenseWithLoader(
      <AppVeryDeep level={5} nestedFuture />,
      `<div><div><div><div><div><div><div>7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4</div></div></div></div></div></div></div>`,
      async () => {
        await waitForSuspense(100)
        await waitForSuspense(100)

      }
    );

    StubFutureObject = futureObject(fetchJson);
    transformed = getObject();

    await testSuspenseWithLoader(
      <AppVeryDeep level={200} />,
      `<div>`.repeat(202) + 'foobarbazzvaluea futona barcandya bazzeritaa 4' + `</div>`.repeat(202),
      async () => {
        await waitForSuspense(100)

      }
    );

    StubFutureObject = futureObject(fetchJson);
    transformed = getObject();

    await testSuspenseWithLoader(
      <AppVeryDeep nestedFuture level={200} />,
      `<div>`.repeat(202) + '7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4' + `</div>`.repeat(202),
      async () => {
        await waitForSuspense(100)
        await waitForSuspense(100)
      }
    );

  });

  test('should render with prop drilling', async () => {
    const getObject = () =>StubFutureObject.fromEntries(
      StubFutureObject.entries(new StubFutureObject(4)) // [['foo', 'futon'], ['bar', 'barcandy'], ['baz', 'bazzerita'], ['value', '4']]
      .map(([key, val]) => [key, 'a ' + String(val)]) // [[ 'foo', 'a futon' ], [ 'bar', 'a barcandy' ], [ 'baz', 'a bazzerita' ], [ 'value', 'a 4' ]]
    ) // {foo: 'a futon', bar: 'a barcandy', baz: 'a bazzerita', value: 'a 4' }
    const makeRender = obj => Object.keys(obj).concat(Object.values(obj));

    let transformed = getObject();
    const App = ({ level, nestedFuture = false }) => {
      const result = nestedFuture ? createNestedFuture(transformed) : transformed;
      return <PropDrill prop={makeRender(result)} level={level} />;
    };

    await testSuspenseWithLoader(<App level={10} />, '<div>foobarbazzvaluea futona barcandya bazzeritaa 4</div>', async () => {
      await waitForSuspense(100)

    });

    StubFutureObject = futureObject(fetchJson);
    transformed = getObject();

    await testSuspenseWithLoader(
      <App level={10} nestedFuture />,
      '<div>7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4</div>',
      async () => {
        await waitForSuspense(100)
        await waitForSuspense(100)

      }
    );

    StubFutureObject = futureObject(fetchJson);
    transformed = getObject();

    await testSuspenseWithLoader(<App level={200} />, `<div>foobarbazzvaluea futona barcandya bazzeritaa 4</div>`, async () => {
      await waitForSuspense(100)

    });

    StubFutureObject = futureObject(fetchJson);
    transformed = getObject();
    await testSuspenseWithLoader(
      <App level={200} nestedFuture />,
      `<div>7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4</div>`, async () => {
        await waitForSuspense(100)
        await waitForSuspense(100)

      }
    );

  });

  test('should render intermediate transformations', async () => {
    const getObject = () => StubFutureObject.fromEntries(
      StubFutureObject.entries(new StubFutureObject(4)) // [['foo', 'futon'], ['bar', 'barcandy'], ['baz', 'bazzerita'], ['value', '4']]
      .map(([key, val]) => [key, 'a ' + String(val)]) // [[ 'foo', 'a futon' ], [ 'bar', 'a barcandy' ], [ 'baz', 'a bazzerita' ], [ 'value', 'a 4' ]]
    ) // {foo: 'a futon', bar: 'a barcandy', baz: 'a bazzerita', value: 'a 4' }


    let transformed = getObject();

    const Nested = ({ level, nestedFuture, transformed }) => {
      const result = nestedFuture ? createNestedFuture(transformed) : transformed;
      const makeRender = obj => Object.keys(obj).concat(Object.values(obj));

      return <PropDrill prop={makeRender(result)} level={level} />;
    };

    const App = ({ level, nestedFuture = false }) => {
      return (
        <DeepPassThrough level={level}>
          <Nested level={level} transformed={transformed} nestedFuture={nestedFuture} />
        </DeepPassThrough>
      );
    };

    await testSuspenseWithLoader(
      <App level={10} />,
      '<div><div><div><div><div><div><div><div><div><div><div>foobarbazzvaluea futona barcandya bazzeritaa 4</div></div></div></div></div></div></div></div></div></div></div>',
      async () => {
        await waitForSuspense(100);
      }
    );

    StubFutureObject = futureObject(fetchJson);
    transformed = getObject();

    await testSuspenseWithLoader(
      <App level={10} nestedFuture />,
      '<div><div><div><div><div><div><div><div><div><div><div>7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4</div></div></div></div></div></div></div></div></div></div></div>',
      async () => {
        await waitForSuspense(100)
        await waitForSuspense(100)

      }
    );

    StubFutureObject = futureObject(fetchJson);
    transformed = getObject();

    await testSuspenseWithLoader(
      <App level={200} />,
      '<div>'.repeat(201) + 'foobarbazzvaluea futona barcandya bazzeritaa 4' + '</div>'.repeat(201),
      async () => {
        await waitForSuspense(100)

      }
    );

    StubFutureObject = futureObject(fetchJson);
    transformed = getObject();

    await testSuspenseWithLoader(
      <App level={200} nestedFuture />,
      '<div>'.repeat(201) + '7futonbarcandybazzeritafoobarbazzvaluevaluefoobarbazzchura barcandya bazzeritaa 4' + '</div>'.repeat(201),
      async () => {
        await waitForSuspense(100)
        await waitForSuspense(100)

      }
    );

  });
});

const createNestedFuture = transformed => {
  let transformed2 = new StubFutureObject(7); 
  transformed2 = StubFutureObject.fromEntries( //
    StubFutureObject.entries(transformed2)// [['foo', 'futon'], ['bar', 'barcandy'], ['baz', 'bazzerita'], ['value', 7]]
      .map(([key, value]) => [value, key]) //[[ 'futon', 'foo' ], [ 'barcandy', 'bar' ], [ 'bazzerita', 'baz' ], [ 7, 'value' ]]
  );

  return StubFutureObject.assign(transformed2, transformed, { foo: 'chur'}) // {foo: 'chur', bar: 'a barcandy', baz: 'a bazzerita', value: 'a 4', '7': 'value', futon: 'foo', barcandy: 'bar', bazzerita: 'baz' }

};
