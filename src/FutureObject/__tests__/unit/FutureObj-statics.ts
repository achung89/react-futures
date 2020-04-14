import { FutureObject } from '../../FutureObject';
import { FutureArray } from '../../../FutureArray/FutureArray';

// TODO: test assign with array as first argument
const getOwnPropertyDescriptor = obj =>
  Object.getOwnPropertyDescriptor(obj, 'foo');
const assign_secondParam = obj => Object.assign({}, obj);
const defineProperty = obj =>
  Object.defineProperty(obj, 'foo', { writable: false });
const defineProperties = obj =>
  Object.defineProperties(obj, { foo: { writable: false } });
const setPrototypeOf = obj => Object.setPrototypeOf(obj, FutureArray);

const getOwnPropertyDescriptorFuture = obj =>
  FutureObject.getOwnPropertyDescriptor(obj, 'foo');
const assign_secondParamFuture = obj => FutureObject.assign({}, obj);
const assign_firstParamFuture = obj => FutureObject.assign(obj, { bar: 'bar' });
const definePropertyFuture = obj =>
  FutureObject.defineProperty(obj, 'foo', { writable: false });
const definePropertiesFuture = obj =>
  FutureObject.defineProperties(obj, { foo: { writable: false } });
const setPrototypeOfFuture = obj =>
  FutureObject.setPrototypeOf(obj, FutureArray);
//FutureObject
export const getterFutureObjectStaticEach = test.each`
  staticMethod      | inRender     | outRender  | returnType
  ${'isExtensible'} | ${'suspend'} | ${'throw'} | ${'boolean'}
  ${'isFrozen'}     | ${'suspend'} | ${'throw'} | ${'boolean'}
  ${'isSealed'}     | ${'suspend'} | ${'throw'} | ${'boolean'}
`;

export const immutableDeferredFutureObjectEach = test.each`
  staticMethod                      | returnType
  ${getOwnPropertyDescriptorFuture} | ${'object'}
  ${'getOwnPropertyDescriptors'}    | ${'object'}
  ${'getOwnPropertyNames'}          | ${'array'}
  ${'getOwnPropertySymbols'}        | ${'array'}
  ${'getPrototypeOf'}               | ${'object'}
  ${'keys'}                         | ${'array'}
  ${'entries'}                      | ${'array'}
  ${'values'}                       | ${'array'}
`;

// TODO: add expected value
export const invalidFutureObjectStaticEach = test.each`
  staticMethod | inRender   | outRender  | returnType
  ${'create'}  | ${'throw'} | ${'throw'} | ${'none'}
`;

export const mutableFutureObjectStaticEach = test.each`
  staticMethod                | returnType
  ${assign_firstParamFuture}  | ${'object'}
  ${'preventExtensions'}      | ${'object'}
  ${setPrototypeOfFuture}     | ${'object'}
  ${'seal'}                   | ${'object'}
  ${assign_secondParamFuture} | ${'object'}
  ${definePropertiesFuture}   | ${'object'}
  ${definePropertyFuture}     | ${'object'}
  ${'freeze'}                 | ${'object'}
`;

export const noopFutureObjectStaticEach = test.each`
  staticMethod
  ${'is'}
`;

// Object
// autothrow means that it throws becuase of some other proxy handler
// TODO: add expected value

export const getterObjectStaticEach = test.each`
  staticMethod
  ${assign_secondParam}
  ${getOwnPropertyDescriptor}
  ${'getOwnPropertyDescriptors'}
  ${'getOwnPropertyNames'}
  ${'getOwnPropertySymbols'}
  ${'isExtensible'}
  ${'isFrozen'}
  ${'isSealed'}
  ${'keys'}
  ${'entries'}
  ${'values'}
  ${'getPrototypeOf'}
`;
export const noopObjectStaticEach = test.each`
  staticMethod
  ${'is'}
  ${'create'}
`;
export const mutableObjectStaticEach = test.each`
  staticMethod           | returnType
  ${'preventExtensions'} | ${'object'}
  ${defineProperties}    | ${'object'}
  ${defineProperty}      | ${'object'}
  ${setPrototypeOf}      | ${'object'}
`;
export const invalidObjectStaticEach = test.each`
  staticMethod
  ${'seal'}
  ${'freeze'}
`;
