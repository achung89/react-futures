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

### Future Array

#### createArrayType

```javascript
createArrayType( promiseReturningFunction ) // => FutureArrayConstructor
```

Produces a future array constructor. The parameters for the promiseReturningFunction can be passed into the constructor on instantiation.  

##### Arguments
promiseReturningFunction  ((val: any) => Promise<any[]>): function that returns a promise that resolves to an array.
##### Returns
future array constructor (class FutureA65rrayCache): future array constructor
##### Basic Usage
```javascript
import {createArrayType} from 'react-future';

const fetchBlogs = ({ count }) => fetch(`/blogs?count=${count}`).then(res => res.json())
const FutrBlogs = createArrayType(fetchBlogs)
```
