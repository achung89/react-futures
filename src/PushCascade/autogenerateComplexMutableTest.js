import * as recast from "recast";
import * as typescriptParser from "recast/parsers/typescript.js";
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

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
const template = fs.readFileSync(path.join(__dirname, './PushCascade.mutable.unit.complex.test.ts'))
const ast = recast.parse(template,
  { parser: typescriptParser }
);

// all possible combos of 01234
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
    b.expressionStatement(operation),
    b.throwStatement(b.identifier('errOrProm'))
  );
let combos = [...getAllCombo([1, 2, 3, 4, 5])];
let program = "";
const throwFns = ["throwOnce", "throwTwice", "throwThrice"];
for (let i = 0; i < throwFns.length; i++) {
  for (const combo of combos) {
    const clonedAst = recast.parse(recast.print(ast), {
      parser: typescriptParser,
    });
    recast.visit(clonedAst, {
      visitArrowFunctionExpression(path) {
        // console.log(path)
        if (path.parent.value?.callee?.name === "it") {
          const expects = [];
          // console.log(path);
          this.visit(path, {
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
              this.traverse(subPath);
            },
            visitExpressionStatement(subPath) {
              if (
                subPath.value.expression?.callee?.object?.callee?.name ===
                "expect"
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
            body.push(
              b.variableDeclaration("let", [
                b.identifier(`obj${num}ThrowCount`),
              ])
            );
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

          body.push(
            b.variableDeclaration("const", [
              b.variableDeclarator(
                b.identifier("cb"),
                b.arrowFunctionExpression([], b.blockStatement(expects))
              ),
            ])
          );
          for (const num of combo) {
            for(let a = 0; a <= i; a++) {
              body.push(
                b.expressionStatement(b.callExpression(b.identifier("cb"), []))
              );
              body.push(
                b.expressionStatement(
                  b.callExpression(
                    b.memberExpression(b.callExpression(b.identifier("expect"), [b.identifier(`obj${num}ThrowCount`)]), b.identifier('toEqual')),
                    [b.literal(a + 1)]
                  )
                )
              );
            }
          }
          for(let num of combo) {
            body.push(
              b.expressionStatement(b.assignmentExpression('=', 
                b.identifier(`obj${num}ThrowCount`),
                b.literal(0)
              )
            ))
          }
          body.push(b.expressionStatement(b.callExpression(b.identifier('cb'),[])))
          for(let num of combo) {
            body.push(
              b.expressionStatement(
                b.callExpression(
                  b.memberExpression(b.callExpression(b.identifier("expect"), [b.identifier(`obj${num}ThrowCount`)]), b.identifier('toEqual')),
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
    program += recast.print(clonedAst).code;
  }
}

fs.writeFileSync(path.join(__dirname, './PushCascade.mutable.unit.complex.generated.test.ts'), program)

// const isConsecutive = arr => arr.every((num, i) => num + 1 === arr[i + 1] || arr[i + 1] === undefined )
// b.filter(isConsecutive).filter(arr => arr.length > 1)
