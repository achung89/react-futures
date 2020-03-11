import {act} from 'react-test-renderer';

const waitForSuspense = async waitTime => {
  act(() => {
    jest.advanceTimersByTime(waitTime);
  });

  for ( let a = 0; a < 30; a++ ) {
    await act( async () => {
      jest.runAllTimers();
      jest.runAllTicks();
      jest.runAllImmediates();
      jest.runOnlyPendingTimers();

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    jest.runAllTimers();
    jest.runAllTicks();
    jest.runAllImmediates();
    jest.runOnlyPendingTimers();
  };

}


export default waitForSuspense;