


export default class FutureObject {
  
  constructor(promise) {

    
    return new Proxy(this, {
      get: (target, key, receiver) {

      }
    })
  }
}