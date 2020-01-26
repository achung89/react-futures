`   method                 |   inside render                     |        outside render
    ${'indexOf'}           |   ${'suspend'}                      |         ${'throw'}
    ${'includes'}          |   ${'suspend'}                      |         ${'throw'}
    ${'join'}              |   ${'suspend'}                      |         ${'throw'}
    ${'lastIndexOf'}       |   ${'suspend'}                      |         ${'throw'}
    ${'toString'}          |   ${'suspend'}                      |         ${'throw'}
    ${'toLocaleString'}    |   ${'suspend'}                      |         ${'throw'}
    ${'pop'}               |   ${'throw'}                        |         ${'throw'}
    ${'shift'}             |   ${'throw'}                        |         ${'throw'}
    ${'every'}             |   ${'suspend'}                      |         ${'throw'}
    ${'find'}              |   ${'suspend'}                      |         ${'throw'}
    ${'findIndex'}         |   ${'suspend'}                      |         ${'throw'}
    ${'forEach'}           |   ${'suspend'}                      |         ${'throw'}
    ${'some'}              |   ${'suspend'}                      |         ${'throw'}
    ${'concat'}            |   ${'defer'}                        |         ${'defer'}
    ${'filter'}            |   ${'defer'}                        |         ${'defer'}
    ${'slice'}             |   ${'defer'}                        |         ${'defer'}
    ${'entries'}           |   ${'returns future iterator'}      |         ${'return future iterator'}
    ${'keys'}              |   ${'returns future iterator'}      |         ${'return future iterator'}
    ${'map'}               |   ${'defer'}                        |         ${'defer'}
    ${'reduce'}            |   ${'defer'}                        |         ${'defer'}
    ${'reduceRight'}       |   ${'defer'}                        |         ${'defer'}
    ${'values'}            |   ${'returns future iterator'}      |         ${'return future iterator'}
    ${'flat'}              |   ${'defer'}                        |         ${'defer'}
    ${'flatMap'}           |   ${'defer'}                        |         ${'defer'}
    ${'fill'}              |   ${'throw'}                        |         ${'defer mutable'}
    ${'push'}              |   ${'throw'}                        |         ${'throw'}
    ${'reverse'}           |   ${'throw'}                        |         ${'defer mutable'}
    ${'unshift'}           |   ${'throw'}                        |         ${'defer mutable'}
    ${'sort'}              |   ${'throw'}                        |         ${'defer mutable'}
    ${'splice'}            |   ${'throw'}                        |         ${'defer mutable'}
    ${'copyWithin'}        |   ${'throw'}                        |         ${'defer mutable'}
    ${'immReverse'}        |   ${'defer'}                        |         ${'defer'}
    ${'immFill'}           |   ${'defer'}                        |         ${'defer'}
    ${'immSplice'}         |   ${'defer'}                        |         ${'defer'}
    ${'immUnshift'}        |   ${'defer'}                        |         ${'defer'}
    ${'immCopywithin'}     |   ${'defer'}                        |         ${'defer'}
`
// make immutable variants of reverse,fill,  sort, splice, unshift and copywithin. no need for one for push since we have concat