import {FutureObject} from "../internal"
import {FutureArray} from "../internal";
// TODO: test assign with array as first argument
const getOwnPropertyDescriptor = obj => Object.getOwnPropertyDescriptor(obj, 'foo')
const assign_secondParam = obj => Object.assign({},obj);
const defineProperty = obj => Object.defineProperty(obj, 'foo', {writable: false})
const defineProperties = obj => Object.defineProperties(obj, {'foo':{ writable: false}})
const setPrototypeOf = obj => Object.setPrototypeOf(obj, FutureArray)

const getOwnPropertyDescriptorFuture = obj => FutureObject.getOwnPropertyDescriptor(obj, 'foo')
const assign_secondParamFuture = obj => FutureObject.assign({},obj);
const assign_firstParamFuture = obj => FutureObject.assign(obj, {bar:'bar'});
const definePropertyFuture = obj => FutureObject.defineProperty(obj, 'foo', {writable: false})
const definePropertiesFuture = obj => FutureObject.defineProperties(obj, {'foo':{ writable: false}})
const setPrototypeOfFuture = obj => FutureObject.setPrototypeOf(obj, FutureArray)
//FutureObject
// TODO: add expected value
export const eachFutureObjectStatic = test.only.each`
  constructor     |          staticMethod                           |   inRender                |  outRender        | returnType                                                                                                                                                              
  ${'FutureObject'} | ${'create'}                                   |    ${'throw'}             |   ${'throw'}      |   ${'none'}                       
  ${'FutureObject'} | ${assign_firstParamFuture}                   |    ${'throw'}             |   ${'defer'}       |   ${'object'}                     
  ${'FutureObject'} | ${'preventExtensions'}                        |    ${'throw'}             |   ${'defer'}      |   ${'object'}                                     
  ${'FutureObject'} | ${setPrototypeOfFuture}                           |    ${'throw'}             |   ${'defer'}  |   ${'object'}                                   
  ${'FutureObject'} | ${'seal'}                                     |    ${'throw'}             |   ${'defer'}      |   ${'object'}                  
  ${'FutureObject'} | ${definePropertiesFuture}                         |    ${'throw'}             |   ${'defer'}  |   ${'object'}                                   
  ${'FutureObject'} | ${definePropertyFuture}                           |    ${'throw'}             |   ${'defer'}  |   ${'object'}                                
  ${'FutureObject'} | ${'freeze'}                                   |    ${'throw'}             |   ${'defer'}      |   ${'object'}                     
  ${'FutureObject'} | ${getOwnPropertyDescriptorFuture}             |    ${'defer'}             |   ${'defer'}      |   ${'object'}                          
  ${'FutureObject'} | ${'getOwnPropertyDescriptors'}                |    ${'defer'}             |   ${'defer'}      |   ${'object'}                                           
  ${'FutureObject'} | ${'getOwnPropertyNames'}                      |    ${'defer'}             |   ${'defer'}      |   ${'array'}                                  
  ${'FutureObject'} | ${'getOwnPropertySymbols'}                    |    ${'defer'}             |   ${'defer'}      |   ${'array'}                                      
  ${'FutureObject'} | ${'getPrototypeOf'}                           |    ${'defer'}           |   ${'defer'}      |   ${'object'}                                
${'FutureObject'} | ${'keys'}                                     |    ${'defer'}             |   ${'defer'}      |  ${'array'}                   
${'FutureObject'} | ${'entries'}                                  |    ${'defer'}             |   ${'defer'}      |  ${'array'}                            
${'FutureObject'} | ${'values'}                                   |    ${'defer'}             |   ${'defer'}      |  ${'array'}                  
${'FutureObject'} | ${'is'}                                       |    ${'none'}           |   ${'none'}          |   ${'boolean'}               
${'FutureObject'} | ${assign_secondParamFuture}                   |    ${'suspend'}             |   ${'throw'}      |   ${'object'}                            
${'FutureObject'} | ${'isExtensible'}                             |    ${'suspend'}           |   ${'throw'}      |   ${'boolean'}                   
${'FutureObject'} | ${'isFrozen'}                                 |    ${'suspend'}           |   ${'throw'}      |   ${'boolean'}                    
${'FutureObject'} | ${'isSealed'}                                 |    ${'suspend'}           |   ${'throw'}      |   ${'boolean'}                          
`


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
${'getPrototypeOf'} ` 
export const noopObjectStaticEach = test.each `     
staticMethod           
 ${'is'}             
 ${'create'}              `                                
export const mutableObjectStaticEach = test.each`       
staticMethod            | returnType
 ${'preventExtensions'} | ${'object'}                                         
 ${defineProperties}    | ${'object'}                                                  
 ${defineProperty}      | ${'object'}                                              
 ${setPrototypeOf}      | ${'object'}  `;
export const invalidObjectStaticEach = test.each`   
  staticMethod
 ${'seal'}                                                        
 ${'freeze'}               `