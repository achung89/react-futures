const { wait } = require("./suspenseFuncs");
// TODO: Error

describe("SuspenseJob Queue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  })

  afterEach(() => {
    jest.useRealTimers();
  })
  describe("synchronously", () => {
    it("should accept a callback in the constructor evaluate synchronously", async () => {
      const jobQueue = new SuspenseJobQueue(() => 1);

      expect(jobQueue.getJob()).toStrictEqual({
        value: 1,
        status: "done",
      });
    });
    it("should immutably pipe values into callback passed into .append", () => {
      const jobQueue = new SuspenseJobQueue(() => 1);
      const jobQueue2 = jobQueue.append((val) => val + 3);

      expect(jobQueue2.getJob()).toStrictEqual({
        value: 4,
        status: "done",
      });
      expect(jobQueue.getJob()).toStrictEqual({
        value: 1,
        status: "done",
      });
    });
    it(".append should return a SuspenseJobQUeue", () => {
      const jobQueue = new SuspenseJobQueue(() => 1);
      const jobQueue2 = jobQueue.append((val) => val + 3);
      expect(jobQueue2).toBeInstanceOf(SuspenseJobQueue);

      // test that jobQueue2 has same methods as jobQueue
      const jobQueue3 = jobQueue2.append((val) => val + 4);

      expect(jobQueue3.getJob()).toStrictEqual({
        value: 7,
        status: "done",
      });

      expect(jobQueue2.getJob()).toStrictEqual({
        value: 4,
        status: "done",
      });

      expect(jobQueue.getJob()).toStrictEqual({
        value: 1,
        status: "done",
      });
    });

    it("should be able handle multiple append calls", () => {
      const jobQueue = new SuspenseJobQueue(() => 1);
      const jobQueue2 = jobQueue.append((val) => val + 3);

      const jobQueue3 = jobQueue.append((val) => val + 4);

      expect(jobQueue3.getJob()).toStrictEqual({
        value: 5,
        status: "done",
      });

      expect(jobQueue2.getJob()).toStrictEqual({
        value: 4,
        status: "done",
      });

      expect(jobQueue.getJob()).toStrictEqual({
        value: 1,
        status: "done",
      });
    });
  });

  describe('asynchronously', () => {
    it("should throw awaiting promise and resolve value once job finishes", async () => {
      const cb = wait(() => 1, 100)
      const jobQueue = new SuspenseJobQueue(cb);

      expect(jobQueue.getJob().status).toEqual('blocked');
      expect(jobQueue.getJob().blocker).toBeInstanceOf(Promise);

      jest.runTimersToTime(100);
      await jobQueue.getJob().blocker;

      expect(jobQueue.getJob()).toStrictEqual({
        status: 'done',
        value: 1
      })
    });
    it("should immutably pipe values into callback passed into .append", async () => {
        const cb = wait(() => 1, 100)

        const jobQueue = new SuspenseJobQueue(cb)
        const jobQueue2 = jobQueue.append((val) => val + 3);

        expect(jobQueue2.getJob().status).toEqual('blocked');
        expect(jobQueue2.getJob().blocker).toBeInstanceOf(Promise);
  
        jest.runTimersToTime(100);
        await jobQueue2.getJob().blocker;
  
        expect(jobQueue2.getJob()).toStrictEqual({
          value: 4,
          status: "done",
        });
      
    });
    it('.append should not change previous job', async () => {
      
        const cb = wait(() => 1, 100)

        const jobQueue = new SuspenseJobQueue(cb)
        const jobQueue2 = jobQueue.append((val) => val + 3);

        expect(jobQueue.getJob().status).toEqual('blocked');
        expect(jobQueue.getJob().blocker).toBeInstanceOf(Promise);
  
        jest.runTimersToTime(100);
        await jobQueue.getJob().blocker;
  

        expect(jobQueue.getJob()).toStrictEqual({
          value: 1,
          status: "done",
        });
        expect(jobQueue.getJob()).toStrictEqual({
          value: 4,
          status: 'done'
        })
    });
    it("thrown cb should be resolved down the chain", async () => {
      const cb = wait(() => 1, 100)

      const jobQueue = new SuspenseJobQueue(cb);
      const jobQueue2 = jobQueue.append((val) => val + 3);

      const jobQueue3 = jobQueue2.append((val) => val + 4);

      expect(jobQueue2.getJob().status).toEqual('blocked');
      expect(jobQueue2.getJob().blocker).toBeInstanceOf(Promise);
      expect(jobQueue3.getJob().status).toEqual('blocked');
      expect(jobQueue3.getJob().blocker).toBeInstanceOf(Promise);

      jest.advanceTimersByTime(100)
      await jobQueue3.getJob().blocker;

      expect(jobQueue3.getJob()).toStrictEqual({
        value: 8,
        status: "done",
      });
      expect(jobQueue2.getJob()).toStrictEqual({
        value: 4,
        status: 'done'
      })
    });
  
    it(".append should throw twice if 2 callbacks throw", async () => {
      const cb = wait(() => 1, 100)
      const cb2 = wait((val) => val + 3, 200)
      const jobQueue = new SuspenseJobQueue(cb);
      const jobQueue2 = jobQueue.append(cb2);

      const jobQueue3 = jobQueue2.append((val) => val + 4);

      expect(jobQueue.getJob().status).toEqual('blocked');
      expect(jobQueue.getJob().blocker).toBeInstanceOf(Promise);
      
      expect(jobQueue2.getJob().status).toEqual('blocked');
      expect(jobQueue2.getJob().blocker).toBeInstanceOf(Promise);
      
      expect(jobQueue3.getJob().status).toEqual('blocked');
      expect(jobQueue3.getJob().blocker).toBeInstanceOf(Promise);
      
      jest.advanceTimersByTime(100)
      await jobQueue3.getJob().blocker

      expect(jobQueue.getJob().status).toEqual('success');
      expect(jobQueue.getJob().value).toEqual(1);
      
      expect(jobQueue2.getJob().status).toEqual('blocked');
      expect(jobQueue2.getJob().blocker).toBeInstanceOf(Promise);
      
      expect(jobQueue3.getJob().status).toEqual('blocked');
      expect(jobQueue3.getJob().blocker).toBeInstanceOf(Promise);

      jest.advanceTimersByTime(100)
      await jobQueue3.getJob().blocker

      expect(jobQueue2.getJob()).toStrictEqual({
        value: 4,
        status: "done"
      })
      expect(jobQueue3.getJob()).toStrictEqual({
        value: 8,
        status: "done",
      });
    });

    it("one blocked job shouldn't resolve another", async () => {
      const cb = wait(() => 1, 100)
      const cb2 = wait((val) => val + 3, 200)
      const jobQueue = new SuspenseJobQueue(cb);
      const jobQueue2 = jobQueue.append(cb2);
      const jobQueue3 = jobQueue2.append((val) => val + 4);


      expect(jobQueue.getJob().status).toEqual('blocked');
      expect(jobQueue.getJob().blocker).toBeInstanceOf(Promise);
      
      jest.advanceTimersByTime(100)
      await jobQueue.getJob().blocker

      expect(jobQueue.getJob()).toStrictEqual({
        value: 1,
        status: 'done'
      })

      expect(jobQueue2.getJob().status).toEqual('blocked');
      expect(jobQueue2.getJob().blocker).toBeInstanceOf(Promise);

      jest.advanceTimersByTime(100)
      await jobQueue2.getJob().blocker

      expect(jobQueue.getJob()).toStrictEqual({
        value: 1,
        status: 'done'
      })

      expect(jobQueue2.getJob()).toStrictEqual({
        value: 4,
        status: 'done'
      })

      expect(jobQueue3.getJob()).toStrictEqual({
        value: 8,
        status: "done",
      });
    });


    it("should be able handle multiple append calls", async () => {
      const cb = wait(() => 1, 100)

      const jobQueue = new SuspenseJobQueue(cb);
      const jobQueue2 = jobQueue.append((val) => val + 3);

      const jobQueue3 = jobQueue.append((val) => val + 4);


      expect(jobQueue2.getJob().status).toEqual('blocked');
      expect(jobQueue2.getJob().blocker).toBeInstanceOf(Promise);
      expect(jobQueue3.getJob().status).toEqual('blocked');
      expect(jobQueue3.getJob().blocker).toBeInstanceOf(Promise);

      await jobQueue.getJob().blocker
      
      expect(jobQueue2.getJob()).toStrictEqual({
        value: 4,
        status: "done",
      });

      expect(jobQueue3.getJob()).toStrictEqual({
        value: 5,
        status: "done",
      });

      expect(jobQueue.getJob()).toStrictEqual({
        value: 1,
        status: "done",
      });
    });
    // this is so that the completion of a job upstream does not 
    // depend on the completion of a job down stream
    test('blocked job should resolve synchronous jobs, but not asynchronous', () => {
      const cb = wait(() => 1, 100)
      const cb2 = wait((val) => val + 4, )
      const jobQueue = new SuspenseJobQueue(cb);
      const jobQueue2 = jobQueue.append((val) => val + 3, 200);
      const jobQueue3 = jobQueue2.append(cb2);


      expect(jobQueue.getJob().status).toEqual('blocked');
      expect(jobQueue.getJob().blocker).toBeInstanceOf(Promise);
      
      jest.advanceTimersByTime(100)
      await jobQueue.getJob().blocker

      expect(jobQueue.getJob()).toStrictEqual({
        value: 4,
        status: 'done'
      })
      expect(jobQueue2.getJob()).toStrictEqual({
        value: 1,
        status: 'done'
      })
      expect(jobQueue3.getJob()).toStrictEqual({
        blocker: expect.any(Promise),
        status: 'blocked'
      })
      
      jest.advanceTimersByTime(100)
      await jobQueue3.getJob().blocker

      expect(jobQueue.getJob()).toStrictEqual({
        value: 1,
        status: 'done'
      })

      expect(jobQueue2.getJob()).toStrictEqual({
        value: 4,
        status: 'done'
      })

      expect(jobQueue3.getJob()).toStrictEqual({
        value: 8,
        status: "done",
      });
    })
  })
});
