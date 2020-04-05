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
  constructor     |                                staticMethod                    |   inRender                |  outRender        | returnType                                                                                                                                                              
  ${'FutureObject'} | ${assign_firstParamFuture}                                    |    ${'throw'}             |   ${'defer'}       |   ${'object'}                     
  ${'FutureObject'} | ${assign_secondParamFuture}                                    |    ${'throw'}             |   ${'throw'}      |   ${'object'}                            
  ${'FutureObject'} | ${getOwnPropertyDescriptorFuture}                              |    ${'defer'}             |   ${'defer'}      |   ${'object'}                          
${'FutureObject'} | ${'getOwnPropertyDescriptors'}                                 |    ${'defer'}             |   ${'defer'}      |   ${'object'}                                           
${'FutureObject'} | ${'getOwnPropertyNames'}                                       |    ${'defer'}             |   ${'defer'}      |   ${'array'}                                  
${'FutureObject'} | ${'getOwnPropertySymbols'}                                     |    ${'defer'}             |   ${'defer'}      |   ${'array'}                                      
${'FutureObject'} | ${'is'}                                                        |    ${'none'}           |   ${'none'}          |   ${'boolean'}               
${'FutureObject'} | ${'preventExtensions'}                                         |    ${'throw'}             |   ${'defer'}      |   ${'object'}                                     
${'FutureObject'} | ${'seal'}                                                      |    ${'throw'}             |   ${'defer'}      |   ${'object'}                  
${'FutureObject'} | ${'create'}                                                    |    ${'throw'}             |   ${'throw'}      |   ${'none'}                       
${'FutureObject'} | ${definePropertiesFuture}                                          |    ${'throw'}             |   ${'defer'}  |   ${'object'}                                   
${'FutureObject'} | ${definePropertyFuture}                                            |    ${'throw'}             |   ${'defer'}  |   ${'object'}                                
${'FutureObject'} | ${'freeze'}                                                    |    ${'throw'}             |   ${'defer'}      |   ${'object'}                     
${'FutureObject'} | ${'getPrototypeOf'}                                            |    ${'defer'}           |   ${'defer'}      |   ${'object'}                                
${'FutureObject'} | ${setPrototypeOfFuture}                                            |    ${'throw'}             |   ${'defer'}  |   ${'object'}                                   
${'FutureObject'} | ${'isExtensible'}                                              |    ${'suspend'}           |   ${'throw'}      |   ${'boolean'}                   
${'FutureObject'} | ${'isFrozen'}                                                  |    ${'suspend'}           |   ${'throw'}      |   ${'boolean'}                    
${'FutureObject'} | ${'isSealed'}                                                  |    ${'suspend'}           |   ${'throw'}      |   ${'boolean'}                          
${'FutureObject'} | ${'keys'}                                                      |    ${'defer'}             |   ${'defer'}      |  ${'array'}                   
${'FutureObject'} | ${'entries'}                                                   |    ${'defer'}             |   ${'defer'}      |  ${'array'}                            
${'FutureObject'} | ${'values'}                                                    |    ${'defer'}             |   ${'defer'}      |  ${'array'}                  
`


// Object
// autothrow means that it throws becuase of some other proxy handler
// TODO: add expected value

export const eachObjectStatic = test.each` 
constructor | staticMethod                    |   inRender                                                |  outRender 
${'Object'} | ${assign_secondParam}           |    ${'suspend'}                                           |   ${'throw'}                                         
${'Object'} | ${getOwnPropertyDescriptor}     |    ${'suspend'}                                           |   ${'throw'}                                                          
${'Object'} | ${'getOwnPropertyDescriptors'}  |    ${'suspend'}                                           |   ${'throw'}                                                                
${'Object'} | ${'getOwnPropertyNames'}        |    ${'suspend'}                                           |   ${'throw'}                                                       
${'Object'} | ${'getOwnPropertySymbols'}      |    ${'suspend'}                                           |   ${'throw'}                                                           
${'Object'} | ${'is'}                         |    ${'none'}                                              |   ${'none'}                                        
${'Object'} | ${'preventExtensions'}          |    ${'throw'}                                             |   ${'defer'}                                                      
${'Object'} | ${'seal'}                       |    ${'throw'}                                             |   ${'throw'}                                         
${'Object'} | ${'create'}                     |    ${'none'}                                              |   ${'none'}                                          
${'Object'} | ${defineProperties}             |    ${'throw'}                                             |   ${'defer'}                                                     
${'Object'} | ${defineProperty}               |    ${'throw'}                                             |   ${'defer'}                                                 
${'Object'} | ${'freeze'}                     |    ${'throw'}                                             |   ${'throw'}                                          
${'Object'} | ${'getPrototypeOf'}             |    ${'none'}                                              |   ${'none'}                                                     
${'Object'} | ${setPrototypeOf}               |    ${'throw'}                                             |   ${'none'}                                               
${'Object'} | ${'isExtensible'}               |    ${'suspend'}                                           |   ${'throw'}                                             
${'Object'} | ${'isFrozen'}                   |    ${'suspend'}                                           |   ${'throw'}                                         
${'Object'} | ${'isSealed'}                   |    ${'suspend'}                                           |   ${'throw'}                                              
${'Object'} | ${'keys'}                       |    ${'suspend'}                                           |   ${'throw'}                                       
${'Object'} | ${'entries'}                    |    ${'suspend'}                                           |   ${'throw'}                                                
${'Object'} | ${'values'}                     |    ${'suspend'}                                           |   ${'throw'}                                      
`