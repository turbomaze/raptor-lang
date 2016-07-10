/******************\
|   Experimental   |
| Functional Lang  |
| @author Anthony  |
| @version 0.1     |
| @date 2016/07/07 |
| @edit 2016/07/10 |
\******************/

var util = require('util');
var Parser = require('./lib/parser.js').Parser;
var langGrammar = require('./grammar/language-grammar.js');
var langStructure = require('./grammar/language-structure.js');
var parser = new Parser(langGrammar, langStructure);

var goal = 'program';
var input = `
triple => x {
  31 + 1 > a*1 + 3 {
    let x = 311
  } : {
    let x = 55
  }
}

triple -> x < 4
`;


// log te results
var results = parser.parse(goal, input.split(''));
console.log(input);
console.log(util.inspect(results, false, null));
