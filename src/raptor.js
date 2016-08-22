// Raptor-lang
// @author Anthony Liu
// @date 2016/08/21

// dependencies
var Interpreter = require('./interpreter.js').Interpreter;
var libraries = {
  std: require('./libraries/std.js')
};
var grammar = require('./language/grammar.js').grammar;
var structure = require('./language/structure.js').structure;

module.exports = function(library) {
  library = library || 'std';

  // support user-defined and built-in libraries
  builtIns = library;
  if (typeof library === 'string') {
    if (!(library in libraries)) {
      throw 'RAPTOR ERR: unknown library "' + library + '".';
    } else {
      builtIns = libraries[library];
    }
  }

  var interpreter = new Interpreter(
    grammar,
    structure,
    builtIns
  );

  return {
    parse: interpreter.parser.parse.bind(interpreter.parser),
    interpret: interpreter.interpret.bind(interpreter)
  };
};
