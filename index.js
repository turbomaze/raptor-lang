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
var input = `foobar => x => y {
  return .a * 2
}
log -> 16
`;

// log the results
console.log("Source:");
console.log(input.trim());
try {
  var ast = parser.parse('program', input.split(''));
} catch (e) {
  // chill
}

// console.log("\nAST:");
// console.log(util.inspect(ast, false, null));

console.log("\nInterpreting...");
try {
  console.log(interpreter.interpret(input, limits));
} catch (e) {
  console.log(JSON.stringify(e, true, 4));
}
