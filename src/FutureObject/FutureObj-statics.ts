import FutureObject from "./FutureObject"
import FutureArray from "../FutureArray/FutureArray";
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
  constructor     |                                staticMethod                    |   inRender                |  outRender                                                                                                                                                                               
${'FutureObject'} | ${getOwnPropertyDescriptorFuture}                              |    ${'defer'}             |   ${'defer'}                                               
${'FutureObject'} | ${assign_firstParamFuture}                                    |    ${'throw'}             |   ${'defer'}                                                 
${'FutureObject'} | ${assign_secondParamFuture}                                    |    ${'throw'}             |   ${'throw'}                                                 
${'FutureObject'} | ${'getOwnPropertyDescriptors'}                                 |    ${'defer'}             |   ${'defer'}                                                                
${'FutureObject'} | ${'getOwnPropertyNames'}                                       |    ${'defer'}             |   ${'defer'}                                                       
${'FutureObject'} | ${'getOwnPropertySymbols'}                                     |    ${'defer'}             |   ${'defer'}                                                           
${'FutureObject'} | ${'is'}                                                        |    ${'none'}           |   ${'none'}                                        
${'FutureObject'} | ${'preventExtensions'}                                         |    ${'throw'}             |   ${'defer'}                                                          
${'FutureObject'} | ${'seal'}                                                      |    ${'throw'}             |   ${'defer'}                                         
${'FutureObject'} | ${'create'}                                                    |    ${'throw'}             |   ${'throw'}                                            
${'FutureObject'} | ${definePropertiesFuture}                                          |    ${'throw'}             |   ${'defer'}                                                     
${'FutureObject'} | ${definePropertyFuture}                                            |    ${'throw'}             |   ${'defer'}                                                 
${'FutureObject'} | ${'freeze'}                                                    |    ${'throw'}             |   ${'defer'}                                          
${'FutureObject'} | ${'getPrototypeOf'}                                            |    ${'suspend'}           |   ${'throw'}                                                     
${'FutureObject'} | ${setPrototypeOfFuture}                                            |    ${'throw'}             |   ${'defer'}                                                    
${'FutureObject'} | ${'isExtensible'}                                              |    ${'suspend'}           |   ${'throw'}                                             
${'FutureObject'} | ${'isFrozen'}                                                  |    ${'suspend'}           |   ${'throw'}                                         
${'FutureObject'} | ${'isSealed'}                                                  |    ${'suspend'}           |   ${'throw'}                                              
${'FutureObject'} | ${'keys'}                                                      |    ${'defer'}             |   ${'defer'}                                       
${'FutureObject'} | ${'entries'}                                                   |    ${'defer'}             |   ${'defer'}                                                
${'FutureObject'} | ${'values'}                                                    |    ${'defer'}             |   ${'defer'}                                      
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