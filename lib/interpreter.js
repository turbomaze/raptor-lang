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
  return this.runFunctionBody('0-MAIN', {}, ast);
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

  // handle scope stuff
  // TODO: check arity
  var callVariables = {};
  for (var pi = 0; pi < definition.parameters.length; pi++) {
    callVariables[definition.parameters[pi]] = args[pi];
  }

  // actually run the function
  return this.runFunctionBody(call.name, callVariables, definition.body.statements);
};

Interpreter.prototype.runFunctionBody = function(name, callVariables, body) {
  // copy the arguments into the scope
  var variables = {};
  for (var argName in callVariables) variables[argName] = callVariables[argName];

  // run all of the statements in the body
  for (var si = 0; si < body.length; si++) {
    var statement = body[si];
    if (typeof statement === 'object' && statement.type === 'return') {
      return this.evaluateExpression(variables, statement.value);
    } else {
      this.executeStatement(variables, statement);
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
        break;

      case 'call':
        this.runFunction(variables, statement);
        break;

      case 'ifElse':
        return true;

      case 'if':
        return true;
        variables[statement.name] = this.evaluateExpression(
          variables, statement.value
        ); 
        break;

      case 'assignment':
        variables[statement.name] = this.evaluateExpression(
          variables, statement.value
        ); 
        break;
    }
  }
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
      throw 'ERR: identifier ' + expression +
        ' does not refer to an in-scope variable or function.';
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

  function getBadTypeMessage(position, functionName, typeExpected) {
    return 'ERR: expected the ' + position + ' argument of the "' + name +
      '" function to be of type "' + typeExpected + '".';
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

    return f(inputs[0], inputs[1]);
  }

  function handleBinaryNumericOperator(name, inputs, f) {
    return handleBinaryOperator(name, inputs, 'number', 'number', f);
  }

  function handleBinaryBooleanOperator(name, inputs, f) {
    return handleBinaryOperator(name, inputs, 'boolean', 'boolean', f);
  }

  switch (name) {
    case '+':
      return handleBinaryNumericOperator(name, args, function(a, b) {
        return a + b;
      });

    case '*':
      return handleBinaryNumericOperator(name, args, function(a, b) {
        return a * b;
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
