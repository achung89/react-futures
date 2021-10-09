import { act } from 'react-dom/test-utils';

const waitForSuspense = async (waitTime) => {
  jest.advanceTimersByTime(waitTime);
  for (let a = 0; a < 100; a++) {
    try {

      await act(async () => {
        try {
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
          jest.runAllTicks();
          jest.runAllImmediates();
        } catch (err) {
          throw err;
        }
      });
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      jest.runAllTicks();
      jest.runAllImmediates();
    } catch (err) {
      throw err
    }
  }
};

export default waitForSuspense;
