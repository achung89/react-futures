# React Futures

Manipulate asynchronous data synchronously


## Table of contents

<ul>
  <li> Install </li>
  <li> Explainer</li>
  <li> Restrictions </li>
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
        <a href="#prefetching">
          Fetching on component mount 
        </a>     
      </li>
      <li>
        <a href="">
        Prefetching
        </a>
      </li>
      <li>
        <a href="#using-with-third-party-libraries-ramda-lodash-etc">Using with third party libraries (ramda, lodash, etc.)</a>
      </li>
    </ul>
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

const FutureBlogs = futureArray(user => fetch(`/blogs?user=${user}`).then(res => res.json()))

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

## Restriction on suspense operations

Suspense operations are disallowed outside render

Ex.

```javascript
const blogs = FutureBlogs()

const first = blogs[0] // Error: suspense not allowed outside render

const App = () => {

  const first = blogs[0] // suspend!

  return ...
}

```

To accomodate this use cases, React Futures provides utilities that can defer evaluation (see [Using React Futures with third party libraries](#using-with-third-party-libraries-ramda-lodash-etc) and [Suspense operations outside render](#suspense-operations-outside-render))

There are also operations that are globally prohibited like `array.push` and `array.shift`, click below for a full list of restrictions

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
  FutureObjectConstructor.create <br />
  FutureObjectConstructor.is<br />
  futureArray.push<br />
  futureArray.pop<br />
  futureArray.shift<br />
  futureArray.immUnshift<br />
  delete futureObject<br />
</ul>

</p>
</details>

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

### Using with graphql

Coming soon...
<br />
<br />