# React Futures

Manipulate asynchronous data synchronously

## Install

```
#npm
npm i react-futures

#yarn
yarn add react-futures
```

## Explainer

React Futures is a collection of datatypes that allow syncronous-looking data manipulation of asynchronous data by suspending only when the data is consumed and deferring data manipulation until after the promise resolves.

Ex.

```javascript
import { createArrayType } from 'react-futures';

const FutureBlogs = createArrayType(user => fetch(`/blogs?user=${user}`).then(res => res.json()))

const Blogs = ({ user }) => {
  const blogs = new FutureBlogs(user) // prefetches here
                  .filter( blog => blog.tags.includes('sports')) // lazy
                  .slice(0,10) // lazy

  const featured = blogs[0] //suspend!

  return ...
}
```

React Futures follows the "wait-by-necessity" principle, meaning it defers suspension until the content of the data is examined. Only after the suspense is resolved are operations like `map`, `slice`, and `filter` applied. This simplifies data construction by hiding data fetching implementation.

When the requirements for data-fetching increases, the benefits of React Futures become clearer.

```javascript

// With React Futures
import { createArrayType, createObjectType } from 'react-futures';

const toJSON = res => res.json()
const FutrFriends = createArrayType(user => fetch(`/${user}/friends`).then(toJSON));
const FutrGroups = createArrayType(user => fetch(`/${user}/groups`).then(toJSON));
const FutrUser = createObjectType(user => fetch(`/user?name=${user}`).then(toJSON));

const userName = 'Tom'

const user = new FutrUser(userName) //can prefetch outside render
const friends = new FutrFriends(userName)
const sharedGroups = new FutrGroups(userName)
                          .filter(group => { // can manipulate data outside render
                            const friendsGroups = friends
                                                    .flatMap(friend => new FutrGroups(friend.name))
                                                    .map(group => group.name);
                            return friendsGroups.includes(group.name);
                          })

const profile = {
  user,
  friends,
  sharedGroups,
};

const App = () => {
  return ...
}



// With async await
const userName = 'Tom';

const toJSON = res => res.json()

const App = () => {
  const [profile, setProfile] = useState({})

  useEffect(() => {
    const getAllData = async () => {
      const user = await fetch(`/user?name${userName}`).then(toJSON)
      const friends = await fetch(`/${userName}/friends`).then(toJSON)
      const groups = await  fetch(`/${userName}/groups`).then(toJSON)
      const friendsGroups = (await Promise.all(friends.map(getGroup)))
                            .flat()
                            .map(group => group.name)

      const sharedGroups = groups.filter( group => friendsGroups.includes(group.name))
      setProfile({
        user,
        friends,
        sharedGroups,
      })
    }
    getAllData()
  }, [])

  return ...
}

```

This example demonstrates several benefits of React Futures:

- With React Futures asynchronicity is transparent; you can use a future as you would a normal object or an array.
- With React Futures the manipulation and construction of asynchronous data can be done **outside of render**, something not possible with other implementations of suspense.
- Futures allows the code that manipulates and constructs the data to be separated from the code that fetches it.
- React Futures can be used within the callbacks of other future data operations (see above where `FutureGroups` is used within the callback of `flatMap`)

## Restrictions

To achieve transparency, React Futures places restrictions on certain type of operations: mutable operations are not allowed inside of render and suspend operations are not allowed outside of render.

Ex.

```javascript
const blogs = FutrBlogs()

const first = blogs[0] // Error: suspense not allowed outside render
const sorted = blogs.sort((a, b) => a.timestamp - b.timestamp)

const App = () => {

  const first = blogs[0]
  const sorted = blogs.sort((a, b) => a.timestamp - b.timestamp) //Error: mutable operation `sort` not allowed inside render
  return ...
}

```

React Futures tries to provide work arounds for these restrictions. For mutable methods like `array.sort` and `array.reverse`, immutable variants that can be used in render like `array.immSort` and `array.immReverse` are provided. For suspense operations, React Futures provides utilities that can defer suspense operations (see [Using with third party libraries](#using-with-third-party-libraries-ramda-lodash-etc))

There are also operations that are globally prohibited like `array.push` and `array.shift`, click below for a list of all cases

## ADD CHART HERE

## Example snippets

### Object iteration

Object iteration with native types is typically done using `Object.entries` and `Object.fromEntries`, but `Object.entries` with a future will suspend, making iteration outside of render impossible. To allow this type of iteration React Futures puts a deferred version of `entries` and `fromEntries` on the future object constructors.

```javascript
import { createObjectType } from 'react-futures';
const FutureUser = createObjectType(() =>
  fetch('/user').then(res => res.json())
);

const user = new FutureUser();

const uppercaseUserEntries = FutureUser.entries(user) //lazy
  .map(([key, value]) => ({
    // lazy
    [key]: value.toUpperCase(),
  }));

const uppercaseUser = FutureUser.fromEntries(uppercaseUserEntries); // lazy
```

### Cache invalidation

React Futures use values passed into a future constructor as keys for an in-memory cache, so multiple instantiations with the same constructor will pull from the cache

```javascript
const dave = new FutureUser('Dave'); // fetches
const jen = new FutureUser('Jen'); // fetches

const App = () => {
  const dave = new Future('Dave'); // pulls from cache
  const jen = new Future('Jen'); // pulls from cache
  const harold = new Future('Harold'); // fetches
};
```

CSince caching is performed using LRU, invalidation is done automatically after the cache reaches a certain size and the key hasn't been used in a while.

To manually invalidate a key, you can use the static method `invalidate` on the future constructor.

```javascript
const dave = new FutrUser('Dave'); // fetches;

const App = () => {
  let dave = new FutrUser('Dave'); // pulls from cache

  FutureUser.invalidate('Dave'); // deletes 'Dave' from cache

  dave = new FutrUser('Dave'); // fetches
};
```

Sometimes it's useful to clear the entire cache, like on a page refresh. This can be accomplished using the static method `reset` on the future constructor

```javascript
const dave = new FutrUser('Dave');
const jen = new FutrUser('Jen');
const harold = new FutrUser('Harold');
const App = () => {
  useEffect(() => {
    return () => FutrUser.reset(); // clears 'Harold', 'Jen', and 'Dave' from cache
  }, []);
};
```

### Fetching on component mount

Sometimes it's desirable to fetch whenever a component is mounted, similar to how you would in the good old days with fetch and componentDidMount. To achieve this with futures, use `useEffect` to invalidate the cache on unmount.

```javascript
const useUser = name => {
  const user = new FutrUser(name); // fetches on first render
  useEffect(() => {
    return () => FutrUser.invalidate(name) // invalidates fetch
  }, [])

  return user
}

const App = () => {
  const user = useUser('Dave');

  return ...
}
```

With classes the invalidation can be placed inside `componentWillUnmount`

```javascript

class App extends React.Component {
  componenDidMount() {
    const user = new FutureUser('Dave') // fetches
    this.setState(() => ({ user }))
  }

  componentWillUnmount() {
    FutureUser.invalidate('Dave') // invalidates cache
  }

  render() {
    return ...
  }
}
```

### Prefetching

One of the focuses of suspense and concurrent mode is 'prefetching' which is fetching data way before we need it. This is great for performance as it shortens the percieved wait time of fetched data.

There is no explicit "prefetch" api in React Futures, fetching occurs whenever a future is instantiated. To prefetch simply instantiate the future outside of render or within a parent component.

```javascript

const user = new FutrUser('Dave') // instantiating outside of render will prefetch 'user' as js file parses

const App = () => {
  const friends = new FutrFriends('Dave') // prefetch in parent component
  const family = new FutrFamily('Dave') // prefetch in parent component
  const currentPage = usePageNavigation()
  return <>
    {
      currentPage === 'family' ? <Family family={family} /> : // 'family' suspended by <Family />
      currentPage === 'friends' ? <Friends friends={friends}> : null // 'friends' suspended by <Friends />
    }
  </>
}
```

### Using with third party libraries (ramda, lodash, etc.)

Third party libraries that examine the inner contents of input parameters will suspend if passed in a future. To prevent this use the `fmapArr`, `fmapObj` and `ftap` functons: `fmapArr` and `fmapObj` for array and object returning immutable operations respectively and `ftap` for mutable operations.

Lets take lodash's `_.cloneDeep` function for example. If you pass a future in the function, it would suspend since `_.cloneDeep` iterates through the properties of the future.

```javascript
const dave = new FutureUser('Dave');

const daveTwin = _.cloneDeep(dave); // Error: can not suspend outside render
```

To achieve this without suspending, wrap `_.cloneDeep` in `fmapObj`.

```javascript
import {fmapObj, createObjectType} from 'react-futures'

const FutrUser = createObjectType(...);

const dave = new FutrUser('Dave')

const lazyCloneDeep = fmapObj(_.cloneDeep)

const daveTwin = lazyCloneDeep(dave) // => future object
```

`fmapObj` are for object returning operations and `fmapArr` are for array returning operations.

For mutable operations, like `_.assign`, use `ftap`. `ftap` takes a function as a first parameter and a future as a curried parameter. It returns the passed in future.

```javascript
import { ftap } from 'react-futures'

...

const dave = new FutureUser('Dave')

const lazyAssign = ftap(futr => _.assign(futr, {foo: 'bar'})) // _.assign is mutable, so ftap is used

const dave2 = lazyAssign(dave) // => dave

dave2 === dave // true
```

`dave2` now has the `_.assign` operation stored in it and because we use `ftap`, a mutable operation, `dave` also has the operation stored inside it.

To defer function composition, you can use ramda's `pipeWith` or `composeWith` to wrap callbacks in `fmapArr` or `fmapObj`.

```javascript
import { pipeWith, filter, sort } from 'ramda';
import { createArrayType, fmapArr } from 'react-futures';

const FutrFriends = createArrayType(() => fetch(...))

const pipeFuture = pipeWith((fn, futr) => fmapArr(fn, futr)) // `fmapArr`, `fmapObj`, and 'ftap' are autocurried, so all arguments can be passed in at once

const lazyGetInternationalFriendsSortedByGrade = pipeFuture(
  filter(friend => friend.nationality !== 'USA'),
  sort(function(a, b) { return a.grade - b.grade; })
)

const internationalFriendsSortedByGrade = lazyGetInternationalFriendsSortedByGrade( new FutrFriends() ) // => future array
```

### Using with graphql

Coming soon...

## API Reference

## Future Array

### createArrayType

```javascript
createArrayType(promiseReturningFunction); // => FutureArrayConstructor
```

Produces a future array constructor. The parameters for the promiseReturningFunction can be passed into the constructor on instantiation.

###### ARGUMENTS

promiseReturningFunction ((...any[]) => Promise<any[]>): function that returns a promise that resolves to an array.

###### RETURNS

future array constructor (class FutureArrayCache): future array constructor

##### Basic Usage

```javascript
import { createArrayType } from 'react-future';

const fetchBlogs = count =>
  fetch(`/blogs?count=${count}`).then(res => res.json());
const FutrBlogs = createArrayType(fetchBlogs);
```

### FutureArrayCache

A `FutureArrayCache` constructor is returned from `createArrayType` and is used to instantiate future arrays. It consumes the promise from the promiseReturningFunction and caches the resultes using LRU.

#### constructor

```javascript
new FutureArrayCache(...argumentsOfPromiseReturningFunction); // => future array instance
```

###### ARGUMENTS

...argumentsOfPromiseReturningFunction (...any[]): arguments of the promiseReturningFunction which is passed into `createArrayType`

###### RETURNS

future array (intanceof `FutureArrayCache`): a future with the same interface as an array, except for added variants `immReverse`, `immCopyWithin`, `immSort`, `immFill`, and `immSplice`

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
- immReverse<br/>
- immCopyWithin<br/>
- immSort<br/>
- immFill<br/>
- immSplice<br/>
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

## Future Object

### createObjectType

```javascript
createObjectType(promiseReturningFunction); // => FutureArrayConstructor
```

Produces a future object constructor. The parameters for the promiseReturningFunction can be passed into the constructor on instantiation.

###### ARGUMENTS

promiseReturningFunction ((...any[]) => Promise\<object>): function that returns a promise that resolves to an object

###### RETURNS

future array constructor (class FutureArrayCache): future array constructor

##### Basic Usage

```javascript
import { createObjectType } from 'react-future';

const fetchUser = name => fetch(`/user?=${name}`).then(res => res.json());
const futureUser = createArrayType(fetchUser);
```

### FutureObjectCache

A `FutureObjectCache` constructor is returned from `createObjectType` and is used to instantiate future objects. It consumes the promise from the promiseReturningFunction and caches the resultes using LRU.

#### constructor

```javascript
new FutureObjectCache(...argumentsOfPromiseReturningFunction); // => future array instance
```

###### ARGUMENTS

...argumentsOfPromiseReturningFunction (...any[]): arguments of the promiseReturningFunction that is passed into `createObjectType`

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

These methods are invalid globally because their use cases are currently not well understood. We will enable these once we understand how these methods are used, for now please use the methods on the Object constructor.

<details><summary>List of immutable static</summary>
- is<br />
- create<br />
</details>

###### ARGUMENTS

fn ((obj: object) => object): Deferred callback. Accepts the resolved future object as a parameter. Return value must be an object.  
futureObj (instanceof FutureObjectCache): future object to apply the deferred callback to

###### RETURNS

future instance with deferred callback (instanceof FutureObjectCache): returns a future object instance with the deferred callback store

#### tap

Takes a mutable function and a future object instance. The mutable function must mutate the object and return it. The operation is deferred until after the promise has been resolved. Can be performed outside render but not in.

```javascript
FutureObjectCache.tap(fn, futureObj); // => future instance with deferred callback
```

###### ARGUMENTS

fn ((arr: any[]) => any[]): Deferred callback. Accepts the resolved future object as a parameter. Return value must be the same reference to the object that was passed in.  
futureObj (instanceof FutureObjectCache): future object to apply the deferred callback to

###### RETURNS

future instance with deferred callback (instanceof FutureObjectCache): returns the futureObj that was passed in with the deferred callback stored
