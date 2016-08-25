// Raptor-lang grammar
// @author Anthony Liu
// @date 2016/08/23

// keywords
var KEYWORDS = {
  returnWord: 'return',
  elseWord: ':',
  andWord: 'and',
  orWord: 'or',
  trueWord: 'true',
  falseWord: 'false'
};

// built in functions
var BUILT_INS = ['log', 'random'];
for (var ai = 0; ai < BUILT_INS.length; ai++) {
  KEYWORDS[BUILT_INS[ai]] = BUILT_INS[ai];
}
var GET_BUILT_IN = function(tokens, ret) {
  for (var ai = 0; ai < BUILT_INS.length; ai++) {
    var str = BUILT_INS[ai];
    if (tokens.length >= str.length) {
      var attempt = tokens.slice(0, str.length).join('');
      if (attempt === str) {
        ret.newTokens = tokens.slice(str.length);
        ret.structure = str;
        return true;
      }
    }
  }
  return false;
};

// helper functions
function isNotKeyword(word) {
  var keywords = KEYWORDS;
  for (var keyword in KEYWORDS) {
    if (word === KEYWORDS[keyword]) {
      return false;
    }
  }
  return true;
}

function isLetter(letter) {
  if (letter.length < 1) return false;
  letter = letter.toLowerCase();
  return letter >= 'a' && letter <= 'z';
}

function isDigit(digit) {
  return digit >= '0' && digit <= '9';
}

function getCharFunc(c) {
  return function(tokens, ret) {
    var isChar = tokens.length >= 1 && tokens[0] === c;
    if (isChar) {
      ret.newTokens = tokens.slice(1);
      ret.structure = tokens[0];
    }
    return isChar;
  };
}

function getStringFunc(str) {
  return function(tokens, ret) {
    if (tokens.length >= str.length) {
      var attempt = tokens.slice(0, str.length).join('');
      if (attempt === str) {
        ret.newTokens = tokens.slice(str.length);
        ret.structure = str;
        return true;
      }
    }
    return false;
  };
}

// grammar rules
module.exports = {
  keywords: KEYWORDS,

  grammar: {
    // higher level language concepts
    'program': '[ extendedSpace ], statements, [ extendedSpace ]',
    'statements': 'statement, { newlineStatement }',
    'newlineStatement': '\
      spaceNewlineSpace, [ extendedSpace ], statement \
    ',
    'statement': 'assignment | return | function | ifElse | if | call',
    'function': '\
      identifier, [ space ], parameterList, [ extendedSpace ], block \
    ',
    'call': '\
      labeledValue, [ space ], argumentList | \
      builtInFunctions, [ space ], argumentList \
    ',
    'parameterList': '{ fatArrowIndentifier }',
    'argumentList': '{ arrowExpression }',
    'fatArrowIndentifier': 'fatArrow, [ space ], identifier, [ space ]',
    'arrowExpression': 'arrow, [ space ], expression, [ space ]',
    'ifElse': '\
      expression, [ space ], block, [ extendedSpace ], \
      elseWord, [ space ], block \
    ',
    'if': 'expression, [ space ], block',
    'block': '\
      leftBrace, [ extendedSpace ], statements, \
      [ extendedSpace ], rightBrace \
    ',
    'return': 'returnWord, [ space ], expression',
    'assignment': 'labeledValue, [ space ], eq, [ space ], expression',

    // general expressions (boolean and numeric)
    'expression': 'boolTerm, { orBoolTerm } | list',
    'orBoolTerm': 'space, or, space, boolTerm',
    'boolTerm': 'notBoolGroup, { andNotBoolGroup }',
    'andNotBoolGroup': 'space, and, space, notBoolGroup',
    'notBoolGroup': '[ not ], boolGroup',
    'boolGroup': '\
      boolRelation | call | labeledValue | true | false \
    ',
    'boolRelation': '\
      numExpression, [ boolOpNumExpression ] \
    ',
    'boolOpNumExpression': '\
      [ space ], binBoolOp, [ space ], numExpression \
    ',
    'binBoolOp': 'lteq | gteq | lt | gt | eqeq | notEq',
    'numExpression': 'term, { weakNumOpTerm }',
    'weakNumOpTerm': '[ space ], weakNumOp, [ space ], term',
    'term': 'group, { strongNumOpGroup }',
    'strongNumOpGroup': '[ space ], strongNumOp, [ space ], group',
    'group': '\
      number | call | labeledValue | \
      left, [ space ], expression, [ space ], right \
    ',
    'labeledValue': 'listAccess | identifier',

    // lists
    'list': '\
      leftBracket, [ extendedSpace ], [ values ], \
      rightBracket \
    ',
    'values': 'value, { commaValue }',
    'commaValue': '[ space ], comma, [ extendedSpace ], value',
    'value': 'number | boolean | list | labeledValue',
    'listAccess': 'identifier, underscore, expressionList',
    'expressionList': 'expression, { commaExpression }',
    'commaExpression': 'comma, expression',
    
    // keywords
    'builtInFunctions': GET_BUILT_IN,
    'returnWord': getStringFunc(KEYWORDS.returnWord),
    'elseWord': getStringFunc(KEYWORDS.elseWord),
    'and': getStringFunc(KEYWORDS.andWord),
    'or': getStringFunc(KEYWORDS.orWord),
    'true': getStringFunc(KEYWORDS.trueWord),
    'false': getStringFunc(KEYWORDS.falseWord),

    // basic helpers
    'identifier': function(tokens, ret) {
      if (tokens.length >= 1) {
        if (isLetter(tokens[0])) {
          var identifier = tokens[0];
          for (var i = 1; i < tokens.length; i++) {
            if (isLetter(tokens[i]) || isDigit(tokens[i])) {
              identifier += tokens[i];
            } else break;
          }

          if (isNotKeyword(identifier)) {
            ret.newTokens = tokens.slice(identifier.length);
            ret.structure = identifier;
            return true;
          } else return false;
        }
      }
      return false;
    },
    'number': 'decimal | integer',
    'decimal': '[ negative ], wholeNumber, dot, fractionalPart',
    'fractionalPart': '{ zero }, wholeNumber | zero+',
    'integer': '[ negative ], wholeNumber',
    'wholeNumber': 'nonzeroDigit, { digit } | zero',
    'boolean': 'true | false',
    'extendedSpace': 'spaceNewlineSpace+ | space',
    'spaceNewlineSpace': '[ space ], newline, [ space ]',
    'space': 'blankChar, { blankChar }',
    'alphanum': function(tokens, ret) {
      if (tokens.length < 1) return false;

      var character = tokens[0];
      if (isLetter(character) || isNumber(character)) {
        ret.newTokens = tokens.slice(1);
        ret.structure = tokens[0];
        return true;
      } else {
        return false;
      }
    },

    // fundamental building blocks (terminals)
    'fatArrow': getStringFunc('=>'),
    'arrow': getStringFunc('->'),

    'eqeq': getStringFunc('=='),
    'notEq': getStringFunc('!='),
    'not': getStringFunc('!'),
    'lt': getCharFunc('<'),
    'gt': getCharFunc('>'),
    'lteq': getStringFunc('<='),
    'gteq': getStringFunc('>='),

    'weakNumOp': 'plus | minus',
    'strongNumOp': 'mod | times | divide',
    'plus': getCharFunc('+'),
    'minus': getCharFunc('-'),
    'mod': getCharFunc('%'),
    'times': getCharFunc('*'),
    'divide': getCharFunc('/'),
    'negative': getCharFunc('-'),

    'left': getCharFunc('('),
    'right': getCharFunc(')'),
    'leftBrace': getCharFunc('{'),
    'rightBrace': getCharFunc('}'),
    'leftBracket': getCharFunc('['),
    'rightBracket': getCharFunc(']'),
    'semicolon': getCharFunc(';'),
    'dot': getCharFunc('.'),
    'comma': getCharFunc(','),
    'underscore': getCharFunc('_'),
    'newline': getCharFunc('\n'), // TODO: pay attn to \r's too
    'eq': getCharFunc('='),
    'blankChar': function(tokens, ret) {
      var isBlank = tokens.length >= 1 && tokens[0].match(
        /^[ \t]/
      ) !== null;
      if (isBlank) {
        ret.newTokens = tokens.slice(1);
        ret.structure = tokens[0];
      }
      return isBlank;
    },
    'letter': function(tokens, ret) {
      if (tokens.length < 1) return false;

      var letter = tokens[0];
      if (isLetter(letter)) {
        ret.newTokens = tokens.slice(1);
        ret.structure = tokens[0];
        return true;
      } else return false;
    },
    'zero': function(tokens, ret) {
      if (tokens.length < 1) return false;

      if (isDigit(tokens[0]) && tokens[0] === '0') {
        ret.newTokens = tokens.slice(1);
        ret.structure = tokens[0];
        return true;
      } else return false;
    },
    'nonzeroDigit': function(tokens, ret) {
      if (tokens.length < 1) return false;

      if (isDigit(tokens[0]) && tokens[0] !== '0') {
        ret.newTokens = tokens.slice(1);
        ret.structure = tokens[0];
        return true;
      } else return false;
    },
    'digit': function(tokens, ret) {
      if (tokens.length < 1) return false;

      if (isDigit(tokens[0])) {
        ret.newTokens = tokens.slice(1);
        ret.structure = tokens[0];
        return true;
      } else return false;
    }
  }
};

