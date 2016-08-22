// Raptor-lang tests
// @author Anthony Liu
// @date 2016/08/21

// dependencies
var assert = require('assert');
var raptor = require('../src/raptor.js')('std');

// config
var limits = {code: 100, compute: 10000};

describe('Raptor', function() {
  describe('#std', function() {
    describe('#interpret', function() {
      it('should be able to return explicit values', function() {
        var input = 'return 101';
        var actual = raptor.interpret(input, limits);
        var expected = 101;
        assert.deepEqual(actual, expected);
      });

      it('should be able to return variables', function() {
        var input = `
a = 101
return a
`;
        var actual = raptor.interpret(input, limits);
        var expected = 101;
        assert.deepEqual(actual, expected);
      });

      it('should be able to evaluate explicit expressions', function() {
        var input = `
a = 101 + 331
return a
`;
        var actual = raptor.interpret(input, limits);
        var expected = 101 + 331;
        assert.deepEqual(actual, expected);
      });

      it('should be able to evaluate expressions with variables', function() {
        var input = `
a = 100
b = 101*a
return b
`;
        var actual = raptor.interpret(input, limits);
        var expected = 101*100;
        assert.deepEqual(actual, expected);
      });

      it('should be able to declare and use functions', function() {
        var input = `
f => a {
  return 10 + a
}
return f -> 100
`;
        var actual = raptor.interpret(input, limits);
        var expected = 110;
        assert.deepEqual(actual, expected);
      });

      it('should be able to use conditionals', function() {
        var input = `
f => a {
  a % 2 == 0 {
    return 10
  } : {
    return 20
  }
}
return (f -> 1) + (f -> 2)
`;
        var actual = raptor.interpret(input, limits);
        var expected = 30;
        assert.deepEqual(actual, expected);
      });

      it('should be able to use recursion', function() {
        var input = `
f => n {
  n <= 2 {
    return 1
  } : {
    return (f -> n - 1) + (f -> n - 2)
  }
}
return f -> 7
`;
        var actual = raptor.interpret(input, limits);
        var expected = 13;
        assert.deepEqual(actual, expected);
      });

      it('should be able to pass functions as arguments', function() {
        var input = `
applyTwice => f => x {
  return f -> (f -> x)
}
g => x {
  return x + 1
}
return applyTwice -> (g) -> 4
`;

        var actual = raptor.interpret(input, limits);
        var expected = 6;
        assert.deepEqual(actual, expected);
      });

      it('should be able to partially apply functions', function() {
        var input = `
applyTwice => f => x {
  return f -> (f -> x)
}
g => x {
  return x + 1
}
applyGTwice = applyTwice -> g
return applyGTwice -> 4
`;

        var actual = raptor.interpret(input, limits);
        var expected = 6;
        assert.deepEqual(actual, expected);
      });
    });
  });
});
