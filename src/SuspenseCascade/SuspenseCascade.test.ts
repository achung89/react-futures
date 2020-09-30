import SuspenseCascade from "./SuspenseCascade";
import { upperCase, spaceOut, throwOnce } from "./suspenseFuncs";



describe('SuspenseCascade', () => {
  it('shouldnt throw suspense if promise is already resolved', async () => {
    
    let suspender = SuspenseCascade.of(throwOnce(() => 'johnny bravo'))
                      .map(throwOnce(upperCase))
    try {
      expect(() => suspender.get()).toThrow();
      suspender.get();
    } catch (prom) {
      expect(prom).toBeInstanceOf(Promise);
      await prom
    }
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

    let suspender = SuspenseCascade.of(() => 'johnny bravo')
      .map(throwOnce(upperCase))
    try {
      expect(() => suspender.get()).toThrow();
      suspender.get();
    } catch (prom) {
      expect(prom).toBeInstanceOf(Promise);
      await prom
    }
    expect(suspender.get()).toEqual('JOHNNY BRAVO')


  })
  
  it('should throw suspense if first callback throws', async () => {

    let suspender = SuspenseCascade.of(throwOnce(() => 'johnny bravo'))
                      .map(upperCase)
    try {
      expect(() => suspender.get()).toThrow();
      suspender.get();
    } catch (prom) {
      expect(prom).toBeInstanceOf(Promise);
      await prom
    }
    expect(suspender.get()).toEqual('JOHNNY BRAVO')

  })
  it('should throw suspense if first and second callback throws', async () => {
    let suspender = SuspenseCascade.of(throwOnce(() => 'johnny bravo'))
                      .map(throwOnce(upperCase))
    try {
      expect(() => suspender.get()).toThrow();
      suspender.get();
    } catch (prom) {
      expect(prom).toBeInstanceOf(Promise);
      await prom
    }
    expect(suspender.get()).toEqual('JOHNNY BRAVO')
  })

})