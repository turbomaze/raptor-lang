/******************\
|   Raptor Lang    |
| @author Anthony  |
| @version 0.2     |
| @date 2016/08/21 |
| @edit 2016/08/21 |
\******************/

// dependencies
var libraries = {
  std: require('./src/libs/std.js')
};
var Interpreter = require('./src/interpreter.js').Interpreter;
var grammar = require('./grammar/language-grammar.js').grammar;
var structure = require('./grammar/language-structure.js').structure;

module.exports = function(library) {
  library = library || 'std';

  // support user-defined and built-in libraries
  builtIns = library;
  if (typeof library === 'string') {
    if (!(library in libraries)) {
      throw 'RAPTOR ERROR: unknown library "' + library + '".';
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
