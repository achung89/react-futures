`     handler                   | inRender            | outRender

      apply                     | none                | none                                                                             
      construct                 | none                | none                                                                                 
      defineProperty            | throw               | defer                                                                                    
      deleteProperty            | throw               | throw // return value indicating successful operation can't be guaranteed to be accurate                                                                                    
      get                       | none                | none                                                                       
      getOwnPropertyDescriptor  | suspend             | throw                                                                                              
      getPrototypeOf            | throw for now       | throw for now                                                                                    
      has                       | suspend             | throw                                                                        
      isExtensible              | suspend             | throw                                                                                  
      ownKeys                   | return FutureObject.getOwnPropertyNames             |                                                                            
      preventExtensions         | throw               | defer                                                                                      
      set                       | throw               | defer                                                                        
      setPrototypeOf            | throw               | throw                                                                                    
`