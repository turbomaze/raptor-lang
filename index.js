/******************\
|   Experimental   |
| Functional Lang  |
| @author Anthony  |
| @version 0.2     |
| @date 2016/07/07 |
| @edit 2016/07/10 |
\******************/

// dependencies
var util = require('util');
var Parser = require('./lib/parser.js').Parser;
var Interpreter = require('./lib/interpreter.js').Interpreter;
var langGrammar = require('./grammar/language-grammar.js').grammar;
var langStructure = require('./grammar/language-structure.js').structure;

// working variables
var parser = new Parser(langGrammar, langStructure);
var interpreter = new Interpreter(langGrammar, langStructure);

var goal = 'program';
var input = `

fib => n {
  n == 0 {
    return 0
  }

  n == 1 {
    return 1
  }

  return (fib -> n - 1) + (fib -> n - 2)
}

double => x {
  return x * 2
}

return fib -> double -> 10
`;


// log the results
var ast = parser.parse(goal, input.split(''));
console.log("Source:");
console.log(input.trim());

// console.log("\nAST:");
// console.log(util.inspect(ast, false, null));

console.log("\nInterpreting...");
console.log(interpreter.interpret(input));
