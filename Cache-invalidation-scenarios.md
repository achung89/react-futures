invalidation should bubble up chain
```jsx
const App = () => {
  const arr = new FutureArr(4)
                .map(val => val + 1)
  
  // should invalidate the key `4`
  invalidate(arr) 

  const arr2 = arr.filter(val => new Future(2).includes(val))

  // should invalidate the key `4` and `2`
  invalidate(arr2) 
}
```


invalidation shouldn't bubble down 

```jsx
const App = () => {
  const arr = new FutureArr(4)
                .map(val => val + 1)
  
  const arr2 = arr.filter(val => new Future(2).includes(val))

  // should invalidate the key `4` but not `3`
  invalidate(arr) 
}
```

should allow global invalidation

```jsx
const [FutureArr, invalidate] = futureArray(fetch);
const four = new FutureArr(4);

// should invalidate the key `4` but not `3`
invalidate(4)

```



