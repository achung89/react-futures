import { getQueriesForElement, prettyDOM } from '@testing-library/dom';
import ReactDOM from 'react-dom';

export const render = (element, container) => {
  ReactDOM.unstable_createRoot(container).render(element);
  return {
    debug: (el = container) => console.log(prettyDOM(el)),
    container,
    unmount: () => ReactDOM.unmountComponentAtNode(container),
    ...getQueriesForElement(container),
  };
};
