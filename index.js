/******************\
|   Experimental   |
| Functional Lang  |
| @author Anthony  |
| @version 0.1     |
| @date 2016/07/07 |
| @edit 2016/07/10 |
\******************/

// dependencies
var util = require('util');
var Parser = require('./lib/parser.js').Parser;
var Interpreter = require('./lib/interpreter.js').Interpreter;
var langGrammar = require('./grammar/language-grammar.js');
var langStructure = require('./grammar/language-structure.js');

// working variables
var parser = new Parser(langGrammar, langStructure);
var interpreter = new Interpreter(parser);

var goal = 'program';
var input = `
triple => x {
  31 > x + 3 {
    return 2 * x
  }
  return 0
}

let a = 10
log -> triple -> triple -> a
`;


// log the results
var ast = parser.parse(goal, input.split(''));
console.log("Source:");
console.log(input.trim());

console.log("\nAST:");
console.log(util.inspect(ast, false, null));

console.log("\nInterpreting...");
console.log(interpreter.interpret(input));
