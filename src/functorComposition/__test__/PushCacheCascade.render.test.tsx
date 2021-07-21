jest.mock("scheduler", () =>  require("scheduler/unstable_mock"));
import { waitFor } from "@testing-library/dom";
import { Suspense } from "react";
import { act } from "react-dom/test-utils";
import { PushCacheCascade } from "../../internal";
import {
  upperCase,
  spaceOut,
  throwOnce,
} from "../../PushCascade/suspenseFuncs";
import { render } from "../../test-utils/rtl-renderer";
import waitForSuspense from "../../test-utils/waitForSuspense";
import { unstable_useCacheRefresh as useCacheRefresh } from "react";

describe("PushCacheCascade", () => {
  it("shouldnt throw suspense if promise is already resolved", async () => {
    const fn = jest.fn();

    let suspender = PushCacheCascade.of(throwOnce(() => "johnny bravo"));

    try {
      suspender.get();
    } catch (prom) {
      fn();
      expect(prom).toBeInstanceOf(Promise);
      await prom;
    }
    expect(fn).toHaveBeenCalled();
    expect(() => suspender.get()).not.toThrow();
  });
  it("should return value if no promises throw", () => {
    const suspense = PushCacheCascade.of(() => "johnny bravo");
    expect(suspense.get()).toEqual("johnny bravo");
  });
  it("should map callbacks", () => {
    {
      const suspense = PushCacheCascade.of(() => "johnny bravo").map(upperCase);
      expect(suspense.get()).toEqual("JOHNNY BRAVO");
    }
    {
      const suspense = PushCacheCascade.of(() => "johnny bravo")
        .map(upperCase)
        .map(spaceOut);

      expect(suspense.get()).toEqual("J O H N N Y   B R A V O");
    }
  });
  it("should throw suspense", async () => {
    const fn = jest.fn();

    let suspender = PushCacheCascade.of(() => "johnny bravo").map(
      throwOnce(upperCase)
    );
    try {
      suspender.get();
    } catch (prom) {
      fn();
      expect(prom).toBeInstanceOf(Promise);
      await prom;
    }
    expect(fn).toHaveBeenCalled();
    expect(suspender.get()).toEqual("JOHNNY BRAVO");
  });

  it("should throw suspense if first callback throws", async () => {
    const fn = jest.fn();

    let suspender = PushCacheCascade.of(throwOnce(() => "johnny bravo")).map(
      upperCase
    );
    try {
      suspender.get();
    } catch (prom) {
      fn();
      expect(prom).toBeInstanceOf(Promise);
      await prom;
    }
    expect(fn).toHaveBeenCalled();

    expect(suspender.get()).toEqual("JOHNNY BRAVO");
  });
  it("should throw suspense if first and second callback throws", async () => {
    const fn = jest.fn();

    let suspender = PushCacheCascade.of(throwOnce(() => "johnny bravo")).map(
      throwOnce(upperCase)
    );

    try {
      suspender.get();
    } catch (prom) {
      fn();
      expect(prom).toBeInstanceOf(Promise);
      await prom;
    }
    expect(fn).toHaveBeenCalledTimes(1);

    expect(suspender.get()).toEqual("JOHNNY BRAVO");
  });
  describe("cache", () => {
    it("should store cache in dynamic scope", () => {
      const getCache = () => new Map();
      const cache = getCache();
      let dynamicScope;
      PushCacheCascade.of(() => undefined, { cache, getCache }).map(() => {
        dynamicScope = PushCacheCascade.getCurrentScope();
      });
      expect(cache).toBe(dynamicScope.cache);
      expect(getCache).toBe(dynamicScope.getCache);
    });
  });
  describe("in render", () => {
    let Scheduler;
    let container;
    beforeEach(() => {
      jest.useFakeTimers();

      Scheduler = require("scheduler/unstable_mock");
      container = document.createElement("div");
      document.body.appendChild(container);
    });
    afterEach(() => {
      jest.useRealTimers();

      document.body.removeChild(container);
      container = null;
      Scheduler.unstable_clearYields();
      Scheduler = null;
    });

    it("should be able to get in render", () => {
      let renderer;
      const getCache = () => new Map();
      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });
      let a;
      const App = () => {
        a = suspense.get();
        return <div>1</div>;
      };
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      expect(a).toEqual("johnny bravo");
    });

    it("should be able get after suspend in render", async () => {
      let renderer;
      const getCache = () => new Map();

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        { cache: getCache(), cacheCb: getCache }
      );
      let a;
      const App = () => {
        a = suspense.get();
        return <div>1</div>;
      };
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      expect(a).toEqual(undefined);

      await waitForSuspense(0);

      expect(a).toEqual("johnny bravo");
    });

    it("should be able get after map and suspend in render", async () => {
      let renderer;
      const getCache = () => new Map();

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        { cache: getCache(), cacheCb: getCache }
      );
      let a;
      const App = () => {
        a = suspense.map(upperCase).get();
        return <div>1</div>;
      };
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      expect(a).toEqual(undefined);

      await waitForSuspense(0);

      expect(a).toEqual("JOHNNY BRAVO");
    });

    it("should be able get after map outside render and suspend in render", async () => {
      let renderer;
      const getCache = () => new Map();

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        { cache: getCache(), cacheCb: getCache }
      ).map(upperCase);

      let a;
      const App = () => {
        a = suspense.get();
        return <div>1</div>;
      };
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      expect(a).toEqual(undefined);

      await waitForSuspense(0);

      expect(a).toEqual("JOHNNY BRAVO");
    });
    it("should have same cache in different chains inside render with same callback after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      const suspense2 = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      let val;
      let refresh;

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        refresh = useCacheRefresh();

        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get();
        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheInsideRender1).toBeTruthy();
      expect(cacheInsideRender2).toBeTruthy();

      expect(cacheInsideRender2.cache).toBe(cacheInsideRender1.cache);

      let tempCacheInsideRender = cacheInsideRender1;
      let tempCacheInsideRender2 = cacheInsideRender2;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(tempCacheInsideRender.cache).not.toBe(cacheInsideRender1.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender2.cache);

      expect(cacheInsideRender1.cache).toBe(cacheInsideRender1.cache);
    });
  });
});

describe("in DOM render", () => {
  let Scheduler;
  let container;
  beforeEach(() => {
    jest.useFakeTimers();

    Scheduler = require("scheduler/unstable_mock");
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  afterEach(() => {
    jest.useRealTimers();

    document.body.removeChild(container);
    container = null;
    Scheduler.unstable_clearYields();
    Scheduler = null;
  });

  it("should be able to get in DOM render", async () => {
    let renderer;
    const getCache = () => new Map();
    const suspense = PushCacheCascade.of(() => "johnny bravo", {
      cache: getCache(),
      cacheCb: getCache,
    });
    let domSuspendArr = new Proxy([1, 2], {
      get(target, p) {
        if (p === "length") {
          return 2;
        }
        return suspense.get();
      },
    });
    const App = () => {
      return <div>{domSuspendArr}</div>;
    };
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>,
        container
      );
    });
    const { getByText } = renderer;
    await waitFor(() => {
      expect(getByText("johnny bravojohnny bravo")).toBeTruthy();
    });
  });

  it("should be able get after suspend in render", async () => {
    let renderer;
    const getCache = () => new Map();

    const suspense = PushCacheCascade.of(
      throwOnce(() => "johnny bravo"),
      { cache: getCache(), cacheCb: getCache }
    );

    let domSuspendArr = new Proxy([1, 2], {
      get(target, p) {
        if (p === "length") {
          return 2;
        }
        return suspense.get();
      },
    });
    const App = () => {
      return <div>{domSuspendArr}</div>;
    };

    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>,
        container
      );
    });
    const { getByText } = renderer;

    await waitForSuspense(0);

    await waitFor(() => {
      expect(getByText("johnny bravojohnny bravo")).toBeTruthy();
    });
  });

  it("should be able get after map and suspend in render", async () => {
    let renderer;
    const getCache = () => new Map();

    let suspense = PushCacheCascade.of(
      throwOnce(() => "johnny bravo"),
      { cache: getCache(), cacheCb: getCache }
    );

    let domSuspendArr = new Proxy([1, 2], {
      get(target, p) {
        if (p === "length") {
          return 2;
        }
        return suspense.get();
      },
    });
    const App = () => {
      suspense = suspense.map(upperCase);
      return <div>{domSuspendArr}</div>;
    };
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>,
        container
      );
    });

    const { getByText } = renderer;

    await waitForSuspense(0);

    await waitFor(() => {
      expect(getByText("JOHNNY BRAVOJOHNNY BRAVO")).toBeTruthy();
    });
  });

  it("should be able get after map outside render and suspend in render", async () => {
    let renderer;
    const getCache = () => new Map();

    const suspense = PushCacheCascade.of(
      throwOnce(() => "johnny bravo"),
      { cache: getCache(), cacheCb: getCache }
    ).map(upperCase);

    let domSuspendArr = new Proxy([1, 2], {
      get(target, p) {
        if (p === "length") {
          return 2;
        }
        return suspense.get();
      },
    });
    const App = () => {
      return <div>{domSuspendArr}</div>;
    };
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>,
        container
      );
    });

    const { getByText } = renderer;

    await waitForSuspense(0);

    await waitFor(() => {
      expect(getByText("JOHNNY BRAVOJOHNNY BRAVO")).toBeTruthy();
    });
  });
});

describe("in render with cache", () => {
  let Scheduler;
  let container;
  beforeEach(() => {
    jest.useFakeTimers();

    Scheduler = require("scheduler/unstable_mock");
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  afterEach(() => {
    jest.useRealTimers();

    document.body.removeChild(container);
    container = null;
    Scheduler.unstable_clearYields();
    Scheduler = null;
  });

  describe("before refresh", () => {
    it("should have same cache in a chain outside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;
      const cache = getCache();
      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache,
        cacheCb: getCache,
      })
        .map((val) => {
          cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        })
        .map((val) => {
          cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });
      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).toBe(cacheOutsideRender2.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);
      let a;
      const App = () => {
        a = suspense.get();
        return <div>1</div>;
      };
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      await waitForSuspense(0);
      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      expect(a).toEqual("johnny bravo");
      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).toBe(cacheOutsideRender2.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);
    });

    it("should have different cache in the same chain outside and inside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender;
      let cacheInsideRender;
      const cache = getCache();
      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache,
        cacheCb: getCache,
      }).map((val) => {
        cacheOutsideRender = PushCacheCascade.getCurrentScope();
        return val;
      });

      expect(cacheOutsideRender.cache).toBeTruthy();

      let a;
      const App = () => {
        a = suspense
          .map((val) => {
            cacheInsideRender = PushCacheCascade.getCurrentScope();
            return val;
          })
          .get();

        return <div>1</div>;
      };
      expect(cacheOutsideRender.cache).toBeTruthy();
      expect(cacheInsideRender).not.toBeTruthy();

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      expect(cacheInsideRender.cache).toBeTruthy();

      await waitForSuspense(0);
      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      expect(a).toEqual("johnny bravo");
      expect(cacheOutsideRender.cache).toBeTruthy();
      expect(cacheInsideRender.cache).toBeTruthy();

      expect(cacheOutsideRender.cache).not.toBe(cacheInsideRender.cache);
      expect(cacheOutsideRender.cache).toBe(cache);
    });

    it("should have different cache in different chains outside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;

      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      }).map((val) => {
        cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
        return val;
      });

      PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      }).map((val) => {
        cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
        return val;
      });
      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).not.toBe(cacheOutsideRender2.cache);
      let val;
      const App = () => {
        val = suspense.get();
        return <div>1</div>;
      };
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      expect(val).toEqual("johnny bravo");
      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).not.toBe(cacheOutsideRender2.cache);
    });

    it("should have same cache in different chains if using the same cache callback inside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });

      const suspense2 = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let val;
      const App = () => {
        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      expect(val).toEqual("johnny bravo");
      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(cacheInsideRender1.cache).toBe(cacheInsideRender2.cache);
    });

    it("should have different cache in different chains if using the different cache callback inside render", async () => {
      let renderer;
      const getCache = () => new Map();
      const getCache2 = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });

      const suspense2 = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache2(),
        cacheCb: getCache2,
      });

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let val;
      const App = () => {
        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      expect(val).toEqual("johnny bravo");
      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);
    });
  });

  describe("after refresh", () => {
    it("should have same cache in a chain outside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;
      const cache = getCache();
      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache,
        cacheCb: getCache,
      })
        .map((val) => {
          cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        })
        .map((val) => {
          cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });
      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).toBe(cacheOutsideRender1.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);
      let a;
      let refresh;

      const App = () => {
        a = suspense.get();
        refresh = useCacheRefresh();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);
      const { getByText } = renderer;
      await waitFor(() => getByText("1"));
      let tempCacheOutsideRender1 = cacheOutsideRender1;
      let tempCacheOutsideRender2 = cacheOutsideRender2;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("1"));

      expect(a).toEqual("johnny bravo");
      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(tempCacheOutsideRender1.cache).toBe(cacheOutsideRender1.cache);
      expect(tempCacheOutsideRender2.cache).toBe(cacheOutsideRender2.cache);

      expect(cacheOutsideRender1.cache).toBe(cacheOutsideRender2.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);
    });

    it("should have different cache in a the same chain outside and inside render after cache resets", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender;
      let cacheInsideRender;
      const cache = getCache();
      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache,
        cacheCb: getCache,
      }).map((val) => {
        cacheOutsideRender = PushCacheCascade.getCurrentScope();
        return val;
      });

      expect(cacheOutsideRender.cache).toBeTruthy();

      let a;
      let refresh;
      const App = () => {
        a = suspense
          .map((val) => {
            cacheInsideRender = PushCacheCascade.getCurrentScope();
            return val;
          })
          .get();

        refresh = useCacheRefresh();

        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      expect(cacheInsideRender.cache).toBeTruthy();

      await waitForSuspense(0);
      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      let tempCacheOutsideRender = cacheOutsideRender;
      let tempCacheInsideRender2 = cacheInsideRender;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("1"));

      expect(a).toEqual("johnny bravo");
      expect(cacheOutsideRender.cache).toBeTruthy();
      expect(cacheInsideRender.cache).toBeTruthy();

      expect(tempCacheOutsideRender.cache).toBe(cacheOutsideRender.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender.cache);

      expect(cacheOutsideRender.cache).not.toBe(cacheInsideRender.cache);
      expect(cacheOutsideRender.cache).toBe(cache);
    });

    it("should have different cache in different chains outside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      const getCache2 = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;

      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      }).map((val) => {
        cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
        return val;
      });

      PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      }).map((val) => {
        cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
        return val;
      });
      expect(cacheOutsideRender1).toBeTruthy();
      expect(cacheOutsideRender2).toBeTruthy();

      expect(cacheOutsideRender1.cache).not.toBe(cacheOutsideRender2.cache);

      let refresh;
      let val;
      const App = () => {
        val = suspense.get();
        refresh = useCacheRefresh();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      let tempCacheOutsideRender = cacheOutsideRender1;
      let tempCacheOutsideRender2 = cacheOutsideRender2;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("1"));

      expect(val).toEqual("johnny bravo");
      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(tempCacheOutsideRender.cache).toBe(cacheOutsideRender1.cache);
      expect(tempCacheOutsideRender2.cache).toBe(cacheOutsideRender2.cache);

      expect(cacheOutsideRender1.cache).not.toBe(cacheOutsideRender2.cache);
    });

    it("should have same cache in different chains if using the same cache callback inside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });

      const suspense2 = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let val;
      let refresh;
      const App = () => {
        refresh = useCacheRefresh();
        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));
      let tempCacheInsideRender = cacheInsideRender1;
      let tempCacheInsideRender2 = cacheInsideRender2;

      act(() => {
        refresh();
      });
      await waitFor(() => getByText("1"));

      expect(val).toEqual("johnny bravo");

      expect(tempCacheInsideRender.cache).not.toBe(cacheInsideRender1.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender2.cache);
      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(cacheInsideRender1.cache).toBe(cacheInsideRender2.cache);
    });

    it("should have different cache in different chains if using different cache callback inside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      const getCache2 = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });

      const suspense2 = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache2(),
        cacheCb: getCache2,
      });

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let val;
      let refresh;
      const App = () => {
        refresh = useCacheRefresh();
        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));
      let tempCacheInsideRender = cacheInsideRender1;
      let tempCacheInsideRender2 = cacheInsideRender2;

      act(() => {
        refresh();
      });
      await waitFor(() => getByText("1"));

      expect(val).toEqual("johnny bravo");

      expect(tempCacheInsideRender.cache).not.toBe(cacheInsideRender1.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender2.cache);
      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);
    });

    it("should have different cache in different chains with different callbacks inside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      const getCache2 = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });

      const suspense2 = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache2(),
        cacheCb: getCache2,
      });

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let val;
      let refresh;
      const App = () => {
        refresh = useCacheRefresh();

        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      expect(cacheInsideRender1).toBeTruthy();
      expect(cacheInsideRender2).toBeTruthy();

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);

      let tempCacheInsideRender = cacheInsideRender1;
      let tempCacheInsideRender2 = cacheInsideRender2;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("1"));
      expect(val).toEqual("johnny bravo");
      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(tempCacheInsideRender.cache).not.toBe(cacheInsideRender1.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender2.cache);

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);
    });
  });
});

describe("in DOM render with cache", () => {
  let Scheduler;
  let container;
  beforeEach(() => {
    jest.useFakeTimers();

    Scheduler = require("scheduler/unstable_mock");
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  afterEach(() => {
    jest.useRealTimers();

    document.body.removeChild(container);
    container = null;
    Scheduler.unstable_clearYields();
    Scheduler = null;
  });
  describe("before refresh", () => {
    it("should have same cache in a chain outside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;
      const cache = getCache();
      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache,
        cacheCb: getCache,
      })
        .map((val) => {
          cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        })
        .map((val) => {
          cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });
      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).toBe(cacheOutsideRender2.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });
      let refresh;
      const App = () => {
        refresh = useCacheRefresh();
        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      await waitForSuspense(0);
      const { getByText } = renderer;

      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).toBe(cacheOutsideRender2.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);
    });

    it("should have different cache in the same chain outside and inside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheInsideRender;
      const cache = getCache();
      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache,
        cacheCb: getCache,
      }).map((val) => {
        cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
        return val;
      });

      expect(cacheOutsideRender1.cache).toBeTruthy();

      let a;
      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return a.get();
        },
      });

      const App = () => {
        a = suspense.map((val) => {
          cacheInsideRender = PushCacheCascade.getCurrentScope();
          return val;
        });

        return <div>{domSuspendArr}</div>;
      };
      expect(cacheInsideRender).not.toBeTruthy();

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);
      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).not.toBe(cacheInsideRender.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);
    });

    it("should have different cache in different chains outside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;

      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      }).map((val) => {
        cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
        return val;
      });

      PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      }).map((val) => {
        cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
        return val;
      });
      expect(cacheOutsideRender1).toBeTruthy();
      expect(cacheOutsideRender2).toBeTruthy();

      expect(cacheOutsideRender1.cache).not.toBe(cacheOutsideRender2.cache);
      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        return <div>{domSuspendArr}</div>;
      };
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).not.toBe(cacheOutsideRender2.cache);
    });

    it("should have different cache in different chains inside render with different cache callback", async () => {
      let renderer;
      const getCache = () => new Map();
      const getCache2 = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });

      const suspense2 = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache2(),
        cacheCb: getCache2,
      });

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);
    });

    it("should have same cache in different chains inside render for same cache callback", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });

      const suspense2 = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let val;
      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(cacheInsideRender1.cache).toBe(cacheInsideRender2.cache);
    });
  });

  describe("after refresh", () => {
    it("should have same cache in a chain outside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;
      const cache = getCache();
      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache,
        cacheCb: getCache,
      })
        .map((val) => {
          cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        })
        .map((val) => {
          cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });
      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).toBe(cacheOutsideRender1.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);
      let a;
      let refresh;
      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        refresh = useCacheRefresh();
        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);
      const { getByText } = renderer;

      let tempCacheOutsideRender1 = cacheOutsideRender1;
      let tempCacheOutsideRender2 = cacheOutsideRender2;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(tempCacheOutsideRender1.cache).toBe(cacheOutsideRender1.cache);
      expect(tempCacheOutsideRender2.cache).toBe(cacheOutsideRender2.cache);

      expect(cacheOutsideRender1.cache).toBe(cacheOutsideRender2.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);
    });

    it("should have different cache in a the same chain outside and inside render after cache resets", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender;
      let cacheInsideRender;
      const cache = getCache();
      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache,
        cacheCb: getCache,
      }).map((val) => {
        cacheOutsideRender = PushCacheCascade.getCurrentScope();
        return val;
      });

      expect(cacheOutsideRender.cache).toBeTruthy();

      let a;
      let refresh;

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        a = suspense
          .map((val) => {
            cacheInsideRender = PushCacheCascade.getCurrentScope();
            return val;
          })
          .get();

        refresh = useCacheRefresh();

        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);
      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));
      expect(cacheInsideRender.cache).toBeTruthy();

      let tempCacheOutsideRender = cacheOutsideRender;
      let tempCacheInsideRender2 = cacheInsideRender;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheOutsideRender.cache).toBeTruthy();
      expect(cacheInsideRender.cache).toBeTruthy();

      expect(tempCacheOutsideRender.cache).toBe(cacheOutsideRender.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender.cache);

      expect(cacheOutsideRender.cache).not.toBe(cacheInsideRender.cache);
      expect(cacheOutsideRender.cache).toBe(cache);
    });

    it("should have different cache in different chains outside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;

      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      }).map((val) => {
        cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
        return val;
      });

      PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      }).map((val) => {
        cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
        return val;
      });
      expect(cacheOutsideRender1).toBeTruthy();
      expect(cacheOutsideRender2).toBeTruthy();

      expect(cacheOutsideRender1.cache).not.toBe(cacheOutsideRender2.cache);

      let refresh;
      let val;

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        val = suspense.get();
        refresh = useCacheRefresh();
        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      let tempCacheOutsideRender = cacheOutsideRender1;
      let tempCacheOutsideRender2 = cacheOutsideRender2;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(tempCacheOutsideRender.cache).toBe(cacheOutsideRender1.cache);
      expect(tempCacheOutsideRender2.cache).toBe(cacheOutsideRender2.cache);

      expect(cacheOutsideRender1.cache).not.toBe(cacheOutsideRender2.cache);
    });

    it("should have different cache in different chains inside render with different callbacks after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      const getCache2 = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });

      const suspense2 = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache2(),
        cacheCb: getCache2,
      });

      let refresh;

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        refresh = useCacheRefresh();

        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheInsideRender1).toBeTruthy();
      expect(cacheInsideRender2).toBeTruthy();

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);
      let tempCacheInsideRender = cacheInsideRender1;
      let tempCacheInsideRender2 = cacheInsideRender2;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("johnny bravojohnny bravo"));
      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(tempCacheInsideRender.cache).not.toBe(cacheInsideRender1.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender2.cache);

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);
    });

    it("should have same cache in different chains inside render with same callback after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });

      const suspense2 = PushCacheCascade.of(() => "johnny bravo", {
        cache: getCache(),
        cacheCb: getCache,
      });

      let val;
      let refresh;

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        refresh = useCacheRefresh();

        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get();
        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheInsideRender1).toBeTruthy();
      expect(cacheInsideRender2).toBeTruthy();

      expect(cacheInsideRender2.cache).toBe(cacheInsideRender1.cache);

      let tempCacheInsideRender = cacheInsideRender1;
      let tempCacheInsideRender2 = cacheInsideRender2;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(tempCacheInsideRender.cache).not.toBe(cacheInsideRender1.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender2.cache);

      expect(cacheInsideRender1.cache).toBe(cacheInsideRender1.cache);
    });
    
  });
});

describe("suspense in render with cache", () => {
  let Scheduler;
  let container;
  beforeEach(() => {
    jest.useFakeTimers();

    Scheduler = require("scheduler/unstable_mock");
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  afterEach(() => {
    jest.useRealTimers();

    document.body.removeChild(container);
    container = null;
    Scheduler.unstable_clearYields();
    Scheduler = null;
  });

  describe("before refresh", () => {
    it("should have same cache in a chain outside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;
      const cache = getCache();
      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache,
          cacheCb: getCache,
        }
      )
        .map((val) => {
          cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        })
        .map((val) => {
          cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });
      expect(cacheOutsideRender1).not.toBeTruthy();
      expect(cacheOutsideRender2).not.toBeTruthy();

      let a;
      const App = () => {
        a = suspense.get();
        return <div>1</div>;
      };
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      await waitForSuspense(0);
      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      expect(a).toEqual("johnny bravo");
      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).toBe(cacheOutsideRender2.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);
    });

    it("should have different cache in the same chain outside and inside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender;
      let cacheInsideRender;
      const cache = getCache();
      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache,
          cacheCb: getCache,
        }
      ).map((val) => {
        cacheOutsideRender = PushCacheCascade.getCurrentScope();
        return val;
      });

      expect(cacheOutsideRender).not.toBeTruthy();

      let a;
      const App = () => {
        a = suspense
          .map((val) => {
            cacheInsideRender = PushCacheCascade.getCurrentScope();
            return val;
          })
          .get();

        return <div>1</div>;
      };
      expect(cacheOutsideRender).not.toBeTruthy();
      expect(cacheInsideRender).not.toBeTruthy();

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      expect(cacheInsideRender).not.toBeTruthy();

      await waitForSuspense(0);
      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      expect(a).toEqual("johnny bravo");
      expect(cacheOutsideRender.cache).toBeTruthy();
      expect(cacheInsideRender.cache).toBeTruthy();

      expect(cacheOutsideRender.cache).not.toBe(cacheInsideRender.cache);
      expect(cacheOutsideRender.cache).toBe(cache);
    });

    it("should have different cache in different chains outside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      ).map((val) => {
        cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
        return val;
      });

      PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      ).map((val) => {
        cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
        return val;
      });
      expect(cacheOutsideRender1).not.toBeTruthy();
      expect(cacheOutsideRender2).not.toBeTruthy();

      let val;
      const App = () => {
        val = suspense.get();
        return <div>1</div>;
      };
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      expect(val).toEqual("johnny bravo");
      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).not.toBe(cacheOutsideRender2.cache);
    });

    it("should have same cache in different chains if using the same cache callback inside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      const suspense2 = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let val;
      const App = () => {
        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      expect(val).toEqual("johnny bravo");
      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(cacheInsideRender1.cache).toBe(cacheInsideRender2.cache);
    });

    it("should have different cache in different chains if using the different cache callback inside render", async () => {
      let renderer;
      const getCache = () => new Map();
      const getCache2 = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      const suspense2 = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache2(),
          cacheCb: getCache2,
        }
      );

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let val;
      const App = () => {
        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      expect(val).toEqual("johnny bravo");
      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);
    });
  });

  describe("after refresh", () => {
    it("should have same cache in a chain outside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;
      const cache = getCache();
      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache,
          cacheCb: getCache,
        }
      )
        .map((val) => {
          cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        })
        .map((val) => {
          cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });
      expect(cacheOutsideRender1).not.toBeTruthy();
      expect(cacheOutsideRender2).not.toBeTruthy();

      let a;
      let refresh;

      const App = () => {
        a = suspense.get();
        refresh = useCacheRefresh();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);
      const { getByText } = renderer;
      await waitFor(() => getByText("1"));
      let tempCacheOutsideRender1 = cacheOutsideRender1;
      let tempCacheOutsideRender2 = cacheOutsideRender2;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("1"));

      expect(a).toEqual("johnny bravo");
      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(tempCacheOutsideRender1.cache).toBe(cacheOutsideRender1.cache);
      expect(tempCacheOutsideRender2.cache).toBe(cacheOutsideRender2.cache);

      expect(cacheOutsideRender1.cache).toBe(cacheOutsideRender2.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);
    });

    it("should have different cache in a the same chain outside and inside render after cache resets", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender;
      let cacheInsideRender;
      const cache = getCache();
      const suspense = PushCacheCascade.of(() => "johnny bravo", {
        cache,
        cacheCb: getCache,
      }).map((val) => {
        cacheOutsideRender = PushCacheCascade.getCurrentScope();
        return val;
      });

      expect(cacheOutsideRender.cache).toBeTruthy();

      let a;
      let refresh;
      const App = () => {
        a = suspense
          .map((val) => {
            cacheInsideRender = PushCacheCascade.getCurrentScope();
            return val;
          })
          .get();

        refresh = useCacheRefresh();

        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      expect(cacheInsideRender.cache).toBeTruthy();

      await waitForSuspense(0);
      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      let tempCacheOutsideRender = cacheOutsideRender;
      let tempCacheInsideRender2 = cacheInsideRender;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("1"));

      expect(a).toEqual("johnny bravo");
      expect(cacheOutsideRender.cache).toBeTruthy();
      expect(cacheInsideRender.cache).toBeTruthy();

      expect(tempCacheOutsideRender.cache).toBe(cacheOutsideRender.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender.cache);

      expect(cacheOutsideRender.cache).not.toBe(cacheInsideRender.cache);
      expect(cacheOutsideRender.cache).toBe(cache);
    });

    it("should have different cache in different chains outside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      const getCache2 = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      ).map((val) => {
        cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
        return val;
      });

      PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      ).map((val) => {
        cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
        return val;
      });
      expect(cacheOutsideRender1).not.toBeTruthy();
      expect(cacheOutsideRender2).not.toBeTruthy();

      let refresh;
      let val;
      const App = () => {
        val = suspense.get();
        refresh = useCacheRefresh();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      let tempCacheOutsideRender = cacheOutsideRender1;
      let tempCacheOutsideRender2 = cacheOutsideRender2;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("1"));

      expect(val).toEqual("johnny bravo");
      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(tempCacheOutsideRender.cache).toBe(cacheOutsideRender1.cache);
      expect(tempCacheOutsideRender2.cache).toBe(cacheOutsideRender2.cache);

      expect(cacheOutsideRender1.cache).not.toBe(cacheOutsideRender2.cache);
    });

    it("should have same cache in different chains if using the same cache callback inside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      const suspense2 = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let val;
      let refresh;
      const App = () => {
        refresh = useCacheRefresh();
        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));
      let tempCacheInsideRender = cacheInsideRender1;
      let tempCacheInsideRender2 = cacheInsideRender2;

      act(() => {
        refresh();
      });
      await waitFor(() => getByText("1"));

      expect(val).toEqual("johnny bravo");

      expect(tempCacheInsideRender.cache).not.toBe(cacheInsideRender1.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender2.cache);
      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(cacheInsideRender1.cache).toBe(cacheInsideRender2.cache);
    });

    it("should have different cache in different chains if using different cache callback inside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      const getCache2 = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      const suspense2 = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache2(),
          cacheCb: getCache2,
        }
      );

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let val;
      let refresh;
      const App = () => {
        refresh = useCacheRefresh();
        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));
      let tempCacheInsideRender = cacheInsideRender1;
      let tempCacheInsideRender2 = cacheInsideRender2;

      act(() => {
        refresh();
      });
      await waitFor(() => getByText("1"));

      expect(val).toEqual("johnny bravo");

      expect(tempCacheInsideRender.cache).not.toBe(cacheInsideRender1.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender2.cache);
      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);
    });

    it("should have different cache in different chains with different callbacks inside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      const getCache2 = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      const suspense2 = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache2(),
          cacheCb: getCache2,
        }
      );

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let val;
      let refresh;
      const App = () => {
        refresh = useCacheRefresh();

        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get();
        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);

      let tempCacheInsideRender = cacheInsideRender1;
      let tempCacheInsideRender2 = cacheInsideRender2;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("1"));
      expect(val).toEqual("johnny bravo");
      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(tempCacheInsideRender.cache).not.toBe(cacheInsideRender1.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender2.cache);

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);
    });
    
    it("should have same cache for futures instantiated in render before and after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheInsideRender1;

      let refresh;
      let suspense
      let val;
      const App = () => {
        suspense = PushCacheCascade.of(
          throwOnce(() => "johnny bravo"),
          {
            cache: getCache(),
            cacheCb: getCache,
          }
        ).map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get()
        refresh = useCacheRefresh();



        return <div>1</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("1"));

      expect(cacheInsideRender1).toBeTruthy();
      
      let tempCacheInsideRender = cacheInsideRender1;
      expect(val).toEqual('johnny bravo')
      act(() => {
        refresh();
      });

      await waitFor(() => getByText("1"));
      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(val).toEqual('johnny bravo')

      expect(tempCacheInsideRender.cache).toBe(cacheInsideRender1.cache);
    });
  });
});

describe("suspense in DOM render with cache", () => {
  let Scheduler;
  let container;
  beforeEach(() => {
    jest.useFakeTimers();

    Scheduler = require("scheduler/unstable_mock");
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  afterEach(() => {
    jest.useRealTimers();

    document.body.removeChild(container);
    container = null;
    Scheduler.unstable_clearYields();
    Scheduler = null;
  });
  describe("before refresh", () => {
    it("should have same cache in a chain outside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;
      const cache = getCache();
      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache,
          cacheCb: getCache,
        }
      )
        .map((val) => {
          cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        })
        .map((val) => {
          cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });
      expect(cacheOutsideRender1).not.toBeTruthy();
      expect(cacheOutsideRender2).not.toBeTruthy();

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });
      let refresh;
      const App = () => {
        refresh = useCacheRefresh();
        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      await waitForSuspense(0);
      const { getByText } = renderer;

      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).toBe(cacheOutsideRender2.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);
    });

    it("should have different cache in the same chain outside and inside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheInsideRender;
      const cache = getCache();
      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache,
          cacheCb: getCache,
        }
      ).map((val) => {
        cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
        return val;
      });

      expect(cacheOutsideRender1).not.toBeTruthy();

      let a;
      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return a.get();
        },
      });

      const App = () => {
        a = suspense.map((val) => {
          cacheInsideRender = PushCacheCascade.getCurrentScope();
          return val;
        });

        return <div>{domSuspendArr}</div>;
      };
      expect(cacheInsideRender).not.toBeTruthy();

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);
      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).not.toBe(cacheInsideRender.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);
    });

    it("should have different cache in different chains outside render", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      ).map((val) => {
        cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
        return val;
      });

      PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      ).map((val) => {
        cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
        return val;
      });
      expect(cacheOutsideRender1).not.toBeTruthy();
      expect(cacheOutsideRender2).not.toBeTruthy();

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        return <div>{domSuspendArr}</div>;
      };
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(cacheOutsideRender1.cache).not.toBe(cacheOutsideRender2.cache);
    });

    it("should have different cache in different chains inside render with different cache callback", async () => {
      let renderer;
      const getCache = () => new Map();
      const getCache2 = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      const suspense2 = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache2(),
          cacheCb: getCache2,
        }
      );

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);
    });

    it("should have same cache in different chains inside render for same cache callback", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      const suspense2 = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      expect(cacheInsideRender1).not.toBeTruthy();
      expect(cacheInsideRender2).not.toBeTruthy();

      let val;
      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(cacheInsideRender1.cache).toBe(cacheInsideRender2.cache);
    });
  });

  describe("after refresh", () => {
    it("should have same cache in a chain outside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;
      const cache = getCache();
      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache,
          cacheCb: getCache,
        }
      )
        .map((val) => {
          cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        })
        .map((val) => {
          cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });
      expect(cacheOutsideRender1).not.toBeTruthy();
      expect(cacheOutsideRender2).not.toBeTruthy();

      let a;
      let refresh;
      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        refresh = useCacheRefresh();
        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);
      const { getByText } = renderer;

      let tempCacheOutsideRender1 = cacheOutsideRender1;
      let tempCacheOutsideRender2 = cacheOutsideRender2;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(tempCacheOutsideRender1.cache).toBe(cacheOutsideRender1.cache);
      expect(tempCacheOutsideRender2.cache).toBe(cacheOutsideRender2.cache);

      expect(cacheOutsideRender1.cache).toBe(cacheOutsideRender2.cache);
      expect(cacheOutsideRender1.cache).toBe(cache);
    });

    it("should have different cache in a the same chain outside and inside render after cache resets", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender;
      let cacheInsideRender;
      const cache = getCache();
      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache,
          cacheCb: getCache,
        }
      ).map((val) => {
        cacheOutsideRender = PushCacheCascade.getCurrentScope();
        return val;
      });

      expect(cacheOutsideRender).not.toBeTruthy();

      let a;
      let refresh;

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        a = suspense
          .map((val) => {
            cacheInsideRender = PushCacheCascade.getCurrentScope();
            return val;
          })
          .get();

        refresh = useCacheRefresh();

        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);
      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));
      expect(cacheInsideRender.cache).toBeTruthy();

      let tempCacheOutsideRender = cacheOutsideRender;
      let tempCacheInsideRender2 = cacheInsideRender;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheOutsideRender.cache).toBeTruthy();
      expect(cacheInsideRender.cache).toBeTruthy();

      expect(tempCacheOutsideRender.cache).toBe(cacheOutsideRender.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender.cache);

      expect(cacheOutsideRender.cache).not.toBe(cacheInsideRender.cache);
      expect(cacheOutsideRender.cache).toBe(cache);
    });

    it("should have different cache in different chains outside render after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheOutsideRender1;
      let cacheOutsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      ).map((val) => {
        cacheOutsideRender1 = PushCacheCascade.getCurrentScope();
        return val;
      });

      PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      ).map((val) => {
        cacheOutsideRender2 = PushCacheCascade.getCurrentScope();
        return val;
      });
      expect(cacheOutsideRender1).not.toBeTruthy();
      expect(cacheOutsideRender2).not.toBeTruthy();

      let refresh;
      let val;

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        val = suspense.get();
        refresh = useCacheRefresh();
        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });
      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      let tempCacheOutsideRender = cacheOutsideRender1;
      let tempCacheOutsideRender2 = cacheOutsideRender2;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheOutsideRender1.cache).toBeTruthy();
      expect(cacheOutsideRender2.cache).toBeTruthy();

      expect(tempCacheOutsideRender.cache).toBe(cacheOutsideRender1.cache);
      expect(tempCacheOutsideRender2.cache).toBe(cacheOutsideRender2.cache);

      expect(cacheOutsideRender1.cache).not.toBe(cacheOutsideRender2.cache);
    });

    it("should have different cache in different chains inside render with different callbacks after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      const getCache2 = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      const suspense2 = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache2(),
          cacheCb: getCache2,
        }
      );

      let refresh;

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        refresh = useCacheRefresh();

        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheInsideRender1).toBeTruthy();
      expect(cacheInsideRender2).toBeTruthy();

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);
      let tempCacheInsideRender = cacheInsideRender1;
      let tempCacheInsideRender2 = cacheInsideRender2;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("johnny bravojohnny bravo"));
      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(tempCacheInsideRender.cache).not.toBe(cacheInsideRender1.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender2.cache);

      expect(cacheInsideRender1.cache).not.toBe(cacheInsideRender2.cache);
    });

    it("should have same cache in different chains inside render with same callback after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheInsideRender1;
      let cacheInsideRender2;

      const suspense = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      const suspense2 = PushCacheCascade.of(
        throwOnce(() => "johnny bravo"),
        {
          cache: getCache(),
          cacheCb: getCache,
        }
      );

      let val;
      let refresh;

      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        refresh = useCacheRefresh();

        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        suspense2.map((val) => {
          cacheInsideRender2 = PushCacheCascade.getCurrentScope();
          return val;
        });

        val = suspense.get();
        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheInsideRender1).toBeTruthy();
      expect(cacheInsideRender2).toBeTruthy();

      expect(cacheInsideRender2.cache).toBe(cacheInsideRender1.cache);

      let tempCacheInsideRender = cacheInsideRender1;
      let tempCacheInsideRender2 = cacheInsideRender2;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheInsideRender1.cache).toBeTruthy();
      expect(cacheInsideRender2.cache).toBeTruthy();

      expect(tempCacheInsideRender.cache).not.toBe(cacheInsideRender1.cache);
      expect(tempCacheInsideRender2.cache).not.toBe(cacheInsideRender2.cache);

      expect(cacheInsideRender1.cache).toBe(cacheInsideRender1.cache);
    });

    it("should have same cache for futures instantiated in render before and after refresh", async () => {
      let renderer;
      const getCache = () => new Map();
      let cacheInsideRender1;

      let refresh;
      let suspense;
      let domSuspendArr = new Proxy([1, 2], {
        get(target, p) {
          if (p === "length") {
            return 2;
          }
          return suspense.get();
        },
      });

      const App = () => {
        suspense = PushCacheCascade.of(
          throwOnce(() => "johnny bravo"),
          {
            cache: getCache(),
            cacheCb: getCache,
          }
        );
        refresh = useCacheRefresh();

        suspense.map((val) => {
          cacheInsideRender1 = PushCacheCascade.getCurrentScope();
          return val;
        });

        return <div>{domSuspendArr}</div>;
      };

      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>,
          container
        );
      });

      await waitForSuspense(0);

      const { getByText } = renderer;
      await waitFor(() => getByText("johnny bravojohnny bravo"));

      expect(cacheInsideRender1).toBeTruthy();

      let tempCacheInsideRender = cacheInsideRender1;

      act(() => {
        refresh();
      });

      await waitFor(() => getByText("johnny bravojohnny bravo"));
      expect(cacheInsideRender1.cache).toBeTruthy();

      expect(tempCacheInsideRender.cache).toBe(cacheInsideRender1.cache);
    });
  });
});
