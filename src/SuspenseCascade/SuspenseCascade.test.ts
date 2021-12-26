import { SuspenseCascade } from "../internal";
import { ThrowablePromise } from "../ThrowablePromise/ThrowablePromise";
import { upperCase, spaceOut, throwOnce, throwTwice } from "./suspenseFuncs";


describe('SuspenseCascade', () => {
  it('shouldnt throw suspense if promise is already resolved', async () => {
  const fn = jest.fn()
    
    let suspender = SuspenseCascade.of(throwOnce(() => 'johnny bravo'))
                      .map(throwOnce(upperCase))
    try {
      suspender.get();
    } catch (prom) {
      fn()
      expect(prom).toBeInstanceOf(ThrowablePromise);
      await prom
    }
    expect(fn).toHaveBeenCalled()
    expect(() => suspender.get()).not.toThrow();

  })
  it('should return value if no promises throw', () => {
    const suspense = SuspenseCascade.of(() => 'johnny bravo')
    expect(suspense.get()).toEqual('johnny bravo')
  })
  it('should map callbacks', () => {
    {
      const suspense = SuspenseCascade.of(() => 'johnny bravo')
        .map(upperCase);
      expect(suspense.get()).toEqual('JOHNNY BRAVO')
    }
    {
      const suspense = SuspenseCascade.of(() => 'johnny bravo')
        .map(upperCase)
        .map(spaceOut)

      expect(suspense.get()).toEqual('J O H N N Y   B R A V O')
    }
  })
  it('should throw suspense', async () => {
    const fn = jest.fn()


    let suspender = SuspenseCascade.of(() => 'johnny bravo')
      .map(throwOnce(upperCase))
    try {
      suspender.get();
    } catch (prom) {
      fn()
      expect(prom).toBeInstanceOf(ThrowablePromise);
      await prom
    }
    expect(fn).toHaveBeenCalled()
    expect(suspender.get()).toEqual('JOHNNY BRAVO')


  })
  
  it('should throw suspense if first callback throws', async () => {
    const fn = jest.fn()

    let suspender = SuspenseCascade.of(throwOnce(() => 'johnny bravo'))
                      .map(upperCase)
    try {
      suspender.get();
    } catch (prom) {
      fn()
      expect(prom).toBeInstanceOf(ThrowablePromise);
      await prom
    }
    expect(fn).toHaveBeenCalled()

    expect(suspender.get()).toEqual('JOHNNY BRAVO')

  })
  it('should throw suspense if first and second callback throws', async () => {
    const fn = jest.fn()

    let suspender = SuspenseCascade.of(throwOnce(() => 'johnny bravo'))
                      .map(throwOnce(upperCase))
    try {
      suspender.get();
    } catch (prom) {
      fn()
      expect(prom).toBeInstanceOf(ThrowablePromise);
      await prom
    }
    expect(fn).toHaveBeenCalled()

    expect(suspender.get()).toEqual('JOHNNY BRAVO')
  })
  it.skip('should throw same promise on subsequent throw', async () => {
    const fn = jest.fn()

    let suspender = SuspenseCascade.of(throwTwice(() => 'johnny bravo'))
    
    let promise1
    try {
      suspender.map(() => {}).get();
    } catch (prom) {
      promise1 = prom;
      fn()
      expect(prom).toBeInstanceOf(ThrowablePromise);
    }

    try {
      suspender.map(() => {}).get();
    } catch (prom) {
      fn()
      expect(prom).toBeInstanceOf(ThrowablePromise);
      expect(prom === promise1).toEqual(true)
      await prom;
    }

    expect(fn).toHaveBeenCalledTimes(2)

    expect(suspender.get()).toEqual('JOHNNY BRAVO')
  })
})

describe('Error handling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  })
  afterEach(() => {
    jest.useRealTimers();
  })
  it('should handle thrown errors in the constructor', () =>{
    const cascade = SuspenseCascade.of(() => {
      throw new Error('Test Error Is Thrown')
    })

    expect(() => cascade.get()).toThrowError('Test Error Is Thrown')
  })
  it('should handle thrown errors in constructor with map', () => {
    const cascade = SuspenseCascade.of(() => {
      throw new Error('Test Error Is Thrown')
    }).map(() => {})

    expect(() => cascade.get()).toThrowError('Test Error Is Thrown')
    
  })
  it('should handle thrown errors in map', () => {

    const cascade = SuspenseCascade.of(() => void 0)
                      .map(() => {
                        throw new Error('Test Error Is Thrown')
                      })

    expect(() => cascade.get()).toThrowError('Test Error Is Thrown')

  })
  it('should handle thrown errors in thrown promise', async () => {

    const fn = jest.fn()

    let status = 'pending'
    const prom = new Promise((res, rej) => {
      setTimeout(() => {
        status = 'complete'  
        rej(new Error('Test Error Is Thrown'))
      }, 10)
    }).catch((err) => { throw err })

    const throwWithError = () => {
      if(status === 'pending') {
        throw prom;
      }

    }

    let suspender = SuspenseCascade.of(throwWithError)
                      
    try {
      suspender.get();
    } catch (prom) {
      fn()
      expect(prom).toBeInstanceOf(ThrowablePromise);
      jest.advanceTimersByTime(10);

    }
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    try {
      suspender.get();
    } catch(err) {
      fn();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('Test Error Is Thrown')
    }
    expect(fn).toHaveBeenCalledTimes(2)
  })
  it('should handle thrown errors in thrown promise with map', async () => {

    const fn = jest.fn()

    let status = 'pending'
    const prom = new Promise((res, rej) => {
      setTimeout(() => {
        status = 'complete'  
        rej(new Error('Test Error Is Thrown'))
      }, 10)
    }).catch((err) => { throw err })

    const throwWithError = () => {
      if(status === 'pending') {
        throw prom;
      }

    }

    let suspender = SuspenseCascade.of(throwWithError)
                      .map(() => {})
                      
    try {
      suspender.get();
    } catch (prom) {
      fn()
      expect(prom).toBeInstanceOf(ThrowablePromise);
      jest.advanceTimersByTime(10);
    }

    for(let a = 0; a < 10; a++) {
      await Promise.resolve();
    }

    try {
      suspender.get();
    } catch(err) {
      fn();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('Test Error Is Thrown')
    }

    expect(fn).toHaveBeenCalledTimes(2)
  })
  
  it('should handle thrown errors in thrown promise with map', async () => {
    const fn = jest.fn()

    let status = 'pending'
    const prom = new Promise((res, rej) => {
      setTimeout(() => {
        status = 'complete'  
        rej(new Error('Test Error Is Thrown'))
      }, 10)
    }).catch((err) => { throw err })

    const throwWithError = () => {
      if(status === 'pending') {
        throw prom;
      }
    }

    let suspender = SuspenseCascade.of(() => {})
                      .map(throwWithError)
                      
    try {
      suspender.get();
    } catch (prom) {
      fn()
      expect(prom).toBeInstanceOf(ThrowablePromise);
      jest.advanceTimersByTime(10);

    }
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    try {
      suspender.get();
    } catch(err) {
      fn();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('Test Error Is Thrown')
    }
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should handle thrown errors in thrown promise with map', async () => {

    const fn = jest.fn()

    let status = 'pending'
    const prom = new Promise((res, rej) => {
      setTimeout(() => {
        status = 'complete'  
        rej(new Error('Test Error Is Thrown'))
      }, 10)
    }).catch((err) => { throw err })

    const throwWithError = () => {
      if(status === 'pending') {
        throw prom;
      }

    }

    let suspender = SuspenseCascade.of(() =>{})
                      .map(throwWithError)
                      .map(() => {})
                      
    try {
      suspender.get();
    } catch (prom) {
      fn()
      expect(prom).toBeInstanceOf(ThrowablePromise);
      jest.advanceTimersByTime(10);
    }
    for(let a = 0; a < 10; a ++) {
      await Promise.resolve();
    }

    try {
      suspender.get();
    } catch(err) {
      fn();

      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('Test Error Is Thrown')
    }

    expect(fn).toHaveBeenCalledTimes(2)
  })

})

// describe('Render scenarios', () => {
  
//   it('should suspend in react render', async () => {
//     let refresh;
//     let renderer;
//     const App = () => {
//       const futArr = new FutureArr('test-key');

//       refresh = useCacheRefresh();

      
//       return <div>
//         {futArr}
//       </div>;
//     }
//     act(() => {
//       renderer = render(
//         <Suspense fallback={<div>Loading...</div>}>
//           <App />
//         </Suspense>, container);
//     });
//     const {getByText} = renderer;
    

//     await waitFor(() => getByText('Loading...'));
//     expect(Scheduler).toHaveYielded([])
    
//     act(() => {
//       jest.runTimersToTime(150);
//     })

//     await waitForSuspense(0)
//     expect(Scheduler).toHaveYielded(['Promise Resolved. value: test-key'])

//     await waitFor(() => getByText('234test-key'));

//     act(() => {
//       refresh();
//     })

//     await waitFor(() => getByText('Loading...'));
//     expect(Scheduler).toHaveYielded([])
    
//     act(() => {
//       jest.runTimersToTime(150);
//     })

//     await waitForSuspense(0)
//     expect(Scheduler).toHaveYielded(['Promise Resolved. value: test-key'])

//     await waitFor(() => getByText('234test-key'));
//   })
// })