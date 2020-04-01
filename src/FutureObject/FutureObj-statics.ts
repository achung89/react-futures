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
                               staticMethod                    |   inRender                |  outRender                                                                                                                                                                               
${getOwnPropertyDescriptorFuture}                              |    ${'defer'}             |   ${'defer'}     `;`                                                        
${assign_firstParamFuture}                                    |    ${'throw'}             |   ${'defer'}                                                 
${assign_secondParamFuture}                                    |    ${'suspend'}             |   ${'throw'}                                                 
${'getOwnPropertyDescriptors'}                                 |    ${'defer'}             |   ${'defer'}                                                                
${'getOwnPropertyNames'}                                       |    ${'defer'}             |   ${'defer'}                                                       
${'getOwnPropertySymbols'}                                     |    ${'defer'}             |   ${'defer'}                                                           
${'is'}                                                        |    ${'suspend'}           |   ${'throw'}                                        
${'preventExtensions'}                                         |    ${'throw'}             |   ${'defer'}                                                          
${'seal'}                                                      |    ${'throw'}             |   ${'defer'}                                         
${'create'}                                                    |    ${'throw'}             |   ${'throw'}                                            
${definePropertiesFuture}                                          |    ${'throw'}             |   ${'defer'}                                                     
${definePropertyFuture}                                            |    ${'throw'}             |   ${'defer'}                                                 
${'freeze'}                                                    |    ${'throw'}             |   ${'defer'}                                          
${'getPrototypeOf'}                                            |    ${'suspend'}           |   ${'throw'}                                                     
${setPrototypeOfFuture}                                            |    ${'throw'}             |   ${'defer'}                                                    
${'isExtensible'}                                              |    ${'suspend'}           |   ${'throw'}                                             
${'isFrozen'}                                                  |    ${'suspend'}           |   ${'throw'}                                         
${'isSealed'}                                                  |    ${'suspend'}           |   ${'throw'}                                              
${'keys'}                                                      |    ${'defer'}             |   ${'defer'}                                       
${'entries'}                                                   |    ${'defer'}             |   ${'defer'}                                                
${'values'}                                                    |    ${'defer'}             |   ${'defer'}                                      
`


// Object
// autothrow means that it throws becuase of some other proxy handler
// TODO: add expected value

export const eachObjectStatic = test.each` 
staticMethod                    |   inRender                                                |  outRender 
${assign_secondParam}           |    ${'suspend'}                                           |   ${'throw'}                                         
${getOwnPropertyDescriptor}     |    ${'suspend'}                                           |   ${'throw'}                                                          
${'getOwnPropertyDescriptors'}  |    ${'suspend'}                                           |   ${'throw'}                                                                
${'getOwnPropertyNames'}        |    ${'suspend'}                                           |   ${'throw'}                                                       
${'getOwnPropertySymbols'}      |    ${'suspend'}                                           |   ${'throw'}                                                           
${'is'}                         |    ${'none'}                                              |   ${'none'}                                        
${'preventExtensions'}          |    ${'throw'}                                             |   ${'defer'}                                                      
${'seal'}                       |    ${'throw'}                                             |   ${'throw'}                                         
${'create'}                     |    ${'none'}                                              |   ${'none'}                                          
${defineProperties}             |    ${'throw'}                                             |   ${'defer'}                                                     
${defineProperty}               |    ${'throw'}                                             |   ${'defer'}                                                 
${'freeze'}                     |    ${'throw'}                                             |   ${'throw'}                                          
${'getPrototypeOf'}             |    ${'none'}                                              |   ${'none'}                                                     
${setPrototypeOf}               |    ${'throw'}                                             |   ${'none'}                                               
${'isExtensible'}               |    ${'suspend'}                                           |   ${'throw'}                                             
${'isFrozen'}                   |    ${'suspend'}                                           |   ${'throw'}                                         
${'isSealed'}                   |    ${'suspend'}                                           |   ${'throw'}                                              
${'keys'}                       |    ${'suspend'}                                           |   ${'throw'}                                       
${'entries'}                    |    ${'suspend'}                                           |   ${'throw'}                                                
${'values'}                     |    ${'suspend'}                                           |   ${'throw'}                                      
`