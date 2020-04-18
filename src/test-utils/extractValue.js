import {render} from './rtl-renderer'
import { getRaw } from '../utils'
import React, {Suspense} from 'react';
import { act } from 'react-dom/test-utils';
const extractValue = future => {
  return new Promise((res, rej) => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    console.log('pre');
    const App = () => {
      console.log('render')
      res(getRaw(future))
      return <div></div>
    }
    act(() => {
      console.log('act');
      render(<Suspense fallback={<div>Loading...</div>}><App /></Suspense>, div);
    })
    jest.runTimersToTime(0);
  })
}
export default extractValue;