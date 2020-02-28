import {act} from 'react-test-renderer'

const waitForSuspense = async (waitTime) => {
    await act(async () => {
      jest.advanceTimersByTime(waitTime)
      jest.runAllTimers()
      jest.runAllTicks()
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(waitTime)
    jest.runAllTimers()
    jest.runAllTicks()
    jest.runAllImmediates();
    jest.runOnlyPendingTimers();

}


export default waitForSuspense;