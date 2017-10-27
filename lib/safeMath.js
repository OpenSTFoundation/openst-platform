const Assert = require('assert');

/**
 * @param {Number} a lhs
 * @param {Number} b rhs
 * @returns {Number} Result of a - b
 */
function sub(a, b) {
  const n = Number(a || 0) - Number(b || 0);
  Assert.ok(n >= 0, "Insufficient funds");
  Assert.ok(n <= Number.MAX_SAFE_INTEGER, "Overflow");
  return n;
}


/**
 * @param {Number} a lhs
 * @param {Number} b rhs
 * @returns {Number} Result of a + b
 */
function add(a, b) {
  const n = Number(a || 0) + Number(b || 0);
  Assert.ok(n <= Number.MAX_SAFE_INTEGER, "Overflow");
  Assert.ok(n >= 0, "Insufficient funds");
  return n;
}


module.exports = {
    add: add,
    sub: sub
};
