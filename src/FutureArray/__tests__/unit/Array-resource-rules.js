`   method                 |   inside render                     |        outside render
    ${'getter'}               |   ${'suspend'}                      |         ${'throw'}
    ${'indexOf'}           |   ${'suspend'}                      |         ${'throw'}
    ${'includes'}          |   ${'suspend'}                      |         ${'throw'}
    ${'join'}              |   ${'suspend'}                      |         ${'throw'}
    ${'lastIndexOf'}       |   ${'suspend'}                      |         ${'throw'}
    ${'toString'}          |   ${'suspend'}                      |         ${'throw'}
    ${'toLocaleString'}    |   ${'suspend'}                      |         ${'throw'}
    ${'pop'}               |   ${'throw'}                        |         ${'throw'}
    ${'push'}              |   ${'throw'}                        |         ${'throw'}
    ${'shift'}             |   ${'throw'}                        |         ${'throw'}
    ${'every'}             |   ${'suspend'}                      |         ${'throw'}
    ${'find'}              |   ${'suspend'}                      |         ${'throw'}
    ${'findIndex'}         |   ${'suspend'}                      |         ${'throw'}
    ${'forEach'}           |   ${'suspend'}                      |         ${'throw'}
    ${'some'}              |   ${'suspend'}                      |         ${'throw'}
    ${'entries'}           |   ${'returns future iterator'}      |         ${'return future iterator'}
    ${'keys'}              |   ${'returns future iterator'}      |         ${'return future iterator'}
    ${'values'}            |   ${'returns future iterator'}      |         ${'return future iterator'}
    ${'concat'}            |   ${'defer'}                        |         ${'defer'}
    ${'filter'}            |   ${'defer'}                        |         ${'defer'}
    ${'slice'}             |   ${'defer'}                        |         ${'defer'}
    ${'map'}               |   ${'defer'}                        |         ${'defer'}
    ${'reduce'}            |   ${'defer'}                        |         ${'defer'}
    ${'reduceRight'}       |   ${'defer'}                        |         ${'defer'}
    ${'flat'}              |   ${'defer'}                        |         ${'defer'}
    ${'flatMap'}           |   ${'defer'}                        |         ${'defer'}
    ${'immReverse'}        |   ${'defer'}                        |         ${'defer'}
    ${'immFill'}           |   ${'defer'}                        |         ${'defer'}
    ${'immSplice'}         |   ${'defer'}                        |         ${'defer'}
    ${'immUnshift'}        |   ${'defer'}                        |         ${'defer'}
    ${'immCopywithin'}     |   ${'defer'}                        |         ${'defer'}
    ${'fill'}              |   ${'throw'}                        |         ${'defer mutable'}
    ${'setter'}            |   ${'throw'}                        |         ${'defer mutable'}
    ${'reverse'}           |   ${'throw'}                        |         ${'defer mutable'}
    ${'unshift'}           |   ${'throw'}                        |         ${'defer mutable'}
    ${'sort'}              |   ${'throw'}                        |         ${'defer mutable'}
    ${'splice'}            |   ${'throw'}                        |         ${'defer mutable'}
    ${'copyWithin'}        |   ${'throw'}                        |         ${'defer mutable'}
`
// make immutable variants of reverse,fill,  sort, splice, unshift and copywithin. no need for one for push since we have concat