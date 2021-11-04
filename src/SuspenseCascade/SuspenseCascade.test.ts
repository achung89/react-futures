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