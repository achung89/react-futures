const waitForSuspense = async waitTime => {
  act(() => {
    jest.advanceTimersByTime(waitTime)
    jest.runAllTimers()
    jest.runAllTicks()
  });
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  jest.advanceTimersByTime(waitTime)
  jest.runAllTimers()
  jest.runAllTicks()
}