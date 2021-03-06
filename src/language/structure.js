// Raptor-lang structure
// @author Anthony Liu
// @date 2016/08/25

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
        'type': 'assignment',
        'labeledValue': identifier,
        'value': value
      };
    },
  
    // general expressions
    'expression': [chainedBinaryOperators],
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

    // lists
    'list': function(args) {
      return (args[2].length > 0 ? args[2][0] : []);
    },
    'values': function(args) {
      var struct = [args[0]];
      var commaValues = args[1];
      commaValues.forEach(function(commaValue) {
        struct.push(commaValue[3]);
      });
      return struct;
    },
    'listAccess': function(args) {
      var indices = [args[2][0]].concat(args[2][1].map(
        function(arg) {
          return arg[1];  
        }
      ));
      return {
        'type': 'access',
        'name': args[0],
        'indices': indices
      };
    },
  
    // keywords
    'true': function(args) { return true; },
    'false': function(args) { return false; },
  
    // basic helpers
    'decimal': function(args) {
      var left = args[1];
      var right = args[3];
      var sum = left + right;
      if (args[0].length > 0) return -sum;
      else return sum;
    },
    'fractionalPart': [
      function(args) {
        var numZeroes = args[0].length;
        var places = Math.ceil(Math.log10(args[1]));
        var denominator = args[1] === 0 ? 1 : Math.pow(
          10, numZeroes + places
        );
        return args[1]/denominator;
      },
      function(args) {return 0;}
    ],
    'integer': function(args) {
      if (args[0].length > 0) return -args[1];
      else return args[1];
    },
    'wholeNumber': [
      function(args) {
        var digits = [args[0]].concat(args[1]);
        var sum = 0;
        for (var i = 0; i < digits.length; i++) {
          var place = digits.length - i - 1;
          sum += digits[i] * Math.pow(10, place);
        }
        return sum;
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

