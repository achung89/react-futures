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
React Futures is a collection of datatypes that defer data manipulation and suspends when the data is consumed.  

Ex.
```javascript
import { createArrayType } from 'react-futures';

const FutureBlogs = createArrayType(user => fetch(`/blogs?user=${user}`)

const Blogs = ({ user }) => {
  const blogs = new FutureBlogs(user) // prefetches here
                  .filter( blog => blog.tags.includes('sports')) // deferred
                  .slice(0,10) // deferred

  const featured = blogs[0] //suspend!

  return ...
}
```

 React Futures follows the "wait-by-necessity" principle, meaning it defers suspension until the content of the data is being examined. Only after the suspense is resolved are operations like `map`, `slice`, and `filter` applied. This simplifies data construction by making data fetching transparent to the developer.  

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
  const [friends, setFriends] = useState([])
  const [sharedGroups, setSharedGroups] = useState([])
  const [user, setUser] = useState({})

  const profile = {
        user,
        friends,
        sharedGroups
  }
  useEffect(() => {
    const getAllData = async () => {
      const user = await fetch(`/user?name${userName}`).then(toJSON)
      const friends = await fetch(`/${userName}/friends`).then(toJSON)
      const groups = await  fetch(`/${userName}/groups`).then(toJSON)
      const friendsGroups = (await Promise.all(friends.map(getGroup)))
                            .flat()
                            .map(group => group.name)

      const sharedGroups = groups.filter( group => friendsGroups.includes(group.name))
      setUser(user)
      setFriends(friends)
      setSharedGroups(sharedGroups)
    }
    getAllData()
  }, [])
  
  return ...
}

```

This example demonstrates several benefits of React Futures:

- With React Futures asynchronicity is transparent; you can use a future as you would a normal object or an array. 
- Futures allows the code that manipulates and constructs the data to be separated from the code that fetches it.  
- React Futures can be used within the callbacks of other future data operations (see above where `FutureGroups` is used within the callback of `flatMap`)
- With React Futures the manipulation and construction of asynchronous data can be done **outside of render**, something not possible with other implementations of suspense.


## Restrictions

To achieve transparency, React Futures places restrictions on certain type of operations: mutable operations are prohibited inside of render and suspend operations are prohibited outside of render. 

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

for mutable methods like `array.sort` and `array.reverse`, React Futures provides immutable variants like `array.immSort` and `array.immReverse`

There are also operations that are prohibited globally like `array.push` and `array.shift`, a full list of these restrictions are listed below 

## ADD CHART HERE

## API Reference

## Future Array

### createArrayType

```javascript
createArrayType( promiseReturningFunction ) // => FutureArrayConstructor
```

Produces a future array constructor. The parameters for the promiseReturningFunction can be passed into the constructor on instantiation.  

##### Arguments
promiseReturningFunction  ((...any[]) => Promise<any[]>): function that returns a promise that resolves to an array.
##### Returns
future array constructor (class FutureArrayCache): future array constructor
##### Basic Usage
```javascript
import {createArrayType} from 'react-future';

const fetchBlogs = ({ count }) => fetch(`/blogs?count=${count}`).then(res => res.json())
const FutrBlogs = createArrayType(fetchBlogs)
```

### FutureArrayCache

A `FutureArrayCache` constructor is returned from `createArrayType` and is used to instantiate future arrays. It consumes the promise from the promiseReturningFunction and caches the resultes using LRU.

#### constructor

```javascript
new FutureArrayCache(...argumentsOfPromiseReturningFunction) // => future array instance
```

##### Arguments
...argumentsOfPromiseReturningFunction (...any[]): arguments that are passed to the promiseReturningFunction above

##### Returns
future array (intanceof `FutureArrayCache`): a future with the same interface as an array, except for added variants `immReverse`, `immCopyWithin`, `immSort`, `immFill`, and `immSplice`


#### Instance methods
Future arrays share the same methods as host arrays, with the exception of added immutable variants of methods (`immReverse`, `immCopyWithin`, `immSort`, `immFill`, and `immSplice`)

##### Immutable instance methods
Immutable methods will defer operations both inside and outside render. The methods include all immutable methods of array including additional immutable variants of methods (`immReverse`, `immCopyWithin`, `immSort`, `immFill`, and `immSplice`)

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
Mutable instance methods will defer operations outside render and throw a `MutableOperationError` inside render. The error is thrown because any mutable operation inside render is likely to result in bugs since it mutates the array at every re-renders. TODO: for more info link
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
FutureArrayCache.of(...argumentsOfPromiseReturningFunction) // => future array instance
```

##### map
Takes an immutable function and and a future array instance as parameters. The immutable function is deferred until after the promise is resolved. The immutable function must return an array. Can be performed inside and outside render.
```javascript
  FutureArrayCache.map(fn, futureArray) // => future instance with deferred function operation
```

##### Arguments
fn ((arr: any[]) => any[]): Deferred callback. Accepts the resolved future array as a parameter. Return value must be an array.  
futureArray (instanceof FutureArrayCache): future array to apply the deferred callback to
##### Returns
future instance with deferred callback (instanceof FutureArrayCache): returns a future array instance with the deferred callback store

#### tap
Takes a mutable function and an future array instance. The mutable function must mutate the array and return it. The operation is deferred until after the promise has been resolved. Can be performed outside render but not in.
```javascript
  FutureArrayCache.tap(fn, futureArray) // => future instance with deferred callback
```

##### Arguments
fn ((arr: any[]) => any[]): Deferred callback. Accepts the resolved future array as a parameter. Return value must be the same reference to the array that was passed in.  
futureArray (instanceof FutureArrayCache): future array to apply the deferred callback to
##### Returns
future instance with deferred callback (instanceof FutureArrayCache): returns a future array instance with the deferred callback store


