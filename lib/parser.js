/******************\
|  General Parser  |
| @author Anthony  |
| @version 1.1     |
| @date 2016/06/17 |
| @edit 2016/07/14 |
\******************/

// exports
var exports = module.exports = {};

// config
var DEBUG = false;
var SUPER_DEBUG = false;

function Parser(grammar, structure) {
  this.grammar = getRulesFromEbnf(grammar);
  this.structure = structure;
}
Parser.prototype.parse = function(goal, tokens) {
  return parse(this.grammar, this.structure, goal, tokens);
};

function getRuleFromExpansion(expansion) {
  if (typeof expansion === 'function') return expansion;

  expansion = expansion.replace(/\s+/g, '');

  if (expansion.indexOf('|') !== -1) {
    // or
    var orArguments = expansion.split('|');
    var components = orArguments.map(function(ebnfRule) {
      return getRuleFromExpansion(ebnfRule);
    });
    return {'or': components};
  } else if (expansion.indexOf(',') !== -1) {
    // and
    var andArguments = expansion.split(',');
    var components = andArguments.map(function(ebnfRule) {
      return getRuleFromExpansion(ebnfRule);
    });
    return {'and': components};
  } else if (expansion.indexOf('+') === expansion.length - 1) {
    // repeat at least once
    var ebnfRule = expansion.substring(0, expansion.length - 1);
    return {'repeat': [1, 100, ebnfRule]};
  } else if (
      expansion.indexOf('{') === 0 &&
      expansion.indexOf('}') === expansion.length - 1
  ) {
    // repeat optionally
    var ebnfRule = expansion.substring(1, expansion.length - 1);
    return {'repeat': [0, 100, ebnfRule]};
  } else if (
      expansion.indexOf('[') === 0 &&
      expansion.indexOf(']') === expansion.length - 1
  ) {
    // optional
    var ebnfRule = expansion.substring(1, expansion.length - 1);
    return {'repeat': [0, 1, ebnfRule]};
  }

  return expansion;
}

function getRulesFromEbnf(ebnf) {
  var rules = {};
  for (var ruleName in ebnf) {
    rules[ruleName] = getRuleFromExpansion(ebnf[ruleName]);
  }
  return rules;
}

function parse(rules, structures, goal, tokens) {
  var ret = {};
  try {
    var conformsToRule = ruleApplies(rules, structures, goal, tokens, ret);
    if (ret.newTokens.length > 0) {
      var errorOffset = tokens.length - ret.minNumCharsLeft;
      var validPrefix = tokens.slice(0, errorOffset);
      var lineNumber = validPrefix.reduce(function(line, token) {
        return line + (token === '\n' ? 1 : 0);
      }, 1);
      throw {message: 'Unexpected characters on line '+lineNumber+'.'};
    } else {
      return ret.structure;
    }
  } catch (e) {
    var errorOffset = tokens.length - ret.minNumCharsLeft;
    var info = getLineAndPositionFromTokens(tokens, errorOffset);
    throw {
      message: 'ERR: syntax error on line ' + info.line + ' column '+info.col+'.',
      data: info
    };
  }
}

function ruleApplies(rules, structures, rule, tokens, ret) {
  var struct = typeof rule === 'string' ? rules[rule] : rule;
  ret.minNumCharsLeft = Math.min(
    ret.minNumCharsLeft, tokens.length
  ) || Infinity;

  if (SUPER_DEBUG && typeof rule === 'string') console.log(rule);

  // apply the rule
  var applies = false;
  switch (typeof struct) {
    case 'function':
      if (struct(tokens, ret)) {
        ret.minNumCharsLeft = Math.min(
          ret.minNumCharsLeft, ret.newTokens.length
        ) || Infinity;
        applies = true;
      } else {
        throw {
          message: 'Expected a function.',
          data: ret.newTokens.length
        };
      }
      break;
    case 'object':
      var builtIn = Object.keys(struct);
      if (builtIn.length > 0) {
        applies = applyBuiltIn(rules, structures, builtIn[0], struct[builtIn[0]], tokens, ret);
      }
      break;
    case 'string':
      applies = ruleApplies(rules, structures, struct, tokens, ret);
      break;
  }

  // apply the structural transformation
  if (applies && typeof rule === 'string') {
    var transform = structures[rule];

    if (typeof transform === 'object') transform = transform[ret.which];

    if (typeof transform !== 'function') transform = identity;

    ret.structure = transform.call(this, ret.structure);
  }

  if (applies && DEBUG) {
    console.log(rule, ':', JSON.stringify(tokens), JSON.stringify(ret.structure));
  }

  return applies;
}

function applyBuiltIn(rules, structures, type, components, tokens, ret) {
  var tempTokens = tokens.slice(0);
  ret.newTokens = tokens.slice(0);
  ret.minNumCharsLeft = Math.min(
    ret.minNumCharsLeft, tokens.length
  ) || Infinity;
  var doubleRet = {};
  var structureList = [];
  switch (type) {
    case 'or':
      for (var i = 0; i < components.length; i++) {
        try {
          if (ruleApplies(rules, structures, components[i], tokens, ret)) {
            ret.which = i;
            return true;
          }
        } catch (e) {
          // it's chill
          ret.minNumCharsLeft = Math.min(
            ret.minNumCharsLeft, e.data || Infinity
          );
        }
      }

      throw {
        message: 'Expected an or.',
        data: tokens.length
      };
    case 'and':
      try {
        for (var i = 0; i < components.length; i++) {
          if (ruleApplies(rules, structures, components[i], tempTokens, doubleRet)) {
            tempTokens = doubleRet.newTokens;
            ret.minNumCharsLeft = doubleRet.minNumCharsLeft = Math.min(
              ret.minNumCharsLeft, doubleRet.minNumCharsLeft
            ) || Infinity;
            structureList.push(doubleRet.structure);
          } else {
            ret.minNumCharsLeft = doubleRet.minNumCharsLeft = Math.min(
              ret.minNumCharsLeft, doubleRet.minNumCharsLeft
            ) || Infinity;
            throw {
              message: 'Expected an and.',
              data: Math.min(doubleRet.newTokens.length, tempTokens.length)
            };
          }
        }
        ret.newTokens = tempTokens;
        ret.structure = structureList;
        return true;
      } catch (e) {
        ret.minNumCharsLeft = Math.min(
          ret.minNumCharsLeft, e.data || Infinity
        );
        throw e; 
      }

    case 'repeat':
      if (components.length !== 3) return false;
      
      var min = components[0], max = components[1], rule = components[2];
      for (var counter = 0; counter < max; counter++) {
        try {
          if (ruleApplies(rules, structures, rule, tempTokens, doubleRet)) {
            tempTokens = doubleRet.newTokens;
            ret.minNumCharsLeft = doubleRet.minNumCharsLeft = Math.min(
              ret.minNumCharsLeft, doubleRet.minNumCharsLeft
            ) || Infinity;
            structureList.push(doubleRet.structure);
          } else {
            ret.minNumCharsLeft = doubleRet.minNumCharsLeft = Math.min(
              ret.minNumCharsLeft, doubleRet.minNumCharsLeft
            ) || Infinity;
          }
        } catch (e) {
          ret.minNumCharsLeft = Math.min(
            ret.minNumCharsLeft, e.data || Infinity
          );
          break;
        }
      }

      if (counter >= min) {
        ret.newTokens = tempTokens;
        ret.structure = structureList;
        return true;
      } else {
        ret.minNumCharsLeft = doubleRet.minNumCharsLeft = Math.min(
          ret.minNumCharsLeft, doubleRet.minNumCharsLeft
        ) || Infinity;
        throw {
          message: 'Expected a repeat.',
          data: tokens.length
        };
      }
  }

  throw {
    message: 'Unknown error.',
    data: tokens.length
  };
}

function getLineAndPositionFromTokens(tokens, offset) {
  var validPrefix = tokens.slice(0, offset);
  var lineNumber = validPrefix.reduce(function(line, token) {
    return line + (token === '\n' ? 1 : 0);
  }, 1);
  var colNum = validPrefix.reverse().reduce(function(col, token) {
    if (col[0] === false) {
      if (token !== '\n') col = [true, col[1] + 1];
    }
    return col;
  }, [false, 0])[1];
  return {line: lineNumber, col: colNum};
}

function identity(a) {
  return a;
}

exports.Parser = Parser;
