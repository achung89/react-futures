import { act } from 'react-dom/test-utils';

const waitForSuspense = async waitTime => {
  act(() => {
    jest.advanceTimersByTime(waitTime);
  });

  for (let a = 0; a < 100; a++) {
    await act(async () => {
      
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      jest.runAllTimers();
      jest.runAllTicks();
      jest.runAllImmediates();
      jest.runOnlyPendingTimers();

    });

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    jest.runAllTimers();
    jest.runAllTicks();
    jest.runAllImmediates();
    jest.runOnlyPendingTimers();
  }
};

export default waitForSuspense;
