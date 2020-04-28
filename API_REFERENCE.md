
## API Reference

## Future Array

<hr>

### futureArray

```javascript
futureArray(promiseReturningFunction); // => future array class
```

Produces a future array constructor. The parameters for the promiseReturningFunction can be passed into the constructor during instantiation.

###### ARGUMENTS

promiseReturningFunction ((...Array<string | number | undefined | null>) => Promise<any[]>): function that returns a promise that resolves to an array.

###### RETURNS

future array class (class FutureArrayCache): future array constructor

##### Basic Usage

```javascript
import { futureArray } from "react-future";

const fetchBlogs = count =>
  fetch(`/blogs?count=${count}`).then(res => res.json());
const FutureBlogs = futureArray(fetchBlogs);
```

<hr />

### FutureArrayCache

A `FutureArrayCache` class is returned from `futureArray` and is used to instantiate future arrays. It consumes the promise from the promiseReturningFunction and caches the results using LRU.
<br />
<br />

#### constructor

```javascript
new FutureArrayCache(...argumentsOfPromiseReturningFunction); // => future array instance
```

###### ARGUMENTS

...argumentsOfPromiseReturningFunction (...Array<string | number | undefined | null>): arguments of the promiseReturningFunction which is passed into `futureArray`. Must be primitive values, arrays and objects are not allowed.

###### RETURNS

future array (instanceof `FutureArrayCache`): a future with the same interface as an array
<br />
<br />

#### Instance methods

Future arrays share the same methods as host arrays

##### Immutable instance methods

Immutable methods will defer operations both inside and outside render. The methods include all immutable methods of array.

<details><summary>List of immutable methods</summary>
<p>
- concat<br/>
- filter<br/>
- slice<br/>
- map<br/>
- reduce<br/>
- reduceRight<br/>
- flat<br/>
- flatMap<br/>
- reverse<br/>
- copyWithin<br/>
- sort<br/>
- fill<br/>
- splice<br/>
</p>
</details>

##### Mutable instance methods

Mutable instance methods will defer operations outside render and throw a `MutableOperationError` inside render. The error is thrown because mutable operation in render could lead to unintended consequences.

<details><summary>List of mutable methods</summary>
<p>
- splice<br />
- copyWithin<br />
- sort<br />
- unshift<br />
- reverse<br />
- fill<br />
</p>
</details>

##### Suspend instance methods

Suspend methods are operations examine the contents of the array. These methods throw an error outside render and suspend inside render.

<details><summary>List of suspend methods</summary>
- indexOf<br />
- includes<br />
- join<br />
- lastIndex<br />
- toString<br />
- toLocaleString<br />
- forEach<br />
- find<br />
- every<br />
- some<br />
- findIndex<br />
</details>

#### Static methods

##### of

instantiates a future array with the same arguments as the constructor

```javascript
FutureArrayCache.of(...argumentsOfPromiseReturningFunction); // => future array instance
```

<br />

## Future Object

<hr />

### futureObject

```javascript
futureObject(promiseReturningFunction); // => future object class
```

Produces a future object constructor. The parameters for the promiseReturningFunction can be passed into the constructor on instantiation.

###### ARGUMENTS

promiseReturningFunction ((...Array<string | number | undefined | null>) => Promise\<object>): function that returns a promise that resolves to an object

###### RETURNS

future object class (class FutureObjectCache): future array constructor

##### Basic Usage

```javascript
import { futureObject } from "react-future";

const fetchUser = name => fetch(`/user?=${name}`).then(res => res.json());
const futureUser = futureArray(fetchUser);
```

<hr />

### FutureObjectCache

A `FutureObjectCache` constructor is returned from `futureObject` and is used to instantiate future objects. It consumes the promise from the promiseReturningFunction and caches the results using LRU.

#### constructor

```javascript
new FutureObjectCache(...argumentsOfPromiseReturningFunction); // => future object instance
```

###### ARGUMENTS

...argumentsOfPromiseReturningFunction (...any[]): arguments of the promiseReturningFunction that is passed into `futureObject`

###### RETURNS

future object (instanceof `FutureObjectCache`): a future with the same interface as an object. All property lookups will suspend.

#### Instance methods

Future objects share the same methods as host objects. All property lookups will suspend.

#### Static methods

Future objects share the same static methods as the host Object constructor. All static methods, even mutable methods, have been implemented to be immutable and defer.

##### of

instantiates a future object with the same arguments as the constructor

```javascript
FutureObjectCache.of(...argumentsOfPromiseReturningFunction); // => future object instance
```

##### Immutable static methods

These methods return a future object or a future array and can be used both in and outside render.

<details><summary>List of immutable static</summary>
- getOwnPropertyDescriptor<br />
- getOwnPropertyNames<br />
- getOwnPropertySymbols<br />
- getPrototypeOf<br />
- keys<br />
- entries<br />
- fromEntries<br />
- values<br />
- assign<br />
- seal<br />
- preventExtensions<br />
- defineProperties<br />
- defineProperty<br />
- freeze<br />
- setPrototypeOf<br />
</details>


##### Suspend static methods

These methods require examining the contents of the object and therefore suspend. They can be used inside render but not out.

<details><summary>List of suspend static</summary>
- isExtensible<br />
- isFrozen<br />
- isSealed<br />

</details>

##### Invalid method

These methods are invalid globally because their implementation is tbd. We will enable these once we are confident about how these methods are used, for now please use the static methods on the Object constructor.

<details><summary>List of invalid static</summary>
- is<br />
- create<br />
</details>

<br />

### Utility functions

<hr />

#### lazyArray

`lazyArray` takes an array returning function and converts it to a future. The passed in callback will be evaluated lazily and represents the initial value of the array. 

```javascript
lazyArray(arrayReturningFunction); // => future array instance
```

###### ARGUMENTS

arrayReturningFunction (() => any[]): lazy callback, requires array as return value

###### RETURNS

future array (instanceof LazyArray): future array result of callback

##### Basic usage

```javascript
// `values` takes an object and returns an array of property values.
import { values } from 'ramda'
import { futureObject, lazyArray } from 'react-futures'

const FutureUser = futureObject(...);
const user = new FutureUser();

const userProps = lazyValues(() => values(user)); //=> future array
```

```javascript
import { filter } from 'ramda'
import { futureArray, lazyArray } from 'react-futures'
const FutureFriends = futureArray(...);

const friends = new FutureFriends();

const highSchoolFriends = lazyArray(() => filter( ({age}) => age > 28, friends) ); //=> future array
```

<hr />

#### lazyObject

`lazyObject` takes an object returning function and converts it to a future. The passed in callback will be evaluated lazily and represents the initial value of the object.

```javascript
lazyObject(objectReturningFunction); // => future object instance
```

###### ARGUMENTS

objectReturningFunction (() => object): lazy callback, requires object as return value

###### RETURNS

future object (instanceof LazyObject): future object result of callback

##### Basic usage

```javascript
// `invertObj` swaps the key and value of an object
import { invertObj } from 'ramda'
import { futureObject, lazyObject } from 'react-futures'

const FutureUser = futureObject(...);
const user = new FutureUser();


const invertedUser = lazyObject(() => invertObj(user)) //=> future object
```

#### getRaw

`getRaw` takes a future as a parameter and suspends with raw value.

```javascript
getRaw(future) // => raw value of future
```

###### ARGUMENTS

future (instanceof Effect): future

###### RETURNS

raw value of future (instanceof object|array): raw value of future

##### Basic usage
```javascript
import {getRaw} from 'react-futures';
const dave = new FutureUser('Dave');

const App = () => {
  const rawDave = getRaw(dave) // suspends here and gets raw value

  return <>
    {rawDave.name}
  </>
}

```


#### toPromise

`toPromise` takes a future as a parameter and resolves with the raw value.

```javascript
toPromise(future) // => promise
```

###### ARGUMENTS

future (instanceof Effect): future

###### RETURNS

promise (Promise<object | array>): promise that resolves to value of future

##### Basic usage
```javascript
import {toPromise} from 'react-futures';
const dave = new FutureUser('Dave');

toPromise(dave)
  .then(console.log) // logs: dave
```


#### isFuture

`isFuture` tells you whether parameter is future or not

```javascript
isFuture(future) // => boolean
```

###### ARGUMENTS

future (instanceof Effect): future

###### RETURNS

boolean (instanceof Boolean): boolean of whether the parameter is a future

##### Basic usage
```javascript
import {isFuture} from 'react-futures';
const dave = new FutureUser('Dave');

if ( isFuture(dave) ) {
  //... 
}
```