// Raptor-lang std library
// @author Anthony Liu
// @date 2016/08/21

module.exports = {
  'log': function() {
    console.log.apply(console, arguments);
    return undefined;
  },

  'random': function(n) {
    return Math.floor(n * Math.random());
  }
};
