/******************\
|   Raptor Lang    |
| @author Anthony  |
| @version 0.2     |
| @date 2016/07/07 |
| @edit 2016/08/21 |
\******************/

// dependencies
var raptor = require('./raptor.js')('std');

// working variables
var limits = {code: 100, compute: 10000};
var input = `
isPrime => n {
  return isPrimeH -> (n) -> n - 1
}

isPrimeH => n => a {
  a == 1 {
    return true
  }

  n % a == 0 {
    return false
  } : {
    return isPrimeH -> (n) -> (a - 1)
  }
}

log -> isPrime -> 2
log -> isPrime -> 18
log -> isPrime -> 119
log -> isPrime -> 139
`;

try {
  raptor.interpret(input, limits);
} catch (e) {
  console.log(JSON.stringify(e, true, 4));
}
