


// test that resource can take a promise returning function or async function and when invoked returns it (both array and object)
      // permutation
        // inside render
        // outside render

// test that .invoke can be call in place of invocation (both array and object)
      // permutation
        // inside render
        // outside render
// test that .invoke can be forked (both array and object)
      // permutation
        //inside render
        // outside rener
        // inside and outside render

// can suspend inside callback (both array and object)
      // permutations: 
          // inside render
          // outside render

// test that .then can be invoked on resource (both object and array)
      // permutation
        // inside render
        // outside render
// test that .then allows for forking (both array and object)
      //permutation
        // insider render
        // outside render
        // inside and outside render
// test that .then can take an onerror function (both array and object)
      // permtation
        // inside render
        // outside render
// test that .then can take an onerror function with fork (both array and object)
      //permutation
        // insider render
        // outside render
        // inside and outside render
      
// Can throw errors (both array and object)
  // case: 
    // in promise
    // in sync calback
    // in .then
  // permutation: 
    //inside render
    // outside render

// .catch will handle errors (both array and object)
  // case:
    // in promise
    // in sync calback
    // in .then
  // permutation
    // inside render
    // outside render

// .finally called after promise is resolved (both array and object)
    // case: will be called after promise resolved
    // case: wil be called after all .then are called
    // case: can be forked
    // permutation
      // outside render
      // inside render
      // for forked: inside and outside render

// A throw (or returning a rejected promise) in the finally callback will reject the new promise with the rejection reason specified when calling throw. (both array and object)
  // rejects the returned promise, but not the previous promise
// test that invocations outside render are not cached (both array and object)
    // case
      // click handler
      // in module space

// test that invocations inside render are cached (both array and object)

// customReactCacheKey should allow customizing cache key (both array and object)
// default cacheKey should cache objects by reference (both array and object)

