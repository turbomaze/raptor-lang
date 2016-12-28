#!/usr/bin/env node

var raptor = require('../src/raptor')();
var interpreter = require('../src/interpreter');
var fs = require('fs');
var program = require('commander');

// defaults
var defaults = {
  library: 'std',
  code: 100,
  compute: 1000
};

// specify the program
program
  .description('run a raptor-lang program')
  .version('0.4.0')
  .option('-l, --library [value]', 'Add a library')
  .option('-c, --code [n]', 'Set a code limit', parseInt)
  .option('-m, --compute [n]', 'Set a compute limit', parseInt)
  .parse(process.argv)

// get the arguments; set default values
if (!program.library || typeof program.library !== 'string') {
  program.library = defaults.library;
}
if (isNaN(program.code)) {
  program.code = defaults.code;
}
if (isNaN(program.compute)) {
  program.compute = defaults.compute;
}
program.fileName = program.args[0];

// run the command
var limits = {
  code: program.code,
  compute: program.compute
};
fs.readFile(program.fileName, 'utf8', function(err, sourceCode) {
  if (err) {
    return console.log(err);
  }

  try {
    var stats = {};
    raptor.interpret(sourceCode, limits, stats);

    console.log('\n=== RUNTIME STATS ===');
    console.log(JSON.stringify(stats));
  } catch (e) {
    if (e.code === interpreter.ERR_RUNTIME) {
      console.log('=== RUNTIME ERROR ===');
    } else {
      console.log('=== LIMIT ERROR ===')
    }
    console.log(e.message);
  }
});
