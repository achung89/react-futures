import {render} from './rtl-renderer'
import { getRaw } from '../utils'
import React, {Suspense} from 'react';
import { act } from 'react-dom/test-utils';

const extractValue = future => {
return new Promise((res, rej) => {
    try {
      const div = document.createElement('div');

      document.body.appendChild(div);
      const App = () => {
        res(getRaw(future))
        return <div></div>
      }
      act(() => {
        render(<Suspense fallback={<div>Loading...</div>}><App /></Suspense>, div);
      });
      jest.runTimersToTime(0);
    } catch (err) {
      rej(err)
    }

  })
}
export default extractValue;