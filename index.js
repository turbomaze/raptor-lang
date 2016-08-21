/******************\
|   Raptor Lang    |
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
var input = `g {
  log -> 35
  return 111
}
foo {
  log -> 22
}
foo
`;

try {
  interpreter.interpret(input, limits);
} catch (e) {
  console.log(JSON.stringify(e, true, 4));
}
