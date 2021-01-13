import * as recast from 'recast';
import * as typescriptParser from 'recast/parsers/typescript.js'
const b = recast.types.builders;
console.log(Object.getOwnPropertyNames(recast.types))
const fun = node => b.tryStatement(b.blockStatement([
  node
]),
  b.catchClause(
    b.identifier('errorOrProm'),
    null,
    b.blockStatement([
      b.expressionStatement(b.awaitExpression(b.identifier('errOrProm'))),
      node
    ])
  )
)


const ast = recast.parse(`  it("should run immutable to mutable to immutable to immutable", () => {
  const obj1 = PushCascade.of(() => ({ val: 1 }))

  const obj2 = obj1.map(obj => ({ ...obj, foo: 2 }))

  const obj3 = obj2.tap(obj => { obj.bar = 3 })

  const obj4 = obj3.map(obj => ({ ...obj, baz: 4 }))

  const obj5 = obj4.map(obj => ({ ...obj, foobar: 5 }))

  expect(obj1.get()).toStrictEqual({ val: 1 })
  expect(obj2.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
  expect(obj3.get()).toStrictEqual({ val: 1, foo: 2, bar: 3 })
  expect(obj4.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4 })
  expect(obj5.get()).toStrictEqual({ val: 1, foo: 2, bar: 3, baz: 4, foobar: 5 })
})`, { parser: typescriptParser })

// all possible combos of 01234
function* getAllCombo(arr, prev = []) {
  for (let a = 0; a < arr.length; a++) {
    let combo = [...prev, arr[a]]
    yield combo;
    yield* getAllCombo(arr.slice(a + 1), combo)
  }
}
let combos = [...getAllCombo([0, 1, 2, 3, 4])]
let program = '';
for (const combo of combos) {
  const clonedAst = recast.parse(recast.print(ast), { parser: typescriptParser });
  recast.visit(clonedAst, {
    visitArrowFunctionExpression(path) {
      if (path.parent.value.callee.name === 'it') {
        const body = path.value.body.body
        console.log(body)
        const newBody = []
        for (let index of combo) {

          let expr = b.returnStatement( body[index].declarations[0].init)
          // let expr = `${body[1].declarations[0].id.name} = ${recast.print(body[1].declarations[0].init).code}`
          const iife = b.variableDeclaration('const', [b.variableDeclarator(b.identifier(`obj${index + 1}`), b.callExpression(b.arrowFunctionExpression([], b.blockStatement([fun(expr)])),[]))])

          body[index] = iife
        }
      }

      this.traverse(path)
    }
  })
  program += recast.print(clonedAst)
}

console.log(program)



// const isConsecutive = arr => arr.every((num, i) => num + 1 === arr[i + 1] || arr[i + 1] === undefined )
// b.filter(isConsecutive).filter(arr => arr.length > 1)
