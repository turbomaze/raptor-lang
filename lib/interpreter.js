/******************\
|    Interpreter   |
| @author Anthony  |
| @version 1.1     |
| @date 2016/07/10 |
| @edit 2016/07/12 |
\******************/

var util = require('util');
var Parser = require('./parser.js').Parser;
var langGrammar = require('../grammar/language-grammar.js');
var langStructure = require('../grammar/language-structure.js');

// exports
var exports = module.exports = {};
exports.ERR_CODE_SIZE = 100;
exports.ERR_RUNTIME = 101;
exports.ERR_COMPUTE = 102;

// config
var GOAL = 'program';

// helpers
function getSizeOfAST(ast) {
  var count = 1;

  var type = Object.prototype.toString.call(ast);
  switch (type) {
    // tokens with an additional type specification
    case '[object Object]':
      switch (ast.type) {
        case 'function':
          count += getSizeOfAST(ast.parameters);
          count += getSizeOfAST(ast.body);
          break;
        case 'call':
        case 'builtIn':
          count += getSizeOfAST(ast.arguments);
          break;
        case 'ifElse':
          count += getSizeOfAST(ast.predicate);
          count += getSizeOfAST(ast.body);
          count += getSizeOfAST(ast.else);
          break;
        case 'if':
          count += getSizeOfAST(ast.predicate);
          count += getSizeOfAST(ast.body);
          break;
        case 'return':
        case 'assignment':
          count += getSizeOfAST(ast.value);
          break;
        case 'operator': // incidental similarity with call's
          count += getSizeOfAST(ast.arguments);
          break;
      }
      break;

    // sequence of ASTs
    case '[object Array]':
      ast.forEach(function(node) {
        count += getSizeOfAST(node);
      }); 
      break;

    // terminals
    case '[object String]':
    case '[object Number]':
    case '[object Boolean]':
      break;
  }

  return count;
}

function exitIfExcessiveCompute(stats, limits) {
  if (stats['statement'] > limits.compute) {
    throw {message: 'too much compute', code: exports.ERR_COMPUTE};
  }
}

function logStats(type, stats, limits) {
  stats[type] = (stats[type] || 0) + 1;
  exitIfExcessiveCompute(stats, limits);
}

// interpreter object
function Interpreter(grammar, structure, builtIns) {
  this.parser = new Parser(grammar, structure);
  this.builtIns = builtIns;
  this.limits = {code: Infinity, compute: Infinity};
}

Interpreter.prototype.interpret = function(input, limits) {
  this.limits = limits || this.limits;

  // get the AST
  var ast = this.parser.parse(GOAL, input.split(''));

  // get the size of the AST
  var codeSize = getSizeOfAST(ast);
  if (codeSize > this.limits.code) {
     throw {message: 'too much code', code: exports.ERR_CODE_SIZE};
  }

  // run it
  var stats = {astSize: codeSize};
  var start = +new Date();
  try {
    this.runBlock({}, ast, stats);
    var end = +new Date();
    stats['time'] = end - start; // in ms
    return stats;
  } catch (e) {
    var end = +new Date();
    stats['time'] = end - start; // in ms
    if (typeof e !== 'string') {
      e['stats'] = stats;
      throw e;
    } else {
      throw {message: e, code: exports.ERR_RUNTIME, stats: stats};
    }
  }
};

Interpreter.prototype.runFunction = function(variables, call, stats) {
  var self = this;
  logStats('function', stats, this.limits);

  // get the definition
  var definition = {};
  if (
    call.name in variables &&
    typeof variables[call.name] === 'object' &&
    variables[call.name].type === 'function'
  ) {
    definition = variables[call.name];
  } else {
    throw 'ERR: function with name "' + call.name +
      '" is undefined or not in scope.';
  }

  // get the arguments
  var args = call.arguments.map(function(argument) {
    return self.evaluateExpression(variables, argument, stats);
  });

  // if they haven't supplied enough arguments, partially apply it
  var numPartials = Object.keys(definition.partials).length;
  var numArgs = numPartials + args.length;
  if (args.length < definition.parameters.length) {
    // copy the definition
    var newDefinition = JSON.parse(JSON.stringify(definition));

    // partially apply it
    for (var ai = numPartials; ai < numArgs; ai++) {
      // add to the partials dictionary, starting from the leftmost unset param
      var param = definition.parameters[ai];
      newDefinition.partials[param] = args[ai - numPartials];
    }

    // remove the partially applied parameters from the definition
    newDefinition.parameters = newDefinition.parameters.slice(args.length);

    // return the resulting function definition
    return newDefinition;
  }

  // handle scope stuff; functions can see 1) other functions
  var callVariables = {};
  for (var name in variables) {
    if (
      typeof variables[name] === 'object' &&
      variables[name].type === 'function'
    ) {
      callVariables[name] = variables[name];
    }
  }

  // 2) arguments
  for (var pi = 0; pi < definition.parameters.length; pi++) {
    callVariables[definition.parameters[pi]] = args[pi];
  }

  // 3) partials
  for (var partialArg in definition.partials) {
    callVariables[partialArg] = definition.partials[partialArg];
  }

  // 4) linked variables (from partial applications)
  for (var name in definition.partials) {
    callVariables[name] = definition.partials[name];
  }

  // actually run the function
  return this.runBlock(callVariables, definition.body, stats);
};

Interpreter.prototype.runBuiltIn = function(variables, call, stats) {
  var self = this;
  logStats('builtIn', stats, this.limits);

  // get the arguments
  var args = call.arguments.map(function(argument) {
    return self.evaluateExpression(variables, argument, stats);
  });

  // get the definition
  switch (call.name) {
    default:
      if (call.name in this.builtIns) {
        return this.builtIns[call.name].apply(this, args);
      } else return undefined;
  }
};

Interpreter.prototype.runBlock = function(variables, body, stats) {
  logStats('block', stats, this.limits);

  // run all of the statements in the body
  for (var si = 0; si < body.length; si++) {
    var statement = body[si];
    var value = this.executeStatement(variables, statement, stats);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
};

Interpreter.prototype.executeStatement = function(
  variables, statement, stats
) {
  logStats('statement', stats, this.limits);

  if (typeof statement === 'string') {
    // it's a naked identifier; treat it as a function call
    if (statement in variables && typeof variables[statement] === 'object') {
      return this.runFunction(
        variables,
        {
          'type': 'call',
          'name': statement,
          'arguments': []
        },
        stats
      );
    } else {
      throw 'ERR: lone identifier "' + statement + '" is not a valid statement.';
    }
  } else {
    switch (statement.type) {
      case 'function':
        variables[statement.name] = statement;
        return undefined;

      case 'call':
        this.runFunction(variables, statement, stats);
        return undefined;

      case 'builtIn':
        this.runBuiltIn(variables, statement, stats);
        return undefined;

      case 'return':
        return this.evaluateExpression(variables, statement.value, stats);

      case 'ifElse':
        var predicate = this.evaluateExpression(
          variables, statement.predicate, stats
        );
        if (predicate) {
          return this.runBlock(variables, statement.body, stats);
        } else {
          return this.runBlock(variables, statement.else, stats);
        }

      case 'if':
        var predicate = this.evaluateExpression(
          variables, statement.predicate, stats
        );
        if (predicate) {
          return this.runBlock(variables, statement.body, stats);
        }
        return undefined;

      case 'assignment':
        variables[statement.name] = this.evaluateExpression(
          variables, statement.value, stats
        ); 
        return undefined;
    }
  }

  return undefined;
};

Interpreter.prototype.evaluateExpression = function(
  variables, expression, stats
) {
  logStats('expression', stats, this.limits);

  if (typeof expression === 'string') {
    if (expression in variables) {
      return variables[expression];
    } else {
      throw 'ERR: identifier "' + expression + '" ' +
        'does not refer to an in-scope variable or function.';
    }
  } else if (typeof expression === 'number') {
    // it's a number 
    return expression;
  } else if (typeof expression === 'boolean') {
    // it's a boolean 
    return expression;
  } else {
    switch (expression.type) {
      case 'call':
        return this.runFunction(variables, expression, stats);

      case 'builtIn':
        return this.runBuiltIn(variables, expression, stats);

      case 'operator':
        return this.evaluateOperator(
          variables, expression.name, expression.arguments, stats
        );
    }
  }

  throw 'ERR: unknown expression "' + JSON.stringify(expression) + '"';
};

Interpreter.prototype.evaluateOperator = function(
  variables, name, args, stats
) {
  var self = this;
  logStats('operator', stats, this.limits);

  function getBadResultMessage(name) {
    return 'ERR: operation "' + name + '" returned an improper result.';
  }

  function getBadTypeMessage(position, functionName, typeExpected) {
    return 'ERR: expected the ' + position + ' argument of the "' + name +
      '" function to be of type "' + typeExpected + '".';
  }

  function handleUnaryOperator(name, inputs, type1, f) {
    inputs = inputs.map(function(arg) {
      return self.evaluateExpression(variables, arg, stats);
    });

    if (typeof inputs[0] !== type1) {
      throw getBadTypeMessage('first', name, type1);
    }

    var value = f(inputs[0]);
    if (value === Infinity || value === -Infinity || value === NaN || value === undefined) {
      throw getBadResultMessage(name);
    } else return value;
  }

  function handleBinaryOperator(name, inputs, type1, type2, f) {
    inputs = inputs.map(function(arg) {
      return self.evaluateExpression(variables, arg, stats);
    });

    if (typeof inputs[0] !== type1) {
      throw getBadTypeMessage('first', name, type1);
    }

    if (typeof inputs[1] !== type2) {
      throw getBadTypeMessage('second', name, type2);
    }

    var value = f(inputs[0], inputs[1]);
    if (value === Infinity || value === -Infinity || value === NaN || value === undefined) {
      throw getBadResultMessage(name);
    } else return value;
  }

  function handleBinaryNumericOperator(name, inputs, f) {
    return handleBinaryOperator(name, inputs, 'number', 'number', f);
  }

  function handleBinaryBooleanOperator(name, inputs, f) {
    return handleBinaryOperator(name, inputs, 'boolean', 'boolean', f);
  }

  switch (name) {
    case 'not':
      return handleUnaryOperator(name, args, 'boolean', function(a) {
        return !a;  
      });

    case '+':
      return handleBinaryNumericOperator(name, args, function(a, b) {
        return a + b;
      });

    case '-':
      return handleBinaryNumericOperator(name, args, function(a, b) {
        return a - b;
      });

    case '*':
      return handleBinaryNumericOperator(name, args, function(a, b) {
        return a * b;
      });

    case '/':
      return handleBinaryNumericOperator(name, args, function(a, b) {
        return Math.floor(a / b);
      });

    case 'or':
      return handleBinaryBooleanOperator(name, args, function(a, b) {
        return a || b;
      });

    case 'and':
      return handleBinaryBooleanOperator(name, args, function(a, b) {
        return a && b;
      });

    case '>':
      return handleBinaryNumericOperator(name, args, function(a, b) {
        return a > b;
      });

    case '<':
      return handleBinaryNumericOperator(name, args, function(a, b) {
        return a < b;
      });

    case '>=':
      return handleBinaryNumericOperator(name, args, function(a, b) {
        return a >= b;
      });

    case '<=':
      return handleBinaryNumericOperator(name, args, function(a, b) {
        return a <= b;
      });

    case '==':
      return handleBinaryNumericOperator(name, args, function(a, b) {
        return a == b;
      });

    case '!=':
      return handleBinaryNumericOperator(name, args, function(a, b) {
        return a != b;
      });

    default:
      throw 'ERR: Unknown operator "' + name + '".';
  }
};

exports.Interpreter = Interpreter;
exports.getSizeOfAST = getSizeOfAST;
