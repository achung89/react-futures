
## API Reference

## Future Array

<hr>

### futureArray

```javascript
futureArray(promiseReturningFunction); // => FutureArrayConstructor
```

Produces a future array constructor. The parameters for the promiseReturningFunction can be passed into the constructor on instantiation.

###### ARGUMENTS

promiseReturningFunction ((...any[]) => Promise<any[]>): function that returns a promise that resolves to an array.

###### RETURNS

future array constructor (class FutureArrayCache): future array constructor

##### Basic Usage

```javascript
import { futureArray } from "react-future";

const fetchBlogs = count =>
  fetch(`/blogs?count=${count}`).then(res => res.json());
const FutureBlogs = futureArray(fetchBlogs);
```

<hr />

### FutureArrayCache

A `FutureArrayCache` constructor is returned from `futureArray` and is used to instantiate future arrays. It consumes the promise from the promiseReturningFunction and caches the resultes using LRU.
<br />
<br />

#### constructor

```javascript
new FutureArrayCache(...argumentsOfPromiseReturningFunction); // => future array instance
```

###### ARGUMENTS

...argumentsOfPromiseReturningFunction (...any[]): arguments of the promiseReturningFunction which is passed into `futureArray`

###### RETURNS

future array (intanceof `FutureArrayCache`): a future with the same interface as an array, except for added variants `immReverse`, `immCopyWithin`, `immSort`, `immFill`, and `immSplice`
<br />
<br />

#### Instance methods

Future arrays share the same methods as host arrays, with the exception of added immutable variants of methods

##### Immutable instance methods

Immutable methods will defer operations both inside and outside render. The methods include all immutable methods of array and include additional immutable variants of methods (`immReverse`, `immCopyWithin`, `immSort`, `immFill`, and `immSplice`)

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

Suspend methods are opearations that require examining the contents of the array. These methods throw an error outside render and suspend inside render.

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

instantiantes a future array with the same arguments as the constructor

```javascript
FutureArrayCache.of(...argumentsOfPromiseReturningFunction); // => future array instance
```

<br />

## Future Object

<hr />

### futureObject

```javascript
futureObject(promiseReturningFunction); // => FutureArrayConstructor
```

Produces a future object constructor. The parameters for the promiseReturningFunction can be passed into the constructor on instantiation.

###### ARGUMENTS

promiseReturningFunction ((...any[]) => Promise\<object>): function that returns a promise that resolves to an object

###### RETURNS

future array constructor (class FutureArrayCache): future array constructor

##### Basic Usage

```javascript
import { futureObject } from "react-future";

const fetchUser = name => fetch(`/user?=${name}`).then(res => res.json());
const futureUser = futureArray(fetchUser);
```

<hr />

### FutureObjectCache

A `FutureObjectCache` constructor is returned from `futureObject` and is used to instantiate future objects. It consumes the promise from the promiseReturningFunction and caches the resultes using LRU.

#### constructor

```javascript
new FutureObjectCache(...argumentsOfPromiseReturningFunction); // => future array instance
```

###### ARGUMENTS

...argumentsOfPromiseReturningFunction (...any[]): arguments of the promiseReturningFunction that is passed into `futureObject`

###### RETURNS

future object (intanceof `FutureObjectCache`): a future with the same interface as an object. All property lookups will suspend.

#### Instance methods

Future objects share the same methods as host objects. All property lookups will suspend.

#### Static methods

Future objects share the same static methods as the host Object constructor. Most have been repurposed to defer when possible.

##### of

instantiantes a future array with the same arguments as the constructor

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
</details>

##### Mutable static methods

These methods mutate and return the future object passed in. These operations are allowed outside render but prohibited inside render.

<details><summary>List of immutable static</summary>
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

<details><summary>List of immutable static</summary>
- isExtensible<br />
- isFrozen<br />
- isSealed<br />
</details>

##### Invalid method

These methods are invalid globally because their use cases are currently not well understood. We will enable these once we understand how these methods are used, for now please use the static methods of the Object constructor.

<details><summary>List of invalid static</summary>
- is<br />
- create<br />
</details>

<br />

### Utility functions

<hr />

#### lazyArray

`lazyArray` converts an array returning function into a lazy future returning function.

```javascript
lazyArray(arrayReturningFunction); // => lazyArrayReturningImmutableFunction
```

###### ARGUMENTS

arrayReturningFunction ((...any[]) => any[]): lazy callback, requires array as return value

###### RETURNS

future array (insanceof LazyArray): future array result of callback

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

`lazyObject` converts an object returning function into a lazy future object returning function.

```javascript
lazyObject(objectReturningFunction); // => future object
```

###### ARGUMENTS

objectReturningFunction ((...any[]) => object): lazy callback, requires object as return value

###### RETURNS

future object (instanceof LazyObject): future object result of callback

##### Basic usage

```javascript
// `invertObj` swaps the key and value of an object
import { invertObj } from 'ramda'
import { futureObject, lazyObject } from 'react-futures'

const FutureUser = futureObject(...);
const user = new FutureUser();


const invertedUser = lazyObject(() => inverObj(user)) //=> future object
```

#### getRaw

`getRaw` takes a future as a parameter and suspends with raw value.

```javascript
getRaw(future) // => raw value of future
```

###### ARGUMENTS

future (instanceof Effect): any future

###### RETURNS

raw value of future (instanceof object|array): raw valueof future

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