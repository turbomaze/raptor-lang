/******************\
|    Interpreter   |
| @author Anthony  |
| @version 1.1     |
| @date 2016/07/10 |
| @edit 2016/07/10 |
\******************/

var Parser = require('./parser.js').Parser;

// exports
var exports = module.exports = {};

// config
var GOAL = 'program';

function Interpreter(parser) {
  this.parser = parser;
}
Interpreter.prototype.interpret = function(input) {
  // get the AST
  var ast = this.parser.parse(GOAL, input.split(''));

  // interpret it
  return true;
};

exports.Interpreter = Interpreter;
