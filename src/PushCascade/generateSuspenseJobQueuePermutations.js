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
  path.join(__dirname, "./SuspenseJobQueue.permutations.test.js")
);

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
          [b.literal(100)]
        )
      ),
      b.expressionStatement(b.awaitExpression(b.identifier("errOrProm"))),
      b.returnStatement(null),
    ]),
    b.throwStatement(b.identifier("errOrProm"))
  );
const declarationCounts = [1, 2, 3];
let thrownDeclarationCombos = [...getAllCombo(declarationCounts)];
let ommittedExpectCombos = [[], ...getAllCombo([0, 1])].filter(
  (combo) => combo.length !== 3
);
// let program = "";
const ast = recast.parse(template, { parser: typescriptParser });
const printed = recast.print(ast).code;
const throwFns = ["wait"];
for (let i = 0; i < throwFns.length; i++) {
  for (const combo of thrownDeclarationCombos) {
    for (let wrapMapCount = 4; wrapMapCount > 0; wrapMapCount--) {
      for (let ommitedExpects of ommittedExpectCombos) {
        const includedExpects = declarationCounts.filter(
          (dec) => !ommitedExpects.map((i) => i + 1).includes(dec)
        );
        const its = [];
        const wrapCount = wrapMapCount % 4; // 0,3,2,1
        const clonedAst = recast.parse(printed, {
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
                    let expects = [];
                    const wrappedMaps = [];
                    path.value.async = true;
                    this.visit(path, {
                      /** visit `obj\d` declarations and inset throw wrapper */
                      visitVariableDeclaration(subPath) {
                        if (
                          combo
                            .map((num) => `jobQueue${num}`)
                            .includes(subPath.value.declarations[0].id.name)
                        ) {
                          this.visit(subPath, {
                            visitArrowFunctionExpression(subSubPath) {
                              subSubPath.replace(
                                b.callExpression(b.identifier(throwFns[i]), [
                                  subSubPath.node,
                                  b.literal(100),
                                ])
                              );
                              return false;
                            },
                          });
                        }

                        if (wrapCount !== 0) {
                          if (
                            Number(
                              subPath.value.declarations[0].id.name.replace(
                                /jobQueue/,
                                ""
                              )
                            ) >= wrapCount
                          ) {

                            if (
                              subPath.value.declarations[0].init.callee
                                ?.property?.name === "append"
                            ) {
                              wrappedMaps.push(subPath.node);
                              subPath.replace();
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
                    /** create catch clause for part that throw */
                    expects = expects.map((expect, i) =>
                      b.tryStatement(
                        b.blockStatement([expect]),
                        b.catchClause(
                          b.identifier("errOrProm"),
                          null,
                          b.blockStatement([
                            checkPromise(
                              b.updateExpression(
                                "++",
                                b.identifier(`jobQueue${i + 1}ThrowCount`),
                                false
                              )
                            ),
                          ])
                        )
                      )
                    );

                    // console.log(expects[0])
                    const body = path.get("body").value.body;
                    for (let num of declarationCounts) {
                      /** create throw counter values */
                      body.push(
                        b.variableDeclaration("let", [
                          b.variableDeclarator(
                            b.identifier(`jobQueue${num}ThrowCount`),
                            b.literal(0)
                          ),
                        ])
                      );
                    }
                    /** remove any expects that should be omitted */
                    expects = expects.filter(
                      (_expect, i) => !ommitedExpects.includes(i)
                    );
                    /** wrap `expect`s in cb */
                    body.push(
                      b.variableDeclaration("const", [
                        b.variableDeclarator(
                          b.identifier("cb"),
                          b.arrowFunctionExpression.from({
                            body: b.blockStatement([
                              ...wrappedMaps,
                              ...expects,
                            ]),
                            params: [],
                            async: true,
                          })
                        ),
                      ])
                    );
                    /** create cb call sequence */
                    let expectIndex = 0;
                    let throwCount = 0;
                    for (const declaration of declarationCounts) {
                      for (let a = 0; a <= i; a++) {
                        let expect = includedExpects[expectIndex];
                        if (declaration > expect) {
                          expect = includedExpects[++expectIndex];
                          throwCount = 0;
                        }
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
                                  b.identifier(`jobQueue${expect}ThrowCount`),
                                ]),
                                b.identifier("toEqual")
                              ),
                              [b.literal(++throwCount)]
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

                    /** set throw count to 0 before the final call to cb */
                    for (let num of combo) {
                      body.push(
                        b.expressionStatement(
                          b.assignmentExpression(
                            "=",
                            b.identifier(`jobQueue${num}ThrowCount`),
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
                                b.identifier(`jobQueue${num}ThrowCount`),
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
              if (pushIt) {
                its.push(path.node);
              }
            }
            this.traverse(path);
          },
        });
        const program = b.program.from({
          comments: [b.commentBlock("@jest-environment node", true, true)],
          body: [
            b.importDeclaration(
              [b.importSpecifier(b.identifier("SuspenseJobQueue"))],
              b.literal("./SuspenseJobQueue")
            ),
            b.importDeclaration(
              [b.importSpecifier(b.identifier("wait"))],
              b.literal("../suspenseFuncs")
            ),
            b.expressionStatement(
              b.callExpression(
                b.memberExpression(
                  b.identifier("jest"),
                  b.identifier("useFakeTimers")
                ),
                []
              )
            ),
            b.expressionStatement(
              b.callExpression(b.identifier("describe"), [
                b.literal("Generated scenarios"),
                b.arrowFunctionExpression([], b.blockStatement(its)),
              ])
            ),
          ],
        });
        fs.mkdir(
          path.join(__dirname, `./generated-suspensejobqueue-tests`),
          { recursive: true },
          (err) => {
            if (err) throw err;
            // console.time(`./generated-tests/PushCascade.mutable.unit.complex.${throwFns[i]}On${combo.join('-')}.wrap${wrapCount === 0 ? wrapCount : 6-wrapCount}Callbacks.generated.test.js`)
            fs.writeFile(
              path.join(
                __dirname,
                `./generated-suspensejobqueue-tests/SuspenseJobQueue.${
                  throwFns[i]
                }On${combo.join("-")}.wrap${
                  wrapCount === 0 ? wrapCount : 6 - wrapCount
                }Callbacks.omit${
                  ommitedExpects.length === 0 ? "No" : ommitedExpects.join("-")
                }Assertions.generated.test.js`
              ),
              recast.print(program).code,
              () => {
                // console.timeEnd(`./generated-tests/PushCascade.mutable.unit.complex.${throwFns[i]}On${combo.join('-')}.wrap${wrapCount === 0 ? wrapCount : 6-wrapCount}Callbacks.generated.test.js`)
                console.log(
                  `./generated-suspensejobqueue-tests/SuspenseJobQueue.${
                    throwFns[i]
                  }On${combo.join("-")}.wrap${
                    wrapCount === 0 ? wrapCount : 6 - wrapCount
                  }Callbacks.omit${
                    ommitedExpects.length === 0 ? "No" : ommitedExpects.join("-")
                  }Assertions.generated.test.js`
                );
              }
            );
          }
        );
      }
    }
  }
}
// console.log(its);

// const isConsecutive = arr => arr.every((num, i) => num + 1 === arr[i + 1] || arr[i + 1] === undefined )
// b.filter(isConsecutive).filter(arr => arr.length > 1)
