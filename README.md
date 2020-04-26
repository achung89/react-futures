# React Futures

Manipulate asynchronous data synchronously


## Table of contents

<ul>
  <li> <a href="#install"> Install</a> </li>
  <li> <a href="#explainer">Explainer</a></li>
  <li> <a href="#usage-constraints">Usage Constraints</a> </li>
  <li> <a href="#example-snippets">Example snippets </a>
    <ul>
      <li>
        <a href="#object-iteration">
        Object iteration
        </a>
      </li>
      <li>
        <a href="#suspense-operations-outside-render">
        Suspense operations outside render
        </a>
      </li>
      <li>
        <a href="#cache-invalidation">
        Cache invalidation
        </a>
      </li>
      <li>
        <a href="#fetching-on-component-mount">
          Fetching on component mount 
        </a>     
      </li>
      <li>
        <a href="#prefetching">
        Prefetching
        </a>
      </li>
      <li>
        <a href="#using-with-third-party-libraries-ramda-lodash-etc">Using with third party libraries (ramda, lodash, etc.)</a>
      </li>
      <li>
        <a href="#logging">Logging</a>
      </li>
    </ul>
    <li>
    <a href="#caveats">Caveats</a>
    <ul>
      <li>
        <a href="#operation-constraints">
          Operation Constraints
        </a>
      </li>
      <li>
        <a href="#lazyobject-and-lazyarray-in-reassignment">
          lazyObject and lazyArray reassignment
        </a>
      </li>
      </ul>
    </li>
      <li>
    <a href="API_REFERENCE.md">API Reference</a>
  </li>
  </li>

</ul>

## Install

This requires you to have React's experimental build installed:

```
#yarn
yarn add react@experimental react-dom@experimental

#npm
npm install react@experimental react-dom@experimental
```

To install this library:

```
#npm
npm i react-futures

#yarn
yarn add react-futures
```

## Explainer

React Futures is a collection of types that allow manipulation of asynchronous data in a synchronous manner. This happens by deferring the actual data processing until after the promise resolves and suspending only when necessary.

For example:

```javascript
import { futureArray } from 'react-futures';

const FutureBlogs = futureArray( user => fetch(`/blogs?user=${user}`).then(res => res.json()))

const Blogs = ({ user }) => {
  const blogs =  new FutureBlogs(user)// fetch here
                  .filter( blog => blog.tags.includes('sports')) // lazy
                  .slice(0,10) // lazy

  const featured = blogs[0] //suspend!

  return ...
}
```

React Futures follows the "wait-by-necessity" principle; it defers suspension until the code examines the content of the data. Only after suspense resolves are operations like `map`, `slice`, and `filter` applied. This simplifies data construction by hiding the data fetching logic.

When the requirements for data fetching increases, the benefits of React Futures become clearer. With React Futures the construction and consumption of the data is decoupled from the fetching of it, allowing for clearer separation of concerns.

### Async/Await vs React Futures

Here's an example of using async/await to display a list of active groups for a user:

```javascript
const ActiveGroups = () => {
  const [activeGroups, setActiveGroups] = useState([]);
  useEffect(() => {
    const getActiveGroups = async () => {

      // Example of a complex data-fetching requirement. We are getting active groups by
      // fetching the posts of each group and seeing if there are posts in the last three days
      let groups = await fetchGroupsBelongingToUser('Tom');
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
  }, []);

  return groups.length > 0 
    ? <>
        <ul>{groups.map(group => <li>{group.name}</li>)}</ul>
      </>
    : <div>Loading...</div>;
};
```

And here is the same example using React Futures:

```javascript
import { futureArray } from "react-futures";

const FutureGroups = futureArray(fetchGroupsBelongingToUser);
const FuturePosts = futureArray(fetchGroupPosts);

const activeGroups = new FutureGroups('Tom').filter(group => {
  const groupPosts = new FuturePosts(group); //fetch posts
  return groupPosts.some(post => post.daysAgoPosted < 3);
});

const ActiveGroups = () => {
  const [groups, setGroups] = useState(activeGroups);
  return <>
      <ul>
        {groups.map(group => <li>{group.name}</li>)}
      </ul>
    </>
};
```

This example demonstrates several benefits of React Futures:

- With React Futures asynchronicity is transparent; a future can be used the same way that a native object or array can be used. They can also be used in other future operations, see how `FuturePosts` is used in `filter` to collect `activeGroups`.
- With React Futures the manipulation and construction of asynchronous data can be done completely outside render if needed. None of the construction code needs to be located inside the component.

## Usage constraints

Certain operations are constrained inside or outside render. For example, suspense operations are allowed only in render.
Ex. 

```javascript
const blogs = FutureBlogs()

const first = blogs[0] // Error: suspense not allowed outside render

const App = () => {

  const first = blogs[0] // suspend!

  return ...
}

```

To accommodate this use case, React Futures provides utilities that can defer evaluation (see [Using React Futures with third party libraries](#using-with-third-party-libraries-ramda-lodash-etc) and [Suspense operations outside render](#suspense-operations-outside-render))

There are also constraints on mutable operations and certain operations are globally prohibited like `array.push` and `array.unshift`. To alleviate this, all future object constructor static methods have been made immutable. In v1 we will show descriptive error messages for these cases describing workarounds. 

For a complete overview of these constraints, see the Caveats section (TODO)

## Example snippets


### Object iteration

Object iteration with native types is normally done with `Object.entries` and `Object.fromEntries`, but `Object.entries` with a future will suspend, making iteration outside render impossible. To allow this, React Futures puts a deferred version of `entries` and `fromEntries` on the future object constructors.

```javascript
import { futureObject } from "react-futures";
const FutureUser = futureObject(() => fetch("/user").then(res => res.json()));

const user = new FutureUser();

const uppercaseUserEntries = FutureUser.entries(user) //lazy
                              .map(([key, value]) => ({ // lazy
                                [key]: value.toUpperCase(),
                              }));

const uppercaseUser = FutureUser.fromEntries(uppercaseUserEntries); // lazy
```
<br/>

All future object static methods are deferred, immutable variants of `Object` static methods, so they can used both in and out of render

### Suspense operations outside render

Sometimes it's useful to access properties on a future or perform a suspense operation outside of render. An example of this is transforming properties on a future. However, accessing a property will throw an error if done outside render.

```javascript
const dave = new FutureUser("Dave");

dave.props = dave.props // Error: suspense operations not allowed outside render
              .sort((a, b) => a - b);
```

To achieve this, use the `lazyArray` or `lazyObject` to suspend evaluation.

```javascript
import { futureObject, lazyArray } from "react-futures";

const FutureUser = futureObject(fetchUser);
const dave = new FutureUser("Dave");

dave.props = lazyArray(() => dave.props) //=> future array
              .sort((a, b) => a - b); // lazy
```

The above snippet suspends evaluation of the `dave.props` getter until a suspense operation is performed on `dave.props` inside render. `lazyArray` returns a future array and an `lazyObject` returns a future object.

Sometimes performing a suspense operation is inside an `on` handler is desired, but suspense operations are illegal in `on` handlers as well.

```javascript
const dave = new FutureUser("Dave");

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
const dave = new FutureUser('Dave');

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
import { getRaw } from 'react-futures';

const dave = new FutureUser('Dave');

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
<br/>

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
import {lazyObject, futureObject} from 'react-futures'

const FutureUser = futureObject(...);

const dave = new FutureUser('Dave');

const daveTwin = lazyObject(() => _.cloneDeep(dave)) //=> future object

// continue iterating as you would a future
const result = FutureUser.entries(daveTwin) 
                       .map(...)
```

`lazyObject` defers the evaluation of the object returning operation until a suspense operation takes place.

`lazyArray` works the same way for arrays

```javascript
import { lazyArray, futureArray } from 'react-futures'
import { zip } from 'ramda'

const FutureFriends = futureArray(...)
const FutureGroups = futureArray(...)

const [friends, groups] = [new FutureFriends, new FutureGroups];

const friendsAndGroups = lazyArray(() => zip(friends, groups)) //=> future array
```

To defer function composition, you can use ramda's pipeWith or composeWith to wrap callbacks in `lazyObject` and `lazyArray`

```javascript
import { pipeWith, filter, sort } from 'ramda';
import { futureArray, lazyArray } from 'react-futures';

const FutureFriends = futureArray(() => fetch(...))

const pipeFuture = pipeWith((fn, futr) => lazyArray(() => fn(futr)))

const lazyInternationalFriendsByGrade = pipeFuture(
  filter(friend => friend.nationality !== 'USA'),
  sort(function(a, b) { return a.grade - b.grade; })
)

const internationalFriendsByGrade = lazyInternationalFriendsByGrade( new FutureFriends() ) // => future array

```
<br/>

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
const dave = new FutureUser("Dave"); // fetches;

const App = () => {
  let dave = new FutureUser("Dave"); // pulls from cache

  FutureUser.invalidate("Dave"); // deletes 'Dave' from cache

  dave = new FutureUser("Dave"); // fetches
};
```

Sometimes it's useful to clear the entire cache, like on a page refresh. This can be accomplished using the static method `reset` on the future constructor

```javascript
const dave = new FutureUser("Dave");
const jen = new FutureUser("Jen");
const harold = new FutureUser("Harold");
const App = () => {
  useEffect(() => {
    return () => FutureUser.reset(); // clears 'Harold', 'Jen', and 'Dave' from cache
  }, []);
};
```
<br/>

### Fetching on component mount

Sometimes it's desirable to fetch whenever a component is mounted, similar to how you would in the good old days with fetch and componentDidMount. To achieve this with futures, use `useEffect` to invalidate the cache on unmount.

```javascript
const useUser = name => {
  const user = new FutureUser(name); // fetches on first render
  useEffect(() => {
    return () => FutureUser.invalidate(name) // invalidates fetch
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
<br/>

### Prefetching

One of the focuses of suspense and concurrent mode is 'prefetching' which is fetching data way before we need it. This is great for performance as it shortens the percieved wait time of fetched data.

There is no explicit "prefetch" api in React Futures, fetching occurs whenever a future is instantiated. To prefetch simply instantiate the future outside of render or within a parent component.

```javascript

const user = new FutureUser('Dave') // instantiating outside of render will prefetch 'user' as file parses

const App = () => {
  const friends = new FutureFriends('Dave') // prefetch in parent component
  const family = new FutureFamily('Dave') // prefetch in parent component
  const currentPage = usePageNavigation()
  return <>
    {
      currentPage === 'family' ? <Family family={family} /> : // 'family' suspended by <Family />
      currentPage === 'friends' ? <Friends friends={friends}> : null // 'friends' suspended by <Friends />
    }
  </>
}
```

### Logging

`console.log` with a future will log a proxy, to log the contents of the future use either `toPromise` or `getRaw`.

```javascript
import { getRaw, toPromise } from 'react-futures';
...

toPromise(future)
  .then(console.log)


const App = () => {
  console.log(getRaw(future)); 
  return <div></div>
}

```

If future has any nested futures, those will not be visible with `toPromise` or `getRaw`. In this case use the following snippets for `getRawDeep`

```javascript
import {isFuture, getRaw} from 'react-futures';

const getRawDeep = future => {
  if(isFuture(future)) {
    const raw = getRaw(future);
    return getRawDeep(raw);
  }
  if(Array.isArray(future)) {
    return future.map(getRawDeep);
  } else if(typeof future === 'object' && future !== null) {
    return Object.fromEntries(
            Object.entries(future).map(([key, value]) => [key, getRawDeep(value)])
          )
  }
  return future;
}
```
### Using with graphql

Coming soon...
<br />
<br />

## Caveats

### Operation constraints
As a rule of thumb, mutable operations are constrained to outside render and suspense operations are constrained to inside render. For suspense operation workarounds see [Suspense operations outside render](#suspense-operations-outside-render) and [Using React Futures with third party libraries](#using-with-third-party-libraries-ramda-lodash-etc). 

Consider moving mutable operations outside render or using an immutable variant instead. All future object constructor static method have been converted to be immutable and lazy.  

Certain operations are forbidden globally since they are both mutable and they inspect the contents of the array. `array.push` is mutable, for example, prohibiting it from being used in render, and it returns the length of the array, requiring knowledge of the array which prohibits use outside render. 

Some other operations are globally forbidden because it is uncertain what the use cases are for these methods vs. `Object` static methods. Click below for a complete list
<details><summary>Complete restriction reference</summary>
<p>
<br />
    <i>FutureObjectConstructor represents the class returned by `futureObject`</i>
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
  Object.defineProperties(future)<br />
  Object.defineProperty(future)<br />
  Object.setPrototypeOf(future)<br />
  

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
  FutueObjectConstructor.getOwnPropertyDescriptor(future)<br />
  FutueObjectConstructor.getOwnPropertyDescriptors(future)<br />
  FutueObjectConstructor.getOwnPropertyNames(future)<br />
  FutueObjectConstructor.getOwnPropertySymbols(future)<br />
  FutueObjectConstructor.getPrototypeOf(future)<br />
  FutueObjectConstructor.keys(future)<br />
  FutueObjectConstructor.entries(future)<br />
  FutueObjectConstructor.values(future)<br />
  FutureObjectConstructor.assign(future, ...rest)<br />
  FutureObjectConstructor.assign(obj, future, ...rest)<br />
  FutureObjectConstructor.seal(future)<br />
  FutureObjectConstructor.preventExtensions(future)<br />
  FutureObjectConstructor.defineProperties(future, descriptors)<br />
  FutureObjectConstructor.defineProperty(future, prop, descriptor)<br />
  FutureObjectConstructor.freeze(future)<br />
  FutureObjectConstructor.setPrototypeOf(future)<br />

</ul>

<ul>
  <h3>
    Invalid methods: disallowed globally (if you feel strongly that these shouldn't error, please submit an issue explaining your use case)
  </h3> 
  FutureObjectConstructor.create &nbsp;&nbsp; # not sure how this should differ from behavior of Object.create<br />
  FutureObjectConstructor.is  &nbsp;&nbsp; #should this compare future wrapper or raw value? If future wrapper, what would be the difference between this and `Object.is`?<br />
  futureArray.push &nbsp;&nbsp;# both mutable and requires knowledge of array<br /> 
  futureArray.pop &nbsp;&nbsp;# both mutable and requires knowledge of array<br />
  futureArray.shift &nbsp;&nbsp;# both mutable and requires knowledge of array<br />
  futureArray.unshift &nbsp;&nbsp;# both mutable and requires knowledge of array<br />
  delete futureObject &nbsp;&nbsp;# both mutable and requires knowledge of object, since it returns true or false depending on whether operation succeeded<br />
  Object.preventExtensions(future) &nbsp;&nbsp;# Causes problems in proxy<br />

</ul>

</p>
</details>

### lazyObject and lazyArray in reassignment

Using lazyObject and lazyArray to perform a reassignment inside a loop can lead to an obscure bug.  

```javascript
let arr = [];
for(const futureItem of items) {
  arr = lazyArray(() => [...arr, ...futureItem]) // leads to infinite getter loop on suspense
}
```

encapsulate the whole assignment in a block instead
```javascript
let arr = lazyArray(() => {
  let temp = []
  for(const futureItem of items) {
    temp = [...temp, ...futureItem] // leads to infinite getter loop on suspense
  }
  return temp;
})


```


## API Reference

[The API reference is in another castle](API_REFERENCE.md)