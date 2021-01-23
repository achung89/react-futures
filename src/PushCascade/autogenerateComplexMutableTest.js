import * as recast from "recast";
import * as typescriptParser from "recast/parsers/typescript.js";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const b = recast.types.builders;
// console.log(Object.getOwnPropertyNames(recast.types));
const fun = (node) =>
  b.tryStatement(
    b.blockStatement([node]),
    b.catchClause(
      b.identifier("errorOrProm"),
      null,
      b.blockStatement([
        b.expressionStatement(b.awaitExpression(b.identifier("errOrProm"))),
        node,
      ])
    )
  );
const template = fs.readFileSync(
  path.join(__dirname, "./PushCascade.mutable.unit.complex.test.js")
);
// const template = `
// it("should run immutable to mutable to immutable to immutable", () => {
//   const obj1 = PushCascade.of(() => ({ val: 1 }))

//    const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

//    const obj3 = obj2.tap(obj => { obj.bar = 3 })

//    const obj4 = obj3.map(obj => ({ ...obj, baz: 4 }))

//    const obj5 = obj4.map(obj => ({ ...obj, foobar: 5 }))

//    expect(obj1.get()).toStrictEqual({ val: 1 })
//    expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
//    expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
//    expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
//    expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
//  })
// `;

// all possible combos of 12345 to determine which objs  should be changed
function* getAllCombo(arr, prev = []) {
  for (let a = 0; a < arr.length; a++) {
    let combo = [...prev, arr[a]];
    yield combo;
    yield* getAllCombo(arr.slice(a + 1), combo);
  }
}
const checkPromise = (operation) =>
  b.ifStatement(
    b.binaryExpression(
      "===",
      b.unaryExpression(
        "typeof",
        b.memberExpression(b.identifier("errOrProm"), b.identifier("then"))
      ),
      b.literal("function")
    ),
    b.blockStatement([
      b.expressionStatement(operation),
      b.expressionStatement(
        b.callExpression(
          b.memberExpression(
            b.identifier("jest"),
            b.identifier("advanceTimersByTime")
          ),
          [b.literal(55)]
        )
      ),
      b.expressionStatement(b.awaitExpression(b.identifier("errOrProm"))),
      b.returnStatement(null),
    ]),
    b.throwStatement(b.identifier("errOrProm"))
  );
let combos = [...getAllCombo([1, 2, 3, 4, 5])];
// let program = "";
const ast = recast.parse(template, { parser: typescriptParser });

const throwFns = ["throwOnce", "throwTwice"];
for (let i = 0; i < throwFns.length; i++) {
  for (const combo of combos) {
    for (let wrapMapCount = 6; wrapMapCount > 0; wrapMapCount--) {
      const its = [];

      const wrapCount = wrapMapCount % 6 // 0,5,4,3,2,1
      const clonedAst = recast.parse(recast.print(ast).code, {
        parser: typescriptParser,
      });
      recast.visit(clonedAst, {
        /** visit 'it' block */
        visitExpressionStatement(path) {
          if (path.value?.expression?.callee?.name === "it") {
            let pushIt = true;

            this.visit(path, {
              /** visit function block for it */
              visitArrowFunctionExpression(path) {
                // console.log(path)
                if (path.parent.value?.callee?.name === "it") {
                  const expects = [];
                  const wrappedMaps = [];
                  path.value.async = true;
                  this.visit(path, {
                    /** visit `obj\d` declarations and inset throw wrapper */
                    visitVariableDeclaration(subPath) {
                      if (
                        combo
                          .map((num) => `obj${num}`)
                          .includes(subPath.value.declarations[0].id.name)
                      ) {
                        this.visit(subPath, {
                          visitArrowFunctionExpression(subSubPath) {
                            subSubPath.replace(
                              b.callExpression(b.identifier(throwFns[i]), [
                                subSubPath.node,
                              ])
                            );
                            return false;
                          },
                        });
                      }

                      if(wrapCount !== 0) {
                        if(Number(subPath.value.declarations[0].id.name.replace(/obj/, '')) >= wrapCount ) {
                          if(subPath.value.declarations[0].init.callee.property.name === 'map') {
                            wrappedMaps.push(subPath.node)
                            subPath.replace()
                          } else {
                            pushIt = false;
                          }
                        }
                      }

                      this.traverse(subPath);
                    },
                    /** store `expect`s in array to wrap later*/
                    visitExpressionStatement(subPath) {
                      if (
                        subPath.value.expression?.callee?.object?.callee
                          ?.name === "expect"
                      ) {
                        expects.push(subPath.node);
                        subPath.replace();
                      }
                      this.traverse(subPath);
                    },
                  });
                  // console.log(expects[0])
                  
                  const body = path.get("body").value.body;
                  for (let num of combo) {
                    /** create throw counter values */
                    body.push(
                      b.variableDeclaration("let", [
                        b.variableDeclarator(
                          b.identifier(`obj${num}ThrowCount`),
                          b.literal(0)
                        ),
                      ])
                    );
                    /** create catch clause for part that throw */
                    expects[num - 1] = b.tryStatement(
                      b.blockStatement([expects[num - 1]]),
                      b.catchClause(
                        b.identifier("errOrProm"),
                        null,
                        b.blockStatement([
                          checkPromise(
                            b.updateExpression(
                              "++",
                              b.identifier(`obj${num}ThrowCount`),
                              false
                            )
                          ),
                        ])
                      )
                    );
                  }
                  /** wrap `expect`s in cb */
                  body.push(
                    b.variableDeclaration("const", [
                      b.variableDeclarator(
                        b.identifier("cb"),
                        b.arrowFunctionExpression.from({
                          body: b.blockStatement([...wrappedMaps, ...expects]),
                          params: [],
                          async: true,
                        })
                      ),
                    ])
                  );
                  /** create cb call sequence */
                  for (const num of combo) {
                    for (let a = 0; a <= i; a++) {
                      body.push(
                        b.expressionStatement(
                          b.awaitExpression(
                            b.callExpression(b.identifier("cb"), [])
                          )
                        )
                      );

                      body.push(
                        b.expressionStatement(
                          b.callExpression(
                            b.memberExpression(
                              b.callExpression(b.identifier("expect"), [
                                b.identifier(`obj${num}ThrowCount`),
                              ]),
                              b.identifier("toEqual")
                            ),
                            [b.literal(a + 1)]
                          )
                        )
                      );
                      body.push(
                        b.expressionStatement(
                          b.awaitExpression(
                            b.callExpression(
                              b.memberExpression(
                                b.identifier("Promise"),
                                b.identifier("resolve")
                              ),
                              []
                            )
                          )
                        )
                      );

                      body.push(
                        b.expressionStatement(
                          b.callExpression(
                            b.memberExpression(
                              b.identifier("jest"),
                              b.identifier("runAllTimers")
                            ),
                            []
                          )
                        )
                      );
                    }
                  }
                  /**  */
                  for (let num of combo) {
                    body.push(
                      b.expressionStatement(
                        b.assignmentExpression(
                          "=",
                          b.identifier(`obj${num}ThrowCount`),
                          b.literal(0)
                        )
                      )
                    );
                  }

                  /** add final non-throwing cb call */
                  body.push(
                    b.expressionStatement(
                      b.awaitExpression(
                        b.callExpression(b.identifier("cb"), [])
                      )
                    )
                  );

                  /** expect throw count to be 0 */
                  for (let num of combo) {
                    body.push(
                      b.expressionStatement(
                        b.callExpression(
                          b.memberExpression(
                            b.callExpression(b.identifier("expect"), [
                              b.identifier(`obj${num}ThrowCount`),
                            ]),
                            b.identifier("toEqual")
                          ),
                          [b.literal(0)]
                        )
                      )
                    );
                  }
   
                  // console.log(recast.print(clonedAst).code)
                }

                this.traverse(path);
              },
            });
            // console.log(path.node)
            if(pushIt) {
              its.push(
                path.node
              );
            }
          }
          this.traverse(path);
        },
      });
      const program = b.program([
        b.importDeclaration(
          [b.importSpecifier(b.identifier("PushCascade"))],
          b.literal("../../internal")
        ),
        b.importDeclaration(
          [
            b.importSpecifier(b.identifier("throwOnce")),
            b.importSpecifier(b.identifier("throwTwice")),
            b.importSpecifier(b.identifier("throwThrice")),
          ],
          b.literal("../suspenseFuncs")
        ),
        b.expressionStatement(
          b.callExpression(
            b.memberExpression(b.identifier("jest"), b.identifier("useFakeTimers")),
            []
          )
        ),
        b.expressionStatement(
          b.callExpression(b.identifier("describe"), [
            b.literal("Generated scenarios"),
            b.arrowFunctionExpression([], b.blockStatement(its)),
          ])
        ),
      ]);
      fs.writeFile(
        path.join(
          __dirname,
          `./generated-tests/PushCascade.mutable.unit.complex.${throwFns[i]}.throwOn${combo.join('-')}.wrap${wrapCount === 0 ? wrapCount : 6-wrapCount}Callbacks.generated.test.js`
        ),
        recast.print(program).code,
        () => {
          console.log(
            `./generated-tests/PushCascade.mutable.unit.complex.${throwFns[i]}.throwOn${combo.join('-')}.wrap${wrapCount === 0 ? wrapCount : 6-wrapCount}Callbacks.generated.test.js`
            );
        }
      );
    }
  }

}
// console.log(its);

// const isConsecutive = arr => arr.every((num, i) => num + 1 === arr[i + 1] || arr[i + 1] === undefined )
// b.filter(isConsecutive).filter(arr => arr.length > 1)
