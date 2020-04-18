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

React Futures is a collection of types that allow syncronous-looking data manipulation of asynchronous data by suspending only when needed and deferring data manipulation until after the promise resolves.

Ex.

```javascript
import { arrayType } from 'react-futures';

const FutureBlogs = arrayType(user => fetch(`/blogs?user=${user}`).then(res => res.json()))

const Blogs = ({ user }) => {
  const blogs =  new FutureBlogs(user)// fetch here
                  .filter( blog => blog.tags.includes('sports')) // lazy
                  .slice(0,10) // lazy

  const featured = blogs[0] //suspend!

  return ...
}
```

React Futures follows the "wait-by-necessity" principle; it defers suspension until the code examines the content of the data. Only after suspense resolves are operations like `map`, `slice`, and `filter` applied. This simplifies data construction by hiding data fetching implementation.

When the requirements for data-fetching increases, the benefits of React Futures become clearer. With React Futures the construction and consumption of the data is decoupled from the fetching of it, allowing for clear separation of concerns.

### Separating fetching and construction from render

```javascript
// With React Futures
import { arrayType, objectType, lazyArray } from "react-futures";

const FutrUser = objectType(fetchUser);
const FutrGroups = arrayType(fetchGroupsBelongingToUser);
const FutrPosts = arrayType(fetchGroupPosts);

const user = new FutrUser("Tom");

// Example of a complex data-fetching requirement. We are getting active groups by
// fetching the posts of each group and seeing if there are posts in the last three days
const activeGroups = new FutrGroups(user).filter(group => {
  const groupPosts = new FutrPosts(group); //fetch posts
  return groupPosts.some(post => post.daysAgoPosted < 3);
});

const App = () => {
  return (
    <>
      <h3>
        {user.firstName} {user.lastName}
      </h3>
      <ActiveGroups />
    </>
  );
};

const ActiveGroups = () => {
  const [groups, setGroups] = useState(activeGroups);
  return (
    <>
      <ul>
        {groups.map(group => (
          <li>{group.name}</liu>
        ))}
      </ul>
      <AddGroup
        onClick={name => {
          // spread operator is a getter, so it'll suspend a future. To avoid this use `lazyArray`
          const newGroups = lazyArray(() => [{ name }, ...groups]); 
          setCloseFriends(newGroups);
        }}
      >
        Add Group
      </AddGroup>
    </>
  );
};



// With async await
const App = () => {
  const [user, setUser] = useState({});

  useEffect(() => {
    const getUser = async () => {
      const user = await fetchUser("Tom");
      setUser(user);
    };
    getUser();
  }, []);

  return JSON.stringify(user) === "{}" ? (
    <div>Loading...</div>
  ) : (
    <>
      <h3>
        {user.firstName} {user.lastName}
      </h3>
      <CloseFriends user={user} />
      <ActiveGroups user={user} />
    </>
  );
};

const ActiveGroups = ({ user }) => {
  const [activeGroups, setActiveGroups] = useState([]);
  useEffect(() => {
    const getActiveGroups = async () => {
      let groups = await fetchGroupsBelongingToUser(user);
      const groupPosts = await Promise.all(groups.map(fetchGroupPosts));
      groups = groups.filter((group, index) => {
        const wasPostedOnRecently = groupPosts[index].some(
          post => post.daysAgoPosted < 3
        );
        return wasPostedOnRecently;
      });

      setActiveGroups(groups);
    };
    getActiveGroups();
  });

  return groups.length > 0 ? (
    <>
      <div>
        {groups.map(group => (
          <div>{group.name}</div>
        ))}
      </div>
      <AddGroup
        onClick={name => {
          const newGroups = [{ name }, ...groups];
          setCloseFriends(newGroups);
        }}
      >
        Add Group
      </AddGroup>
    </>
  ) : (
    <div>Loading...</div>
  );
};
```

This example demonstrates several benefits of React Futures:

- With React Futures asynchronicity is transparent; a future can be used the same way that a native object or array can be used. They can also be used in other future operations, see how `FutrPosts` is used in `filter` in collecting `activeGroups`.
- With React Futures the manipulation and construction of asynchronous data can be done completely outside render if needed. None of the construction code needs to be located inside the component, clearing up the code.

## Restrictions

To achieve transparency, React Futures places restrictions on certain operations: mutable operations are disallowed inside render and suspend operations are disallowed outside render.

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

To accomodate these use cases, React Futures provides helper functions. For mutable methods like `array.sort` and `array.reverse`, immutable variants like `array.immSort` and `array.immReverse` are provided on futures. For suspense operations, React Futures provides utilities that can defer evaluation (see [Using React Futures with third party libraries](#using-with-third-party-libraries-ramda-lodash-etc) and [Suspense operations outside render](#suspense-operations-outside-render))

There are also operations that are globally prohibited like `array.push` and `array.shift`, click below for a full list of restrictions

<details><summary>Complete restriction reference</summary>
<p>
<br />
    <i>FutureObjectConstructor represents the class returned by `objectType`</i>
<ul>
  <h3>Suspend methods: disallowed outside render</h3>
  futureArray.indexOf()<br />
  futureArray.includes()<br />
  futureArray.join()<br />
  futureArray.lastIndexOf()<br />
  futureArray.toString()<br />
  futureArray.toLocaleString()<br />
  futureArray.forEach()<br />
  futureArray.find()<br />
  futureArray.every()<br />
  futureArray.some()<br />
  futureArray.findIndex()<br />
  Object.assign(object, futureObject)<br />
  Object.getOwnPropertyDescriptors(future, ...rest)<br />
  Object.getOwnPropertyNames(future)<br />
  Object.getOwnPropertySymbols(future)<br />
  Object.isExtensible(future)<br />
  Object.isFrozen(future)<br />
  Object.isSealed(future)<br />
  Object.keys(future)<br />
  Object.entries(future)<br />
  Object.values(future)<br />
  Object.getPrototypeOf(future)<br />
  FutureObjectConstructor.isExtensible(future)<br />
  FutureObjectConstructor.isFrozen(future)<br />
  FutureObjectConstructor.isSealed(future)<br />
</ul>
<ul>
  <h3>Mutable methods: disallowed inside render</h3>
  futureArray.splice()<br />
  futureArray.copyWithin()<br />
  futureArray.sort()<br />
  futureArray.unshift()<br />
  futureArray.reverse()<br />
  futureArray.fill()<br />
  Object.preventExtensions(future)<br />
  Object.defineProperties(future)<br />
  Object.defineProperty(future)<br />
  Object.setPrototypeOf(future)<br />
  FurtureObjectConstructor.assign(future, ...reset)<br />
  FurtureObjectConstructor.seal(future)<br />
  FurtureObjectConstructor.preventExtensions(future)<br />
  FurtureObjectConstructor.defineProperties(future, descriptors)<br />
  FurtureObjectConstructor.defineProperty(future, prop, descriptor)<br />
  FurtureObjectConstructor.freeze(future)<br />
  FurtureObjectConstructor.setPrototypeOf(future)<br />
</ul>
<ul>
  <h3>
    Immutable methods: allowed anywhere
  </h3>
  futureArray.concat()<br />
  futureArray.filter()<br />
  futureArray.slice()<br />
  futureArray.map()<br />
  futureArray.reduce()<br />
  futureArray.reduceRight()<br />
  futureArray.flat()<br />
  futureArray.flatMap()<br />
  futureArray.immReverse()<br />
  futureArray.immCopyWithin()<br />
  futureArray.immSort()<br />
  futureArray.immFill()<br />
  futureArray.immSplice()<br />
  FutueObjectConstructor.getOwnPropertyDescriptor(future)<br />
  FutueObjectConstructor.getOwnPropertyDescriptors(future)<br />
  FutueObjectConstructor.getOwnPropertyNames(future)<br />
  FutueObjectConstructor.getOwnPropertySymbols(future)<br />
  FutueObjectConstructor.getPrototypeOf(future)<br />
  FutueObjectConstructor.keys(future)<br />
  FutueObjectConstructor.entries(future)<br />
  FutueObjectConstructor.values(future)<br />

</ul>

<ul>
  <h3>
    Invalid methods: disallowed globally (if you feel strongly that these shouldn't error, please submit an issue explaining your use case)
  </h3> 
  FutureObjectConstructor.create 
  FutureObjectConstructor.is
  futureArray.push
  futureArray.pop
  futureArray.shift
  futureArray.immUnshift
  delete futureObject
</ul>

</p>
</details>

## Example snippets

### Object iteration

Object iteration with native types is normally done with `Object.entries` and `Object.fromEntries`, but `Object.entries` with a future will suspend, making iteration outside render impossible. To allow this, React Futures puts a deferred version of `entries` and `fromEntries` on the future object constructors.

```javascript
import { objectType } from "react-futures";
const FutrUser = objectType(() => fetch("/user").then(res => res.json()));

const user = new FutrUser();

const uppercaseUserEntries = FutrUser.entries(user) //lazy
                              .map(([key, value]) => ({ // lazy
                                [key]: value.toUpperCase(),
                              }));

const uppercaseUser = FutrUser.fromEntries(uppercaseUserEntries); // lazy
```

### Suspense operations outside render

Sometimes it's useful to access properties on a future or perform a suspense operation outside of render. An example of this is transforming properties on a future. However, accessing a property will throw an error if done outside render.

```javascript
const dave = new FutrUser("Dave");

dave.props = dave.props // Error: suspense operations not allowed outside render
              .sort((a, b) => a - b);
```

To achieve this, use the `lazyArray` or `lazyObject` to suspend evaluation.

```javascript
import { objectType, lazyArray } from "react-futures";

const FutrUser = objectType(fetchUser);
const dave = new FutrUser("Dave");

dave.props = lazyArray(() => dave.props) //=> future array
              .sort((a, b) => a - b); // lazy
```

The above snippet suspends evaluation of the `dave.props` getter until a suspense operation is performed on `dave.props` inside render. `lazyArray` returns a future array and an `lazyObject` returns a future object.

Sometimes performing a suspense operation is inside an `on` handler is desired, but suspense operations are illegal in `on` handlers as well.

```javascript
const dave = new FutrUser("Dave");

const App = () => {
  const [user, setUser] = useState(dave);
  return (
    <>
      <input
        type="text"
        onChange={e => {
          setUser({ ...user, name: e.target.value }); // spread operator on `user` errors since spreading is a suspense operation
        }}
      />
    </>
  );
};
```

To accomplish this, we can use the `lazyObject` from above, or we can use the `getRaw` function.

```javascript
// Using `lazyObject`
const dave = new FutrUser('Dave');

const App = () => {
  const [user, setUser] = useState(dave)

  return <>
  <input type="text" onChange={e => {
    const newUser = lazyObject(() => ({...user, name: e.target.value}))) //=> future object
    setUser(newUser)
  }} />
  </>
}



// Using `getRaw`
import {getRaw} from 'react-futures';
const dave = new FutrUser('Dave');

const App = () => {
  const [user, setUser] = useState(getRaw(dave)) // suspends here and gets raw value

  return <>
  <input type="text" onChange={e => {
    const newUser = {...user, name: e.target.value} // can spread, since it's just a normal object
    setUser(newUser)
  }} />
  </>
}

```

### Using with third party libraries (ramda, lodash, etc.)

Third party libraries that inspect the contents of input parameters will suspend if passed in a future. To prevent this use `lazyArr` and `lazyObj`. These methods lazyily evaluate array and object returning functions respectively.

Lets take a look at an example using lodash's `_.cloneDeep`. If you pass a future in the function, it would suspend since `_.cloneDeep` iterates through the properties of the future.

```javascript
const dave = new FutureUser("Dave");

const daveTwin = _.cloneDeep(dave); // Error: can not suspend outside render
```

To allow this, use the `lazyObj` to defer evaluation of `_.cloneDeep`

```javascript
import _ from 'lodash'
import {lazyObject, objectType} from 'react-futures'

const FutrUser = objectType(...);

const dave = new FutureUser('Dave');

const daveTwin = lazyObject(() => _.cloneDeep(dave)) //=> future object

// continue iterating as you would a future
const result = FutrUser.entries(daveTwin) 
                       .map(...)
```

`lazyObject` defers the evaluation of the object returning operation until a suspense operation takes place.

`lazyArray` works the same way for arrays

```javascript
import { lazyArray, arrayType } from 'react-futures'
import { zip } from 'lamda'

const FutrFriends = arrayType(...)
const FutrGroups = arrayType(...)

const [friends, groups] = [new FutrFriends, new FutrGroups];

const friendsAndGroups = lazyArray(() => zip(friends, groups)) //=> future array
```

To defer function composition, you can use ramda's pipeWith or composeWith to wrap callbacks in `lazyObject` and `lazyArray`

```javascript
import { pipeWith, filter, sort } from 'ramda';
import { createArrayType, lazyArray } from 'react-futures';

const FutrFriends = createArrayType(() => fetch(...))

const pipeFuture = pipeWith((fn, futr) => lazyArray(() => fn(futr)))

const lazyInternationalFriendsByGrade = pipeFuture(
  filter(friend => friend.nationality !== 'USA'),
  sort(function(a, b) { return a.grade - b.grade; })
)

const internationalFriendsByGrade = lazyInternationalFriendsByGrade( new FutrFriends() ) // => future array

```

### Cache invalidation

React Futures use values passed into a future constructor as keys for an in-memory cache, so multiple instantiations with the same constructor will pull from the cache

```javascript
const dave = new FutureUser("Dave"); // fetches
const jen = new FutureUser("Jen"); // fetches

const App = () => {
  const dave = new Future("Dave"); // pulls from cache
  const jen = new Future("Jen"); // pulls from cache
  const harold = new Future("Harold"); // fetches
};
```

Since caching is performed using LRU, invalidation is done automatically after the cache reaches a certain size and the key hasn't been used in a while.

To manually invalidate a key, you can use the static method `invalidate` on the future constructor.

```javascript
const dave = new FutrUser("Dave"); // fetches;

const App = () => {
  let dave = new FutrUser("Dave"); // pulls from cache

  FutureUser.invalidate("Dave"); // deletes 'Dave' from cache

  dave = new FutrUser("Dave"); // fetches
};
```

Sometimes it's useful to clear the entire cache, like on a page refresh. This can be accomplished using the static method `reset` on the future constructor

```javascript
const dave = new FutrUser("Dave");
const jen = new FutrUser("Jen");
const harold = new FutrUser("Harold");
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

const user = new FutrUser('Dave') // instantiating outside of render will prefetch 'user' as file parses

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

### Using with graphql

Coming soon...
<br />
<br />

## API Reference

## Future Array

<hr>

### arrayType

```javascript
arrayType(promiseReturningFunction); // => FutureArrayConstructor
```

Produces a future array constructor. The parameters for the promiseReturningFunction can be passed into the constructor on instantiation.

###### ARGUMENTS

promiseReturningFunction ((...any[]) => Promise<any[]>): function that returns a promise that resolves to an array.

###### RETURNS

future array constructor (class FutureArrayCache): future array constructor

##### Basic Usage

```javascript
import { arrayType } from "react-future";

const fetchBlogs = count =>
  fetch(`/blogs?count=${count}`).then(res => res.json());
const FutrBlogs = arrayType(fetchBlogs);
```

<hr />

### FutureArrayCache

A `FutureArrayCache` constructor is returned from `arrayType` and is used to instantiate future arrays. It consumes the promise from the promiseReturningFunction and caches the resultes using LRU.
<br />
<br />

#### constructor

```javascript
new FutureArrayCache(...argumentsOfPromiseReturningFunction); // => future array instance
```

###### ARGUMENTS

...argumentsOfPromiseReturningFunction (...any[]): arguments of the promiseReturningFunction which is passed into `arrayType`

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

<br />

## Future Object

<hr />

### objectType

```javascript
objectType(promiseReturningFunction); // => FutureArrayConstructor
```

Produces a future object constructor. The parameters for the promiseReturningFunction can be passed into the constructor on instantiation.

###### ARGUMENTS

promiseReturningFunction ((...any[]) => Promise\<object>): function that returns a promise that resolves to an object

###### RETURNS

future array constructor (class FutureArrayCache): future array constructor

##### Basic Usage

```javascript
import { objectType } from "react-future";

const fetchUser = name => fetch(`/user?=${name}`).then(res => res.json());
const futureUser = arrayType(fetchUser);
```

<hr />

### FutureObjectCache

A `FutureObjectCache` constructor is returned from `objectType` and is used to instantiate future objects. It consumes the promise from the promiseReturningFunction and caches the resultes using LRU.

#### constructor

```javascript
new FutureObjectCache(...argumentsOfPromiseReturningFunction); // => future array instance
```

###### ARGUMENTS

...argumentsOfPromiseReturningFunction (...any[]): arguments of the promiseReturningFunction that is passed into `objectType`

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
fmapArr(arrayReturningFunction); // => lazyArrayReturningImmutableFunction
```

###### ARGUMENTS

arrayReturningFunction ((...any[]) => any[]): lazy callback, requires array as return value

###### RETURNS

future array (insanceof LazyArray): future array result of callback

##### Basic usage

```javascript
// `values` takes an object and returns an array of property values.
import { values } from 'ramda'
import { objectType, lazyArray } from 'react-futures'

const FutrUser = objectType(...);
const user = new FutrUser();

const userProps = lazyValues(() => values(user)); //=> future array
```

```javascript
import { filter } from 'ramda'
import { arrayType, fmapArr } from 'react-futures'
const FutrFriends = arrayType(...);
const FutrCircles = arrayType(...);

const lazyFilter = fmapArr(filter);
const friends = new FutrFriends();

const highSchoolFriends = lazyFilter(({age}) => age > 28, friends); //=> future array
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
import { objectType, lazyObject } from 'react-futures'

const FutrUser = objectType(...);
const user = new FutrUser();


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
const dave = new FutrUser('Dave');

const App = () => {
  const rawDave = getRaw(dave) // suspends here and gets raw value

  return <>
    {rawDave.name}
  </>
}

```