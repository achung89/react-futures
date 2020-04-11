# React Futures

Manipulate asynchronous data synchronously

## How to install
```
#npm
npm i react-futures

#yarn
yarn add react-futures
```

## Explainer
React Futures is a collection of datatypes that focuses on deferring data manipulation and suspending when the data is consumed.  

Ex.
```javascript
import { createFutureArrayConstructor } from 'react-futures';

const FutureBlogs = createFutureArrayConstructor(user => fetch(`/blogs?user=${user}`))

const Blogs = ({ user }) => {
  const blogs = new FutureBlogs(user) // prefetches here
                  .sort((a, b) => a.timestamp - b.timestamp) //deferred
                  .slice(0,10) // deferred

  const featured = blogs[0] //suspend!
  
  return ...
}
```

 React Futures follows the "wait-by-necessity" principle, meaning it defers suspension until the content of the data is being examined. Only after the suspense is resolved are operations like `map`, `slice`, and `filter` applied. This simplifies data construction by making data fetching transparent to the developer.  

When the requirements for data-fetching increases, the benefits of React Futures become clearer.

```javascript
// With React Futures
import { createFutureArrayConstructor, createFutureObjectConstructor } from 'react-futures';

const toJSON = res => res.json()
const FutrFriends = createFutureArrayConstructor(user => fetch(`/${user}/friends`).then(toJSON));
const FutrGroups = createFutureArrayConstructor(user => fetch(`/${user}/groups`).then(toJSON));
const FutrUser = createFutureObjectConstructor(user => fetch(`/user?name=${user}`).then(toJSON));

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

const toJSON = res => res.json();

const App = () => {
  const [friends, setFriends] = useState([]);
  const [sharedGroups, setSharedGroups] = useState([]); 
  const [user, setUser] = useState({});

  const profile = {
        user,
        friends,
        sharedGroups
  }
  useEffect(() => {
    const getAllData = async () => {
      const user = await fetch(`/user?name${userName}`).then(toJSON);
      const friends = await fetch(`/${userName}/friends`).then(toJSON);
      const groups = await  fetch(`/${userName}/groups`).then(toJSON);
      const friendsGroups = (await Promise.all(friends.map(getGroup)))
                            .flat()
                            .map(group => group.name)

      const sharedGroups = groups.filter( group => friendsGroups.includes(group.name));
      setFriends(friends);
      setSharedGroups(sharedGroups);
    }
    getAllData();
  }, [])
  
  return ...
}

```

This example demonstrates several benefits of React Futures:

- Futures allows the code that manipulates and constructs the data to be separated from the code that fetches it.  
- React Futures can be used within the callbacks of other future data operations (see above where `FutureGroups` is used in `flatMap`)
- With React Futures the manipulation and construction of asynchronous data can be done **outside of render**, something that is not possible with other implementations of suspense.
- With React Futures asynchronicity is transparent; you can use a future as you would a normal object or an array. 


## Restrictions

To achieve transparency, React Futures places  restrictions on what type of operations can be used where. 

The general rule of thumb is if an operation is mutable, it will not be allowed inside render. If an operation suspends, it will not be allowed outside render.

Click the toggle for a complete overview of what operations are allowed where

## ADD CHART HERE

## API