import FutureObject from "./FutureObject"
import FutureArray from "../FutureArray/FutureArray";

const getOwnPropertyDescriptor = obj => Object.getOwnPropertyDescriptor(obj, 'foo')
const assign_secondParam = obj => Object.assign({},obj);
const defineProperty = obj => Object.defineProperty(obj, 'foo', {writable: false})
const defineProperties = obj => Object.defineProperties(obj, {'foo':{ writable: false}})
const setPrototypeOf = obj => Object.setPrototypeOf(obj, FutureArray)

const getOwnPropertyDescriptorFuture = obj => FutureObject.getOwnPropertyDescriptor(obj, 'foo')
const assign_secondParamFuture = obj => FutureObject.assign({},obj);
const definePropertyFuture = obj => FutureObject.defineProperty(obj, 'foo', {writable: false})
const definePropertiesFuture = obj => FutureObject.defineProperties(obj, {'foo':{ writable: false}})
const setPrototypeOfFuture = obj => FutureObject.setPrototypeOf(obj, FutureArray)
//FutureObject
// TODO: add expected value
export const eachFutureObjectStatic = test.only.each`
                               staticMethod                    |   inRender                |  outRender                                                                                                                                                                               
${assign_secondParamFuture}                                    |    ${'throw'}             |   ${'defermutate'}                                                 
${getOwnPropertyDescriptorFuture}                              |    ${'defer'}             |   ${'defer'}                                                             
${'getOwnPropertyDescriptors'}                                 |    ${'defer'}             |   ${'defer'}                                                                
${'getOwnPropertyNames'}                                       |    ${'defer'}             |   ${'defer'}                                                       
${'getOwnPropertySymbols'}                                     |    ${'defer'}             |   ${'defer'}                                                           
${'is'}                                                        |    ${'suspend'}           |   ${'throw'}                                        
${'preventExtensions'}                                         |    ${'throw'}             |   ${'defermutate'}                                                          
${'seal'}                                                      |    ${'throw'}             |   ${'defermutate'}                                         
${'create'}                                                    |    ${'throw'}             |   ${'throw'}                                            
${definePropertiesFuture}                                          |    ${'throw'}             |   ${'defermutate'}                                                     
${definePropertyFuture}                                            |    ${'throw'}             |   ${'defermutate'}                                                 
${'freeze'}                                                    |    ${'throw'}             |   ${'defermutate'}                                          
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