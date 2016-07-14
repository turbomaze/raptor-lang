/******************\
|   Experimental   |
| Functional Lang  |
| @author Anthony  |
| @version 0.2     |
| @date 2016/07/07 |
| @edit 2016/07/12 |
\******************/

// dependencies
var util = require('util');
var Parser = require('./lib/parser.js').Parser;
var Interpreter = require('./lib/interpreter.js').Interpreter;
var langGrammar = require('./grammar/language-grammar.js').grammar;
var langStructure = require('./grammar/language-structure.js').structure;

// working variables
var parser = new Parser(langGrammar, langStructure);
var interpreter = new Interpreter(langGrammar, langStructure, {
  'log': function() {
    console.log.apply(console, arguments);
    return undefined;
  },

  'random': function(n) {
    return Math.floor(n * Math.random());
  }
});

var limits = {code: 100, compute: 10000};
var input = `
add => a => b => c {
  return a + b + c
}

log -> add -> 4 -> 4 -> 2
add5 = add -> 5
add5and6 = add -> 5 -> 6
same = add5and6
log -> add5 -> 1 -> 19
log -> same -> 7
`;

// log the results
var ast = parser.parse('program', input.split(''));
console.log("Source:");
console.log(input.trim());

// console.log("\nAST:");
// console.log(util.inspect(ast, false, null));

console.log("\nInterpreting...");
try {
  console.log(interpreter.interpret(input, limits));
} catch (e) {
  console.log('ERROR');
  console.log(JSON.stringify(e, true, 4));
}
