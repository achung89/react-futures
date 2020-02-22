
import React from 'react';
import ReactDOM from 'react-dom';
import { createFutureArray } from '../index';
import { act } from 'react-dom/test-utils';


let Scheduler;
const fetchArray = () => new Promise((res, rej) => {
  setTimeout(() => {
    res([2,3,4,5])
  }, 1000)
})

let container;
let FutureArr;
beforeEach(() => {
  FutureArr = createFutureArray(fetchArray);
  Scheduler = require('scheduler')
  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  FutureArr = null;
  document.body.removeChild(container);
  container = null;
});