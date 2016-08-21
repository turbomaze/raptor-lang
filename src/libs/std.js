/******************\
|   Raptor Lang    |
| @author Anthony  |
| @version 0.2     |
| @date 2016/08/21 |
| @edit 2016/08/21 |
\******************/

module.exports = {
  'log': function() {
    console.log.apply(console, arguments);
    return undefined;
  },

  'random': function(n) {
    return Math.floor(n * Math.random());
  }
};
