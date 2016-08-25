// Raptor-lang tests
// @author Anthony Liu
// @date 2016/08/23

// dependencies
var assert = require('assert');
var raptor = require('../src/raptor')('std');

// config
var limits = {code: 100, compute: 10000};

describe('Raptor', function() {
  describe('#std', function() {
    describe('#interpret', function() {
      it('should return integers', function() {
        var input = 'return 101';
        var actual = raptor.interpret(input, limits);
        var expected = 101;
        assert.deepEqual(actual, expected);
      });

      it('should parse simple doubles', function() {
        var input = 'return 3.14159';
        var actual = raptor.interpret(input, limits);
        var expected = 3.14159;
        assert.deepEqual(actual, expected);
      });

      it('should parse negative doubles', function() {
        var input = 'return -1.6180339';
        var actual = raptor.interpret(input, limits);
        var expected = -1.6180339;
        assert.deepEqual(actual, expected);
      });

      it('should parse tiny doubles', function() {
        var input = 'return 0.000123';
        var actual = raptor.interpret(input, limits);
        var expected = 0.000123;
        assert.deepEqual(actual, expected);
      });

      it('should parse redundant doubles', function() {
        var input = 'return 420.000';
        var actual = raptor.interpret(input, limits);
        var expected = 420;
        assert.deepEqual(actual, expected);
      });

      it('should return variables', function() {
        var input = `
a = 101
return a
`;
        var actual = raptor.interpret(input, limits);
        var expected = 101;
        assert.deepEqual(actual, expected);
      });

      it('should evaluate explicit expressions', function() {
        var input = `
a = 101 + 331
return a
`;
        var actual = raptor.interpret(input, limits);
        var expected = 101 + 331;
        assert.deepEqual(actual, expected);
      });

      it('should evaluate expressions with variables', function() {
        var input = `
a = 100
b = 101*a
return b
`;
        var actual = raptor.interpret(input, limits);
        var expected = 101*100;
        assert.deepEqual(actual, expected);
      });

      it('should parse empty lists', function() {
        var input = 'return []';
        var actual = raptor.interpret(input, limits);
        var expected = [];
        assert.deepEqual(actual, expected);
      });

      it('should parse simple lists', function() {
        var input = 'return [1, 2, 3]';
        var actual = raptor.interpret(input, limits);
        var expected = [1, 2, 3];
        assert.deepEqual(actual, expected);
      });

      it('should parse nested lists', function() {
        var input = 'return [1, [2, 3], true]';
        var actual = raptor.interpret(input, limits);
        var expected = [1, [2, 3], true];
        assert.deepEqual(actual, expected);
      });

      it('should access elements of simple lists', function() {
        var input = `
a = [1, 2, 3]
return a_1
`;
        var actual = raptor.interpret(input, limits);
        var expected = 2;
        assert.deepEqual(actual, expected);
      });

      it('should access elements of nested lists', function() {
        var input = `
a = [0, [1, [2, true, 3]], 4]
return a_1,1,2
`;
        var actual = raptor.interpret(input, limits);
        var expected = 3;
        assert.deepEqual(actual, expected);
      });

      it('should access lists with variable indices', function() {
        var input = `
idx = 2
a = [1, 2, 3]
return a_idx
`;
        var actual = raptor.interpret(input, limits);
        var expected = 3;
        assert.deepEqual(actual, expected);
      });

      it('should access lists with expression indices', function() {
        var input = `
a = [1, 2, 3]
c = 10
return a_(c*c - 99)
`;
        var actual = raptor.interpret(input, limits);
        var expected = 2;
        assert.deepEqual(actual, expected);
      });

      it('should declare and use functions', function() {
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

      it('should use conditionals', function() {
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

      it('should use recursion', function() {
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

      it('should pass functions as arguments', function() {
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

      it('should partially apply functions', function() {
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
