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
var input = `
divides => a => b {
  return b % a == 0
}

isPrime => n {
  return isPrimeh -> (n-1) -> n
}

isPrimeh => n => num {
  n > 1 {
    divides -> (n) -> num {
      return false
    } : {
      return isPrimeh -> (n-1) -> num
    }
  } : {
    return true
  }
}

loop => n => f {
  n > 0 {
    f
    loop -> (n-1) -> f
  }
}

loopPrime => a => which {
  a < 8 {
    b = isPrime -> a
    b or b {
      which or which {
        loop -> (a) -> moveRight
      } : {
        loop -> (a) -> dontMove
      }
      loopPrime -> (a+1) -> !which
    } : {
      loopPrime -> (a+1) -> which
    }
  }
}

moveRight
loopPrime -> 1 -> false
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
