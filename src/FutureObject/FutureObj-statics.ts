import FutureObject from "./FutureObject"

//FutureObject
// TODO: add expected value
export const eachFutureObjectStatic = test.each`
                               staticMethod                    |   inRender                |  outRender                                                                                                                                                                               
${function assign(obj) { return FutureObject.assign({},obj)}}  |    ${'throw'}             |   ${'defermutate'}                                                 
${'getOwnPropertyDescriptor'}                                  |    ${'defer'}             |   ${'defer'}                                                             
${'getOwnPropertyDescriptors'}                                 |    ${'defer'}             |   ${'defer'}                                                                
${'getOwnPropertyNames'}                                       |    ${'defer'}             |   ${'defer'}                                                       
${'getOwnPropertySymbols'}                                     |    ${'defer'}             |   ${'defer'}                                                           
${'is'}                                                        |    ${'suspend'}           |   ${'throw'}                                        
${'preventExtensions'}                                         |    ${'throw'}             |   ${'defermutate'}                                                          
${'seal'}                                                      |    ${'throw'}             |   ${'defermutate'}                                         
${'create'}                                                    |    ${'throw'}             |   ${'throw'}                                            
${'defineProperties'}                                          |    ${'throw'}             |   ${'defermutate'}                                                     
${'defineProperty'}                                            |    ${'throw'}             |   ${'defermutate'}                                                 
${'freeze'}                                                    |    ${'throw'}             |   ${'defermutate'}                                          
${'getPrototypeOf'}                                            |    ${'suspend'}           |   ${'throw'}                                                     
${'setPrototypeOf'}                                            |    ${'throw'}             |   ${'defer'}                                                    
${'isExtensible'}                                              |    ${'suspend'}           |   ${'throw'}                                             
${'isFrozen'}                                                  |    ${'suspend'}           |   ${'throw'}                                         
${'isSealed'}                                                  |    ${'suspend'}           |   ${'throw'}                                              
${'keys'}                                                      |    ${'defer'}             |   ${'defer'}                                       
${'entries'}                                                   |    ${'defer'}             |   ${'defer'}                                                
${'values'}                                                    |    ${'defer'}             |   ${'defer'}                                      
`


//Object
// autothrow means that it throws becuase of some other proxy handler
// TODO: add expected value
function getOwnPropertyDescriptor(obj) { 
       return Object.getOwnPropertyDescriptor(obj, 'foo')
}
function assign_secondParam(obj) { return Object.assign({},obj) };
export const eachObjectStatic = test.only.each` 
staticMethod                    |   inRender                                                |  outRender 
${assign_secondParam}           |    ${'suspend'}                                           |   ${'throw'}                                         
${getOwnPropertyDescriptor}     |    ${'suspend'}                                           |   ${'throw'}                                                          
${'getOwnPropertyDescriptors'}  |    ${'suspend'}                                           |   ${'throw'}                                                                
${'getOwnPropertyNames'}        |    ${'suspend'}                                           |   ${'throw'}                                                       
${'getOwnPropertySymbols'}      |    ${'suspend'}                                           |   ${'throw'}                                                           
${'is'}                         |    ${'none'}                                              |   ${'none'}                                        
${'preventExtensions'}          |    ${'throw'}                                             |   ${'throw'} `                                                         
// `${'seal'}                       |    ${'autothrow'}                                         |   ${'autothrow'}                                         
// ${'create'}                     |    ${'suspend'}                                           |   ${'throw'}                                            
// ${'defineProperties'}           |    ${'throw'}                                             |   ${'autodefermutate'}                                                     
// ${'defineProperty'}             |    ${'throw'}                                             |   ${'defermutate'}                                                 
// ${'freeze'}                     |    ${'throw'}                                             |   ${'throw'}                                          
// ${'getPrototypeOf'}             |    ${'delegateToObject?'}                                 |   ${'delegateToObject?'}                                                     
// ${'setPrototypeOf'}             |    ${'throw'}                                             |   ${'throw? (show warning maybe)'}                                               
// ${'isExtensible'}               |    ${'suspend'}                                           |   ${'throw'}                                             
// ${'isFrozen'}                   |    ${'suspend'}                                           |   ${'throw'}                                         
// ${'isSealed'}                   |    ${'suspend'}                                           |   ${'throw'}                                              
// ${'keys'}                       |    ${'suspend'}                                           |   ${'throw'}                                       
// ${'entries'}                    |    ${'suspend'}                                           |   ${'throw'}                                                
// ${'values'}                     |    ${'suspend'}                                           |   ${'throw'}                                      
// `