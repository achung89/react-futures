import { getQueriesForElement, prettyDOM } from '@testing-library/dom';
import ReactDOM from 'react-dom';

export const render = (element, container) => {
  const unmount = ReactDOM.createRoot(container).render(element);
  return {
    debug: (el = container) => console.log(prettyDOM(el)),
    container,
    unmount,
    ...getQueriesForElement(container),
  };
};
