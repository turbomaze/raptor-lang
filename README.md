Raptor Lang
===

An experimental, interpreted programming language implemented in JavaScript.

Originally made for use in the [Velociraptor Escape](https://github.com/turbomaze/velociraptor-escape) part of the HackMIT 2016 puzzle.

## Usage

Raptor is on [npm](https://www.npmjs.com/package/raptor-lang). Use it as follows:

```javascript
// 'std' indicates which built-in library to use
var raptor = require('raptor-lang')('std');

// required Raptor source code
var program = `
logYear {
  foo = 200
  log -> 10*foo + 16
}
logYear
return 1618
`;

// optional limits on the code complexity / compute time
var limits = {code: 100, compute: 1000};

// optional way to accumulate execution statistics
var stats = {};

// side effects:
// * console.log's 2016
// * stats = {astSize: 18, statement: 5, time: 2, ...}
// * result = 1618
var result = raptor.interpret(program, limits, stats);
```

### Syntax

[WIP]

## License

MIT License: http://igliu.mit-license.org/
