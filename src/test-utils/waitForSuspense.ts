import { act } from 'react-dom/test-utils';

const waitForSuspense = async (waitTime) => {

  for (let a = 0; a < 1000; a++) {
    try {
      jest.advanceTimersByTime(waitTime);

      await act(async () => {
        try {
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
          jest.runAllTimers();
          jest.runAllTicks();
          jest.runAllImmediates();
          jest.runOnlyPendingTimers();
        } catch (err) {
          throw err;
        }
      });
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      jest.runAllTimers();
      jest.runAllTicks();
      jest.runAllImmediates();
      jest.runOnlyPendingTimers();
    } catch (err) {
      throw err
    }
  }
};

export default waitForSuspense;
