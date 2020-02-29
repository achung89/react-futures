import {act} from 'react-test-renderer'

const waitForSuspense = async (waitTime) => {
  jest.advanceTimersByTime(waitTime)

    for(let a = 0; a < 10; a ++) {
    await act(async () => {

      jest.runAllTimers()
      jest.runAllTicks()
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
  }
  for(let a = 0; a < 10; a ++) {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    jest.runAllTimers()
    jest.runAllTicks()
    jest.runAllImmediates();
    jest.runOnlyPendingTimers();
  }
}


export default waitForSuspense;