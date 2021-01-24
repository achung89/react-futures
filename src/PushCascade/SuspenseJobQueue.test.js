const { createCipher } = require("crypto");
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
        status: "success",
      });
    });
    it("should immutably pipe values into callback passed into .append", () => {
      const jobQueue = new SuspenseJobQueue(() => 1);
      const jobQueue2 = jobQueue.append((val) => val + 3);

      expect(jobQueue2.getJob()).toStrictEqual({
        value: 4,
        status: "success",
      });
      expect(jobQueue.getJob()).toStrictEqual({
        value: 1,
        status: "success",
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
        status: "success",
      });

      expect(jobQueue2.getJob()).toStrictEqual({
        value: 4,
        status: "success",
      });

      expect(jobQueue.getJob()).toStrictEqual({
        value: 1,
        status: "success",
      });
    });

    it("should be able handle multiple append calls", () => {
      const jobQueue = new SuspenseJobQueue(() => 1);
      const jobQueue2 = jobQueue.append((val) => val + 3);

      const jobQueue3 = jobQueue.append((val) => val + 4);

      expect(jobQueue3.getJob()).toStrictEqual({
        value: 5,
        status: "success",
      });

      expect(jobQueue2.getJob()).toStrictEqual({
        value: 4,
        status: "success",
      });

      expect(jobQueue.getJob()).toStrictEqual({
        value: 1,
        status: "success",
      });
    });
  });

  describe('asynchronously', () => {
    it("should throw awaiting promise and resolve value once job finishes", async () => {
      const cb = wait(() => 1, 100)
      const jobQueue = new SuspenseJobQueue(cb);
      const catchCb = jest.fn();
      try {
        jobQueue.getJob()
      } catch(errOrProm) {
        
        jest.runTimersToTime(100);
        if(typeof errOrProm.then === 'function') {
          await errOrProm;
        }
        catchCb()
      }

      expect(catchCb.mock.calls.length).toEqual(1);

      expect(jobQueue.getJob()).toStrictEqual({
        value: 1,
        status: "success",
      })
    });
    it("should immutably pipe values into callback passed into .append", async () => {

        const cb = wait(() => 1, 100)

        const jobQueue = new SuspenseJobQueue(cb)
        const jobQueue2 = jobQueue.append((val) => val + 3);
        try {
          jobQueue2.getJob()
        } catch(errOrProm) {
          
          jest.runTimersToTime(100);
          if(typeof errOrProm.then === 'function') {
            await errOrProm;
          }
          catchCb()
        }
        expect(catchCb.mock.calls.length).toEqual(1);

        expect(jobQueue2.getJob()).toStrictEqual({
          value: 4,
          status: "success",
        });
      
    });
    it('.append should not change previous job', async () => {
      
        const cb = wait(() => 1, 100)

        const jobQueue = new SuspenseJobQueue(cb)
        const jobQueue2 = jobQueue.append((val) => val + 3);

        try {
          jobQueue.getJob()
        } catch(errOrProm) {
          
          jest.runTimersToTime(100);
          if(typeof errOrProm.then === 'function') {
            await errOrProm;
          }
          catchCb()
        }

        expect(catchCb.mock.calls.length).toEqual(1);

        expect(jobQueue.getJob()).toStrictEqual({
          value: 1,
          status: "success",
        });
    });
    it("thrown cb should be resolved down the chain", async () => {
      const cb = wait(() => 1, 100)

      const jobQueue = new SuspenseJobQueue(cb);
      const jobQueue2 = jobQueue.append((val) => val + 3);

      const jobQueue3 = jobQueue2.append((val) => val + 4);

      try {
        jobQueue3.getJob()
      } catch(errOrProm) {

        jest.runTimersToTime(100);
        if(typeof errOrProm.then === 'function') {
          await errOrProm;
        }
        catchCb()
      }

      expect(catchCb.mock.calls.length).toEqual(1);

      expect(jobQueue3.getJob()).toStrictEqual({
        value: 7,
        status: "success",
      });
    });

    it(".append should throw twice if 2 callbacks throw", async () => {
      const cb = wait(() => 1, 100)
      const cb2 = wait((val) => val + 3, 100)
      const jobQueue = new SuspenseJobQueue(cb);
      const jobQueue2 = jobQueue.append(cb2);

      const jobQueue3 = jobQueue2.append((val) => val + 4);

      try {
        jobQueue3.getJob()
      } catch(errOrProm) {
        
        jest.runTimersToTime(100);
        if(typeof errOrProm.then === 'function') {
          await errOrProm;
        }
        catchCb()
      }

      try {
        jobQueue3.getJob()
      } catch(errOrProm) {
        
        jest.runTimersToTime(100);
        if(typeof errOrProm.then === 'function') {
          await errOrProm;
        }
        catchCb()
      }

      expect(catchCb.mock.calls.length).toEqual(2);

      expect(jobQueue3.getJob()).toStrictEqual({
        value: 7,
        status: "success",
      });
    });

    it("should be able handle multiple append calls", async () => {
      const cb = wait(() => 1, 100)

      const jobQueue = new SuspenseJobQueue(cb);
      const jobQueue2 = jobQueue.append((val) => val + 3);

      const jobQueue3 = jobQueue.append((val) => val + 4);

      try {
        jobQueue2.getJob()
      } catch(errOrProm) {
        
        jest.runTimersToTime(100);
        if(typeof errOrProm.then === 'function') {
          await errOrProm;
        }
        catchCb()
      }

      expect(catchCb.mock.calls.length).toEqual(1);
      
      expect(jobQueue2.getJob()).toStrictEqual({
        value: 4,
        status: "success",
      });

      try {
        jobQueue3.getJob()
      } catch(errOrProm) {
        
        jest.runTimersToTime(100);
        if(typeof errOrProm.then === 'function') {
          await errOrProm;
        }
        catchCb()
      }

      expect(catchCb.mock.calls.length).toEqual(2);

      expect(jobQueue3.getJob()).toStrictEqual({
        value: 5,
        status: "success",
      });

      expect(jobQueue.getJob()).toStrictEqual({
        value: 1,
        status: "success",
      });
    });
  })
});
