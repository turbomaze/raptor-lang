/******************\
|    Interpreter   |
| @author Anthony  |
| @version 1.1     |
| @date 2016/07/10 |
| @edit 2016/07/10 |
\******************/

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
  return this.runFunction({}, ast);
};
Interpreter.prototype.runFunction = function(args, body) {
  // copy the arguments into the scope
  var variables = {};
  for (var name in args) variables[name] = args[name];

  // run all of the statements in the body
  for (var si = 0; si < body.length; si++) {
    var statement = body[si];
    if (typeof statement === 'string') {
      // it's a naked identifier; treat it as a function call
    } else {
      switch (statement.type) {
        case 'assignment':
          variables[statement.name] = this.evaluateExpression(
            variables, statement.value
          ); 
          break;
      }
    }
  }

  console.log(variables);
};
Interpreter.prototype.evaluateExpression = function(variables, expression) {
  if (typeof expression === 'string') {
    // it's a naked identifier; might be a function call
    if (expression in variables) {
      return variables[expression];
    } else {
      throw 'ERR: identifier ' + expression +
        ' does not refer to an in-scope variable.';
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
        // get the function definition
        // evaluate its arguments
        // make the function call
        break;
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
