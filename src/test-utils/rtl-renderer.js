import { getQueriesForElement, prettyDOM } from '@testing-library/dom';
import ReactDOM from 'react-dom';

// TODO: remove this once we have a better rtl-renderer
global.IS_REACT_ACT_ENVIRONMENT = true;
export const render = (element, container) => {
  const unmount = ReactDOM.createRoot(container).render(element);
  return {
    debug: (el = container) => console.log(prettyDOM(el)),
    container,
    unmount,
    ...getQueriesForElement(container),
  };
};
