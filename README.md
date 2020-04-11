# React Futures

Manipulate asynchronous data synchronously

## Installation
```
#npm
npm i react-futures

#yarn
yarn add react-futures
```

## Usage

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

React Futures is a collection of datatypes that focuses on deferring data manipulation and suspending when the data is consumed. React Futures follows the "wait-by-necessity" principle, which means it defers suspension until the content of the data is being examined. Only after suspension are operations like `map`, `slice`, and `filter` applied to the data. This allows us to simplify data construction by making data fetching as transparent as possible.  

When the requirements for data-fetching increases, the benefits of React Futures become clearer.

```javascript
// with React Futures
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




// with async await
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

This example demonstrates several benefits of React Futures. The first is that futures allows the code that manipulates and constructs the data to be separated from the code that fetches it. Second, React Futures can be used within the callbacks of other future data operations (see above where `FutureGroups` is used in `flatMap`). Third, the manipulation and construction of asynchronous data can be done outside of render, something that is not possible with other implementations of suspense.

