import {act} from 'react-test-renderer'

const waitForSuspense = async (waitTime) => {
  for(let i =0; i < 100; i ++) {
    await act(async () => {
      jest.advanceTimersByTime(waitTime)
      jest.runAllTimers()
      jest.runAllTicks()
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
  }
  for(let i =0; i < 100; i ++) {

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(waitTime)
    jest.runAllTimers()
    jest.runAllTicks()
    jest.runAllImmediates();
    jest.runOnlyPendingTimers();
  }


}


export default waitForSuspense;