/******************\
|    Interpreter   |
| @author Anthony  |
| @version 1.1     |
| @date 2016/07/10 |
| @edit 2016/07/10 |
\******************/

var util = require('util');
var Parser = require('./parser.js').Parser;
var langGrammar = require('../grammar/language-grammar.js');
var langStructure = require('../grammar/language-structure.js');

// exports
var exports = module.exports = {};

// config
var GOAL = 'program';

function Interpreter() {
  this.parser = new Parser(langGrammar.grammar, langStructure.structure);
}

Interpreter.prototype.interpret = function(input) {
  // get the AST
  var ast = this.parser.parse(GOAL, input.split(''));

  // run it
  return this.runBlock({}, ast);
};

Interpreter.prototype.runFunction = function(variables, call) {
  var self = this;

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
    return self.evaluateExpression(variables, argument);
  });

  // handle scope stuff; functions can see 1) other functions and 2) arguments
  var callVariables = {};
  for (var name in variables) {
    if (
      typeof variables[name] === 'object' &&
      variables[name].type === 'function'
    ) {
      callVariables[name] = variables[name];
    }
  }

  for (var pi = 0; pi < definition.parameters.length; pi++) {
    callVariables[definition.parameters[pi]] = args[pi];
  }

  // actually run the function
  return this.runBlock(callVariables, definition.body);
};

Interpreter.prototype.runBlock = function(variables, body) {
  // run all of the statements in the body
  for (var si = 0; si < body.length; si++) {
    var statement = body[si];
    var value = this.executeStatement(variables, statement);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
};

Interpreter.prototype.executeStatement = function(variables, statement) {
  if (typeof statement === 'string') {
    // it's a naked identifier; treat it as a function call
    if (statement in variables && typeof variables[statement] === 'object') {
      return this.runFunction(
        variables, {
          'type': 'call',
          'name': statement,
          'arguments': []
        }
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
        this.runFunction(variables, statement);
        return undefined;

      case 'return':
        return this.evaluateExpression(variables, statement.value);

      case 'ifElse':
        var predicate = this.evaluateExpression(variables, statement.predicate);
        if (predicate) {
          return this.runBlock(variables, statement.body);
        } else {
          return this.runBlock(variables, statement.else);
        }

      case 'if':
        var predicate = this.evaluateExpression(variables, statement.predicate);
        if (predicate) {
          return this.runBlock(variables, statement.body);
        }
        return undefined;

      case 'assignment':
        variables[statement.name] = this.evaluateExpression(
          variables, statement.value
        ); 
        return undefined;
    }
  }

  return undefined;
};

Interpreter.prototype.evaluateExpression = function(variables, expression) {
  if (typeof expression === 'string') {
    if (expression in variables) {
      // it's a naked identifier; might be a function call
      if (typeof variables[expression] === 'object') {
        return this.evaluateExpression(
          variables, {
            'type': 'call',
            'name': expression,
            'arguments': []
          }
        );
      } else {
        return variables[expression];
      }
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
        return this.runFunction(variables, expression);

      case 'operator':
        return this.evaluateOperator(
          variables, expression.name, expression.arguments
        );
    }
  }

  throw 'ERR: unknown expression "' + JSON.stringify(expression) + '"';
};

Interpreter.prototype.evaluateOperator = function(variables, name, args) {
  var self = this;

  function getBadResultMessage(name) {
    return 'ERR: operation "' + name + '" returned an improper result.';
  }

  function getBadTypeMessage(position, functionName, typeExpected) {
    return 'ERR: expected the ' + position + ' argument of the "' + name +
      '" function to be of type "' + typeExpected + '".';
  }

  function handleUnaryOperator(name, inputs, type1, f) {
    inputs = inputs.map(function(arg) {
      return self.evaluateExpression(variables, arg);
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
      return self.evaluateExpression(variables, arg);
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
      throw 'Unknown operator "' + name + '"';
  }
};

exports.Interpreter = Interpreter;
