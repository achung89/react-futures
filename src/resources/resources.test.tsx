import { waitFor } from "@testing-library/dom";
import { Suspense, useLayoutEffect, useState } from "react";
import { act } from "react-dom/test-utils";
import { render } from "../test-utils/rtl-renderer";
import waitForSuspense from "../test-utils/waitForSuspense";
import { toPromise } from "../utils";
import { createObjectResource as createArrayResource, createObjectResource } from "./resources";

const expectedJson = (value) => ({
  foo: "futon",
  bar: "barcandy",
  bazz: "bazzerita",
  value,
});
const fetchJson = (val) =>
  new Promise((res, rej) => {
    setTimeout(() => {
      try {
        Scheduler.unstable_yieldValue("Promise Resolved");
        res(expectedJson(val));
      } catch (err) {
        rej(err);
      }
    }, 100);
  }).catch((err) => {
    throw err;
  });

const expectedArray = (value) => [1, 2, 3, value];
const fetchArray = (val) =>
  new Promise((res, rej) => {
    setTimeout(() => {
      try {
        Scheduler.unstable_yieldValue("Promise Resolved");
        res(expectedArray(val));
      } catch (err) {
        rej(err);
      }
    }, 100);
  }).catch((err) => {
    throw err;
  });

const LogSuspense = ({ action, children }) => {
  try {
    action();
    Scheduler.unstable_yieldValue("No Suspense");

    return children;
  } catch (promise) {
    if (typeof promise.then === "function") {
      Scheduler.unstable_yieldValue(`Suspend!`);
    }
    throw promise;
  }
};

let Scheduler;
let container;

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetModules();
  Scheduler = require("scheduler/unstable_mock");
  container = document.createElement("div");
  document.body.appendChild(container);
});
afterEach(async () => {
  document.body.removeChild(container);
  container = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
});

const renderWithAction = (action) => {
  let renderer;
  act(() => {
    renderer = render(
      <Suspense fallback={<div>Loading...</div>}>
        <LogSuspense action={action}>foo</LogSuspense>
      </Suspense>,
      container
    );
  });
  return renderer;
};

test("createResource().array().invoke() will create FutureArray and yield correct value", async () => {
  const getResource = createResource(fetchArray);
  let value;
  const resource = getResource.array().invoke("val");

  const { getByText } = renderWithAction(() => {
    value = JSON.parse(JSON.stringify(resource));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(expectedArray("val"));
});
test("createResource().object().invoke() will create FutureObject and yield correct value", async () => {
  const getResource = createResource(fetchJson);
  let value;
  const resource = getResource.object().invoke("val");

  const { getByText } = renderWithAction(() => {
    value = JSON.parse(JSON.stringify(resource));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(expectedJSON("val"));
});

test(`createResource does not allow .invoke without calling first '.array' or '.object'`, async () => {
  const asyncFn = () =>
    new Promise((res, rej) => {
      setTimeout(res, 100);
    });

  expect(() => createResource(asyncFn).invoke()).rejects.toEqual({
    name: "Invalid Operation",
    message: "call to invoke must be preceded by call to .array or .object",
  });
});
test(`createResource does not allow createResource().then().invoke()`, async () => {
  const asyncFn = () =>
    new Promise((res, rej) => {
      setTimeout(res, 100);
    });

  expect(() =>
    createResource(asyncFn)
      .then((val) => val)
      .invoke()
  ).rejects.toEqual({
    name: "Invalid Operation",
    message: "call to invoke must be preceded by call to .array or .object",
  });
});

test(`createResource does not allow createResource().array().then().invoke()`, async () => {
  const asyncFn = () =>
    new Promise((res, rej) => {
      setTimeout(res, 100);
    });

  expect(() =>
    createResource(asyncFn)
      .array()
      .then((val) => val)
      .invoke()
  ).rejects.toEqual({
    name: "Invalid Operation",
    message: "call to invoke must be preceded by call to .array or .object",
  });
});
test(`createResource does not allow createResource().object().then().invoke()`, async () => {
  const asyncFn = () =>
    new Promise((res, rej) => {
      setTimeout(res, 100);
    });

  expect(() =>
    createResource(asyncFn)
      .object()
      .then((val) => val)
      .invoke()
  ).rejects.toEqual({
    name: "Invalid Operation",
    message: "call to invoke must be preceded by call to .array or .object",
  });
});

test("createObjectResource can take a promise returning function or async function inside render and when invoked suspends", async () => {
  const getResource = createArrayResource(fetchJson);
  let value;

  const { getByText } = renderWithAction(() => {
    const resource = getResource("val");
    value = JSON.parse(JSON.stringify(resource));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);
  await waitForSuspense(100);
  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(expectedJson("val"));
});

test("createObjectResource can take a promise returning function or async function outside render and when invoked suspends", async () => {
  const getResource = createArrayResource(fetchJson);
  let value;
  const resource = getResource("val");

  const { getByText } = renderWithAction(() => {
    value = JSON.parse(JSON.stringify(resource));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(expectedJson("val"));
});

test("createArrayResource resource can take a promise returning function or async function inside render and when invoked suspends", async () => {
  const getResource = createArrayResource(fetchArray);
  let value;

  const { getByText } = renderWithAction(() => {
    const resource = getResource("val");
    value = JSON.parse(JSON.stringify(resource));
  });
  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(expectedArray("val"));
});
test("createArrayResource resource can take a promise returning function or async function outside render and when invoked suspends", async () => {
  const getResource = createArrayResource(fetchArray);
  const resource = getResource("val");

  let value;
  const { getByText } = renderWithAction(() => {
    value = JSON.parse(JSON.stringify(resource));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  // need to do it twice, one for the fetch and one for `.json()`
  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(expectedArray("val"));
});

test("createArrayResource can use .invoke in place of invocation inside render", async () => {
  const getResource = createArrayResource(fetchArray);

  let value;
  const { getByText } = renderWithAction(() => {
    const resource = getResource.invoke("val");
    value = JSON.parse(JSON.stringify(resource));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(expectedArray("val"));
});
test("createArrayResource can use .invoke in place of invocation outside render", async () => {
  const getResource = createArrayResource(fetchArray);

  let value;
  const resource = getResource.invoke("val");

  const { getByText } = renderWithAction(() => {
    value = JSON.parse(JSON.stringify(resource));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(expectedArray("val"));
});
test("createObjectResource can use .invoke in place of invocation inside render", async () => {
  const getResource = createArrayResource(fetchJson);

  let value;
  const { getByText } = renderWithAction(() => {
    const resource = getResource.invoke("val");

    value = JSON.parse(JSON.stringify(resource));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(expectedJson("val"));
});
test("createObjectResource can use .invoke in place of invocation outside render", async () => {
  const getResource = createArrayResource(fetchJson);

  let value;
  const resource = getResource.invoke("val");

  const { getByText } = renderWithAction(() => {
    value = JSON.parse(JSON.stringify(resource));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(expectedJson("val"));
});

test.todo(
  "createResource().finally() is called after promise is resolved inside render"
);
test.todo(
  "createResource().finally() is called after promise is resolved outside render"
);
test.todo(
  "createResource().finally() is called after promise.then is resolved inside render"
);
test.todo(
  "createResource().finally() is called after promise.then is resolved outside render"
);
test.todo("createResource().finally() can be forked outside render");
test.todo("createResource().finally() can be forked inside render");
test.todo("createResource().finally() can be forked outside and inside render");

test(
  "createResource().array().invoke() should yield future array value outside render",
  async () => {
    const getResource = createResource(fetchArray).array();

    let value;
    const resource = getResource.invoke("val");

    const { getByText } = renderWithAction(() => {
      value = JSON.parse(JSON.stringify(resource));
    });

    expect(Scheduler).toHaveYielded(["Suspend!"]);

    await waitForSuspense(100);

    expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
    await waitFor(() => getByText("foo"));

    expect(value).toStrictEqual(expectedArray("val"));
  }
);
test("createResource().array().invoke() should yield future array value outside render", async () => {
  const getResource = createResource(fetchArray);
  let value;
  const resource = getResource.array().invoke("val");

  const { getByText } = renderWithAction(() => {
    value = JSON.parse(JSON.stringify(resource));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(expectedArray("val"));
});

test("createResource().array().invoke().then() should yield future array value outside render", async () => {
  const getResource = createResource(fetchArray);

  const addValue = (arr) => [...arr, 5];
  let value;
  const resource = getResource.array().invoke("val").then(addValue);

  const { getByText } = renderWithAction(() => {
    value = JSON.parse(JSON.stringify(resource));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(addValue(expectedArray("val")));
});

test("createResource().object().invoke().then() should yield future object value outside render", async () => {
  const getResource = createResource(fetchArray);
  const addValue = (obj) => ({ ...obj, added: 5 });
  let value;
  const resource = getResource.object().invoke("val").then(addValue);

  const { getByText } = renderWithAction(() => {
    value = JSON.parse(JSON.stringify(resource));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(addValue(expectedJson("val")));
});

test(
  "createResource().array().invoke().then() should yield future array value inside render",
  async () => {
    const getResource = createResource(fetchArray);

    const addValue = (arr) => [...arr, 5];
    let value;

    const { getByText } = renderWithAction(() => {
      const resource = getResource.array().invoke("val").then(addValue);

      value = JSON.parse(JSON.stringify(resource));
    });

    expect(Scheduler).toHaveYielded(["Suspend!"]);

    await waitForSuspense(100);

    expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
    await waitFor(() => getByText("foo"));

    expect(value).toStrictEqual(addValue(expectedArray("val")));
  }
);

test(
  "createResource().object().invoke().then() should yield future object value inside render",
  async () => {
    const getResource = createResource(fetchJson);
    const addValue = (obj) => ({ ...obj, added: 5 });
    let value;

    const { getByText } = renderWithAction(() => {
      const resource = getResource.object().invoke("val").then(addValue);

      value = JSON.parse(JSON.stringify(resource));
    });

    expect(Scheduler).toHaveYielded(["Suspend!"]);

    await waitForSuspense(100);

    expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
    await waitFor(() => getByText("foo"));

    expect(value).toStrictEqual(addValue(expectedJson("val")));
  }
);

describe("createResource().then().array() should fork outside render", async () => {
  test.todo(".then() should fork");
  test.todo(".array() should fork");
  test.todo(".invoke() should fork");
});

describe("createResource().then().object() should fork outside render", async () => {
  test.todo(".then() should fork");
  test.todo(".object() should fork");
  test.todo(".invoke() should fork");
});

describe("createResource().then().array() should fork inside render", async () => {
  test.todo(".then() should fork");
  test.todo(".array() should fork");
  test.todo(".invoke() should fork");
});

describe("createResource().then().object() should fork inside render", async () => {
  test.todo(".then() should fork");
  test.todo(".object() should fork");
  test.todo(".invoke() should fork");
});

describe("createResource().then().array() should fork inside and outside render", async () => {
  test.todo(".then() should fork outside then inside");
  test.todo(".then() should fork inside then outside");
  test.todo(".array() should fork outside then inside");
  test.todo(".array() should fork  inside then outside");
  test.todo(".invoke() should fork inside and outside");
  test.todo(".invoke() should fork outside and inside");
});

describe("createResource().then().object() should fork inside and outside render", async () => {
  test.todo(".then() should fork inside and outside render");
  test.todo(".then() should fork  outside and inside render");
  test.todo(".object() should fork outside and inside");
  test.todo(".object() should fork inside and outside");
  test.todo(".invoke() should fork inside and outside render");
  test.todo(".invoke() should fork outside and inside render");
});
describe("Error handler", () => {
  test("createResource().then() can take an onerror function outside render", async () => {
    const throwError = () => {
      throw new Error("Error thrown in .then");
    };
    const addValue = (obj) => ({ ...obj, added: 5 });

    let errorCaught = false;
    let errorCaughtInCatch = false;
    const getResource = createResource(fetchJson);

    let value;
    const resource = getResource.object();

    const resource2 = resource
      .invoke("val")
      .then(throwError, () => {
        errorCaught = true;
      })
      .catch(() => {
        errorCaughtInCatch = true;
      })
      .then(addValue);
    const { getByText } = renderWithAction(() => {
      value = JSON.parse(JSON.stringify(resource2));
    });

    expect(Scheduler).toHaveYielded(["Suspend!"]);

    await waitForSuspense(100);

    expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
    await waitFor(() => getByText("foo"));

    expect(errorCaught).toEqual(true);
    expect(errorCaughtInCatch).toEqual(false);
  });

  test("createResource().then() can take an onerror function inside render", async () => {
    const throwError = () => {
      throw new Error("Error thrown in .then");
    };
    const addValue = (obj) => ({ ...obj, added: 5 });
    let value;
    let errorCaught = false;
    let errorCaughtInCatch = false;
    const getResource = createResource(fetchJson);
    const { getByText } = renderWithAction(() => {
      const resource = getResource.object();

      const resource2 = resource
        .invoke("val")
        .then(throwError, () => {
          errorCaught = true;
        })
        .catch(() => {
          errorCaughtInCatch = true;
        })
        .then(addValue);
      value = JSON.parse(JSON.stringify(resource2));
    });

    expect(Scheduler).toHaveYielded(["Suspend!"]);

    await waitForSuspense(100);

    expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
    await waitFor(() => getByText("foo"));

    expect(errorCaught).toEqual(true);
    expect(errorCaughtInCatch).toEqual(false);
  });

  test.todo(
    "createResource().then() can take an onerror function that forks outside render"
  );
  test.todo(
    "createResource().then() can take an onerror function that forks inside render"
  );
  test.todo(
    "createResource().then() can take an onerror function that forks inside and outside render"
  );
});

test.todo("createResource can suspend in promise callback outside render");
test.todo("createResource can suspend in sync before promise outside render");
test.todo("createResource can suspend in promise.then callback outside render");
test.todo("createResource can suspend in promise callback inside render");
test.todo("createResource can suspend in sync before promise inside render");
test.todo("createResource can suspend in promise.then callback inside render");
test.todo("createArrayResource can suspend in promise callback outside render");
test.todo(
  "createArrayResource can suspend in sync before promise outside render"
);
test.todo(
  "createArrayResource can suspend in promise.then callback outside render"
);
test.todo("createArrayResource can suspend in promise callback inside render");
test.todo(
  "createArrayResource can suspend in sync before promise inside render"
);
test.todo(
  "createArrayResource can suspend in promise.then callback inside render"
);
test.todo(
  "createObjectResource can suspend in promise callback outside render"
);
test.todo(
  "createObjectResource can suspend in sync before promise outside render"
);
test.todo(
  "createObjectResource can suspend in promise.then callback outside render"
);
test.todo("createObjectResource can suspend in promise callback inside render");
test.todo(
  "createObjectResource can suspend in sync before promise inside render"
);
test.todo(
  "createObjectResource can suspend in promise.then callback inside render"
);

test.todo("createResource can throw error in promise inside render");
test.todo("createResource can throw error in promise outside render");
test.todo("createResource can throw error in sync callback inside render");
test.todo("createResource can throw error in sync callback outside render");
test.todo("createResource can throw error in .then callback inside render");
test.todo("createResource can throw error in .then callback outside render");
test.todo("createArrayResource can throw error in promise inside render");
test.todo("createArrayResource can throw error in promise outside render");
test.todo("createArrayResource can throw error in sync callback inside render");
test.todo(
  "createArrayResource can throw error in sync callback outside render"
);
test.todo(
  "createArrayResource can throw error in .then callback inside render"
);
test.todo(
  "createArrayResource can throw error in .then callback outside render"
);
test.todo("createObjectResource can throw error in promise inside render");
test.todo("createObjectResource can throw error in promise outside render");
test.todo(
  "createObjectResource can throw error in sync callback inside render"
);
test.todo(
  "createObjectResource can throw error in sync callback outside render"
);
test.todo(
  "createObjectResource can throw error in .then callback inside render"
);
test.todo(
  "createObjectResource can throw error in .then callback outside render"
);

test("createResource can .catch in promise inside render", async () => {
  const throwError = () => {
    throw new Error("Error thrown in .then");
  };
  const addValue = (obj) => ({ ...obj, added: 5 });
  let value;
  let didPropogate = false;
  let errorCaughtInCatch = false;
  const getResource = createResource(fetchJson);
  const { getByText } = renderWithAction(() => {
    const resource = getResource
      .then(throwError)
      .then(() => {
        didPropogate = true;
      })
      .catch(() => {
        errorCaughtInCatch = true;
      })
      .then(addValue)
      .object();
    
    const resource2 = resource.invoke("val");
    value = JSON.parse(JSON.stringify(resource2));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(didPropogate).toEqual(false);
  expect(errorCaughtInCatch).toEqual(true);
});
test("createResource can .catch in promise outside render", async () => {
  const throwError = () => {
    throw new Error("Error thrown in .then");
  };
  const addValue = (obj) => ({ ...obj, added: 5 });
  let value;
  let didPropogate = false;
  let errorCaughtInCatch = false;
  const getResource = createResource(fetchJson);

  const resource = getResource
    .then(throwError)
    .then(() => {
      didPropogate = true;
    })
    .catch(() => {
      errorCaughtInCatch = true;
    })
    .then(addValue)
    .object();

  const resource2 = resource.invoke("val");

  const { getByText } = renderWithAction(() => {
    value = JSON.parse(JSON.stringify(resource2));
  });

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(didPropogate).toEqual(false);
  expect(errorCaughtInCatch).toEqual(true);
});
test.todo("createResource can .catch in sync callback inside render");
test.todo("createResource can .catch in sync callback outside render");
test.todo("createResource can .catch in .then callback inside render");
test.todo("createResource can .catch in .then callback outside render");
test.todo("createArrayResource can .catch in promise inside render");
test.todo("createArrayResource can .catch in promise outside render");
test.todo("createArrayResource can .catch in sync callback inside render");
test.todo("createArrayResource can .catch in sync callback outside render");
test.todo("createArrayResource can .catch in .then callback inside render");
test.todo("createArrayResource can .catch in .then callback outside render");
test.todo("createObjectResource can .catch in promise inside render");
test.todo("createObjectResource can .catch in promise outside render");
test.todo("createObjectResource can .catch in sync callback inside render");
test.todo("createObjectResource can .catch in sync callback outside render");
test.todo("createObjectResource can .catch in .then callback inside render");
test.todo("createObjectResource can .catch in .then callback outside render");

test("createResource invocations are cached inside render", async () => {
  const addValue = (obj) => ({ ...obj, added: 5 });
  let value;
  const getResource = createResource(fetchJson);

  const resource = getResource.then(addValue).object();

  const action = () => {
    const resource2 = resource.invoke("val");
    value = JSON.parse(JSON.stringify(resource2));
  };

  let setState;
  const App = () => {
    const [state, localSetState] = useState();
    setState = localSetState;
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LogSuspense action={action}>foo</LogSuspense>
      </Suspense>
    );
  };

  const { getByText } = render(<App />);

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(addValue(expectedJson("val")));
  value = undefined;

  act(() => {
    setState();
  });

  expect(Scheduler).toHaveYielded(["No Suspend"]);

  expect(value).toStrictEqual(addValue(expectedJson("val")));
});
test("createArrayResource invocations are cached inside render", async () => {
  const addValue = (arr) => [...arr, 5];
  let value;
  const getResource = createArrayResource(fetchArray);

  const resource = getResource.then(addValue);

  const action = () => {
    const resource2 = resource.invoke("val");
    value = JSON.parse(JSON.stringify(resource2));
  };

  let setState;
  const App = () => {
    const [state, localSetState] = useState();
    setState = localSetState;
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LogSuspense action={action}>foo</LogSuspense>
      </Suspense>
    );
  };

  const { getByText } = render(<App />);

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(addValue(expectedArray("val")));
  value = undefined;

  act(() => {
    setState();
  });

  expect(Scheduler).toHaveYielded(["No Suspend"]);

  expect(value).toStrictEqual(addValue(expectedArray("val")));
});
test("createObjectResource invocations are cached inside render", async () => {
  const addValue = (obj) => ({ ...obj, added: 5 });
  let value;
  const getResource = createArrayResource(fetchJson);

  const resource = getResource.then(addValue);

  const action = () => {
    const resource2 = resource.invoke("val");
    value = JSON.parse(JSON.stringify(resource2));
  };

  let setState;
  const App = () => {
    const [state, localSetState] = useState();
    setState = localSetState;
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LogSuspense action={action}>foo</LogSuspense>
      </Suspense>
    );
  };

  const { getByText } = render(<App />);

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(addValue(expectedJson("val")));
  value = undefined;

  act(() => {
    setState();
  });

  expect(Scheduler).toHaveYielded(["No Suspend"]);

  expect(value).toStrictEqual(addValue(expectedJson("val")));
});

test("createResource invocations outside render are not cached", async () => {
  const addValue = (arr) => [...arr, 5];
  let value;
  const getResource = createResource(fetchArray);

  const resource = getResource.then(addValue).array();

  const action = () => {};

  let setState;
  let state;
  const App = () => {
    [state, setState] = useState();
    useLayoutEffect(() => {
      toPromise(resource.invoke("val")).then((res) => {
        value = JSON.parse(JSON.stringify(res));
      });
    }, [state]);

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LogSuspense action={action}>foo</LogSuspense>
      </Suspense>
    );
  };

  const { getByText } = render(<App />);

  await waitForSuspense(100);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(addValue(expectedArray("val")));
  value = undefined;

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);

  act(() => {
    setState();
  });
  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);

  expect(value).toStrictEqual(addValue(expectedArray("val")));
});

test("createArrayResource invocations outside render are not cached", async () => {
  const addValue = (arr) => [...arr, 5];
  let value;
  const getResource = createArrayResource(fetchArray);

  const resource = getResource.then(addValue);
  let setState;
  let state;
  const App = () => {
    [state, setState] = useState();
    useLayoutEffect(() => {
      toPromise(resource.invoke("val")).then((res) => {
        value = JSON.parse(JSON.stringify(res));
      });
    }, [state]);

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LogSuspense action={action}>foo</LogSuspense>
      </Suspense>
    );
  };

  const { getByText } = render(<App />);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(addValue(expectedArray("val")));
  value = undefined;

  act(() => {
    setState();
  });
  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);

  expect(value).toStrictEqual(addValue(expectedArray("val")));
});
test("createObjectResource invocations outside render are not cached", async () => {
  const addValue = (obj) => ({ ...obj, added: 5 });
  let value;
  const getResource = createObjectResource(fetchJson);

  const resource = getResource.then(addValue);
  let setState;
  let state;
  const App = () => {
    [state, setState] = useState();
    useLayoutEffect(() => {
      toPromise(resource.invoke("val")).then((res) => {
        value = JSON.parse(JSON.stringify(res));
      });
    }, [state]);

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LogSuspense action={() => {}}>foo</LogSuspense>
      </Suspense>
    );
  };

  const { getByText } = render(<App />);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(addValue(expectedJSON("val")));
  value = undefined;

  act(() => {
    setState();
  });
  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);

  expect(value).toStrictEqual(addValue(expectedJSON("val")));
});

test.todo(
  "createResource cache keys by default should cache objects and arrays by reference"
);
test.todo(
  "createArrayResource cache keys by default should cache objects and arrays by reference"
);
test.todo(
  "createObjectResource cache keys by default should cache objects and arrays by reference"
);

test("customReactCacheKey for createResource should allow customizing cache keys", async () => {
  const addValue = (obj) => ({ ...obj, added: 5 });
  let value;
  let argsLength;
  const getResource = createResource(fetchArray, {
    customReactCacheKey: (...args) => {
      argsLength = args.length;
      return args[0].a + args[0].b;
    },
  });

  const resource = getResource.then(addValue).array();

  const action = () => {
    const resource2 = resource.invoke({ a: "val1", b: "val2" });
    value = JSON.parse(JSON.stringify(resource2));
  };

  let setState;
  const App = () => {
    const [state, localSetState] = useState();
    setState = localSetState;
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LogSuspense action={action}>foo</LogSuspense>
      </Suspense>
    );
  };

  const { getByText } = render(<App />);

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(addValue(expectedArray("val")));
  expect(argsLength).toEqual(1);
  argsLength = undefined;
  value = undefined;

  act(() => {
    setState();
  });

  expect(Scheduler).toHaveYielded(["No Suspend"]);

  expect(value).toStrictEqual(addValue(expectedArray("val")));
  expect(argsLength).toEqual(1);
});
test("customReactCacheKey for createArrayResource should allow customizing cache keys", async () => {
  const addValue = (obj) => ({ ...obj, added: 5 });
  let value;
  let argsLength;
  const getResource = createArrayResource(fetchJson, {
    customReactCacheKey: (...args) => {
      argsLength = args.length;
      return args[0].a + args[0].b;
    },
  });

  const resource = getResource.then(addValue);

  const action = () => {
    const resource2 = resource.invoke({ a: "val1", b: "val2" });
    value = JSON.parse(JSON.stringify(resource2));
  };

  let setState;
  const App = () => {
    const [state, localSetState] = useState();
    setState = localSetState;
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LogSuspense action={action}>foo</LogSuspense>
      </Suspense>
    );
  };

  const { getByText } = render(<App />);

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(addValue(expectedJson("val")));
  expect(argsLength).toEqual(1);
  argsLength = undefined;
  value = undefined;

  act(() => {
    setState();
  });

  expect(Scheduler).toHaveYielded(["No Suspend"]);

  expect(value).toStrictEqual(addValue(expectedJson("val")));
  expect(argsLength).toEqual(1);
});
test("customReactCacheKey for createObjectResource should allow customizing cache keys", async () => {
  const addValue = (obj) => ({ ...obj, added: 5 });
  let value;
  let argsLength;
  const getResource = createObjectResource(fetchJson, {
    customReactCacheKey: (...args) => {
      argsLength = args.length;
      return args[0].a + args[0].b;
    },
  });

  const resource = getResource.then(addValue);

  const action = () => {
    const resource2 = resource.invoke({ a: "val1", b: "val2" });
    value = JSON.parse(JSON.stringify(resource2));
  };

  let setState;
  const App = () => {
    const [state, localSetState] = useState();
    setState = localSetState;
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LogSuspense action={action}>foo</LogSuspense>
      </Suspense>
    );
  };

  const { getByText } = render(<App />);

  expect(Scheduler).toHaveYielded(["Suspend!"]);

  await waitForSuspense(100);

  expect(Scheduler).toHaveYielded(["Promise Resolved", "No Suspend"]);
  await waitFor(() => getByText("foo"));

  expect(value).toStrictEqual(addValue(expectedJson("val")));
  expect(argsLength).toEqual(1);
  argsLength = undefined;
  value = undefined;

  act(() => {
    setState();
  });

  expect(Scheduler).toHaveYielded(["No Suspend"]);

  expect(value).toStrictEqual(addValue(expectedJson("val")));
  expect(argsLength).toEqual(1);
});

test.todo(
  "createResource should allow a throw or returning a rejected promise in finally will reject the new promise (but not original promise) with the rejection reason specified when calling throw in render"
);
test.todo(
  "createResource should allow a throw or returning a rejected promise in finally will reject the new promise (but not original promise) with the rejection reason specified when calling throw outside render"
);

test.todo("createResource should not cache resources created outside render");
test.todo(
  "createArrayResource should not cache resources created outside render"
);
test.todo(
  "createObjectResource should not cache resources created outside render"
);
test.todo("createResource should not cache resources created click handler");
test.todo(
  "createArrayResource should not cache resources created click handler"
);
test.todo(
  "createObjectResource should not cache resources created click handler"
);

test.todo(
  "createResource should throw error if resource is created inside render"
);
test.todo(
  "createArrayResource should throw error if resource is created inside render"
);
test.todo(
  "createObjectResource should throw error if resource is created inside render"
);
