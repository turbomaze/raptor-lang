/******************\
|     Language     |
|     Structure    |
| @author Anthony  |
| @version 0.2     |
| @date 2016/07/07 |
| @edit 2016/07/12 |
\******************/

// helper functions
function binaryOperator(args) {
  return {
    'type': 'operator',
    'name': args[2],
    'arguments': [args[0], args[4]]
  };
}

function chainedBinaryOperators(args) {
  var struct = args[0];
  var opExpressions = args[1];
  opExpressions.forEach(function(opExpression) {
    var unit = {
      'type': 'operator',
      'name': opExpression[1],
      'arguments': [struct, opExpression[3]]
    };
    struct = unit;
  });
  return struct;
}

function first(args) { return args[0]; }
function second(args) { return args[1]; }
function third(args) { return args[2]; }
function secondMap(args) {
  return args.map(function(arg) {
    return arg[2];  
  });
} 

// structural rules
module.exports = {
  structure: {
    // higher level language concepts
    'program': second,
    'statements': function(args) {
      return [args[0]].concat(args[1].map(function(newlineStatement) {
        return newlineStatement[2];  
      }));
    },
    'function': function(args) {
      return {
        'type': 'function',
        'name': args[0],
        'parameters': args[2],
        'partials': {},
        'body': args[4]
      };
    },
    'call': [
      function(args) {
        if (args[2].length === 0) {
          return args[0]; // treat it as an identifier
        } else {
          return {
            'type': 'call',
            'name': args[0],
            'arguments': args[2],
          };
        }
      },

      function(args) {
        return {
          'type': 'builtIn',
          'name': args[0],
          'arguments': args[2],
        };
      }
    ],
    'parameterList': secondMap,
    'argumentList': secondMap,
    'ifElse': function(args) {
      return {
        'type': 'ifElse', 'predicate': args[0], 'body': args[2], 'else': args[6]
      };
    },
    'if': function(args) {
      return {
        'type': 'if', 'predicate': args[0], 'body': args[2]
      };
    },
    'block': function(args) {
      return args[2];
    },
    'return': function(args) {
      return {
        'type': 'return', 'value': args[2]
      };
    },
    'assignment': function(args) {
      var identifier = args[0]; 
      var value = args[4]; 
      return {
        'type': 'assignment', 'name': identifier, 'value': value
      };
    },
  
    // general expressions
    'expression': chainedBinaryOperators,
    'boolTerm': chainedBinaryOperators,
    'notBoolGroup': function(args) {
      if (args[0].length > 0) {
        return {
          'type': 'operator',
          'name': args[0][0],
          'arguments': [args[1]]
        };
      } else return args[1];
    },
    'boolRelation': function(args) {
      if (args[1].length === 0) {
        return args[0];
      } else {
        return {
          'type': 'operator',
          'name': args[1][0][1],
          'arguments': [args[0], args[1][0][3]],
        };
      }
    },
    'numExpression': chainedBinaryOperators,
    'term': chainedBinaryOperators,
    'group': [null, null, null, third],
  
    // keywords
    'true': function(args) { return true; },
    'false': function(args) { return false; },
  
    // basic helpers
    'number': [
      function(args) {
        var digits = [args[1]].concat(args[2]);
        var sum = 0;
        for (var i = 0; i < digits.length; i++) {
          var place = digits.length - i - 1;
          sum += digits[i] * Math.pow(10, place);
        }

        if (args[0].length > 0) return -sum;
        else return sum;
      }
    ],
  
    // fundamental building blocks (terminals)
    'not': function(not) {return 'not';},
    'space': function(space) {return ' ';},
    'zero': function(number) {return parseInt(number);},
    'nonzeroDigit': function(number) {return parseInt(number);},
    'digit': function(number) {return parseInt(number);}
  }
};

