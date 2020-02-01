//FutureObject
let a = `       staticMethod         |   inRender           |  outRender                                                                                                                                                                               
    ${'assign'}                      |    throw             |   defermutate                                                 
    ${'getOwnPropertyDescriptor'}    |    defer             |   defer                                                             
    ${'getOwnPropertyDescriptors'}   |    defer             |   defer                                                                
    ${'getOwnPropertyNames'}         |    defer             |   defer                                                       
    ${'getOwnPropertySymbols'}       |    defer             |   defer                                                           
    ${'is'}                          |    suspend           |   throw                                        
    ${'preventExtensions'}           |    throw             |   defermutate                                                          
    ${'seal'}                        |    throw             |   defermutate                                         
    ${'create'}                      |    throw             |   throw                                            
    ${'defineProperties'}            |    throw             |   defermutate                                                     
    ${'defineProperty'}              |    throw             |   defermutate                                                 
    ${'freeze'}                      |    throw             |   defermutate                                          
    ${'getPrototypeOf'}              |    suspend           |   throw                                                     
    ${'setPrototypeOf'}              |    throw             |   defer                                                    
    ${'isExtensible'}                |    suspend           |   throw                                             
    ${'isFrozen'}                    |    suspend           |   throw                                         
    ${'isSealed'}                    |    suspend           |   throw                                              
    ${'keys'}                        |    defer             |   defer                                       
    ${'entries'}                     |    defer             |   defer                                                
    ${'values'}                      |    defer             |   defer                                      

`


//Object
// autothrow means that it throws becuase of some other proxy handler
let b = `       staticMethod         |   inRender                                           |  outRender                                                                                                                                                                               
    ${'assign'}                      |    autothrow                                         |   autothrow                                               
    ${'getOwnPropertyDescriptor'}    |    suspend                                           |   throw                                                             
    ${'getOwnPropertyDescriptors'}   |    autosuspend                                       |   throw                                                                
    ${'getOwnPropertyNames'}         |    suspend                                           |   defer                                                       
    ${'getOwnPropertySymbols'}       |    return FutureObject.getOwnPropertyNames           |   defer                                                           
    ${'is'}                          |    none                                              |   none                                        
    ${'preventExtensions'}           |    throw                                             |   defermutate                                                          
    ${'seal'}                        |    autothrow                                         |   autothrow                                         
    ${'create'}                      |    suspend                                           |   throw                                            
    ${'defineProperties'}            |    throw                                             |   autodefermutate                                                     
    ${'defineProperty'}              |    throw                                             |   defermutate                                                 
    ${'freeze'}                      |    throw                                             |   throw                                          
    ${'getPrototypeOf'}              |    delegateToObject                                  |   delegateToObject                                                     
    ${'setPrototypeOf'}              |    throw                                             |   throw? (show warning maybe)                                               
    ${'isExtensible'}                |    suspend                                           |   throw                                             
    ${'isFrozen'}                    |    suspend                                           |   throw                                         
    ${'isSealed'}                    |    suspend                                           |   throw                                              
    ${'keys'}                        |    suspend                                           |   throw                                       
    ${'entries'}                     |    suspend                                           |   throw                                                
    ${'values'}                      |    suspend                                           |   throw                                      

`