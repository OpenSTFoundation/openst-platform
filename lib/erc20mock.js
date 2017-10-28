const Assert = require('assert');
const Crypto = require('crypto');

const SafeMath = require('./safeMath')


/** Generate transaction ID.
 * @return {string} New 32-byte transaction ID in hex format.
 */
function newTxID() {
  return "0x" + Crypto.randomBytes(32).toString('hex');
}


/** Enforce the argument is a valid Ethereum address. Throws if it's not.
 * @param {string} address The string to check.
 */
function enforceAddress(address) {
  Assert.ok(/^0x[0-9a-fA-F]{40}$/.test(address), `Invalid blockchain address: ${address}`);
}


/** Constructor.
 * @param {string} bank The address of the bank owning the entire supply
 * @param {number} supply The total supply, >0
 * @param {string} name The name of the token
 * @param {string} symbol The symbol of the token
 * @param {number} decimals The number of decimals for printing, 0≤n≤18
 */
const ERC20 = module.exports = function(bank, supply, name, symbol, decimals) {
  Assert.strictEqual(typeof bank, 'string', `bank must be of type 'string'`);
  Assert.strictEqual(typeof name, 'string', `name must be of type 'string'`);
  Assert.strictEqual(typeof symbol, 'string', `symbol must be of type 'string'`);
  Assert.strictEqual(typeof decimals, 'number', `decimals must be of type 'number'`);
  Assert.strictEqual(typeof supply, 'number', `supply must be of type 'number'`);
  Assert.ok(decimals >= 0, "decimals must be ≥ 0");
  Assert.ok(decimals <= 18, "decimans must be ≤ 18");
  Assert.strictEqual(decimals, Math.trunc(decimals));
  Assert.ok(supply > 0, "supply must be > 0");
  Assert.ok(supply <= Number.MAX_SAFE_INTEGER, "supply integer overflow");
  Assert.strictEqual(supply, Math.trunc(supply));
  enforceAddress(bank);
  this._reserve = bank;
  this._allowances = {};
  this._balances = {};
  this.name = _ => name;
  this.symbol = _ => symbol.toUpperCase();
  this.decimals = _ => decimals;
  this._balances[bank] = supply;
  this.totalSupply = _ => supply;
}


/**
 * @param {string} owner The address of the owner to check
 * @returns {number} Token balance for owner
 */
ERC20.prototype.balanceOf = function(owner) {
  Assert.strictEqual(typeof owner, 'string', `owner must be of type 'string'`);
  enforceAddress(owner);
  return Number(this._balances[owner] || 0);
}


/**
 * @param {string} sender The address of the sender
 * @param {string} to The address of the receiver
 * @param {number} value Number of tokens to transfer
 * @returns {string} New transaction ID
 */
ERC20.prototype.transfer = function(sender, to, value) {
  Assert.strictEqual(typeof sender, 'string', `sender must be of type 'string'`);
  Assert.strictEqual(typeof to, 'string', `to must be of type 'string'`);
  Assert.strictEqual(typeof value, 'number', `value must be of type 'number'`);
  Assert.strictEqual(value, Math.trunc(value));
  Assert.ok(value > 0, "Invalid value");
  enforceAddress(sender);
  enforceAddress(to);

  this._balances[sender] = SafeMath.sub(this._balances[sender], value);
  this._balances[to] = SafeMath.add(this._balances[to], value);
  return newTxID();
}


/**
 * @param {string} owner The address of the owner to check
 * @returns {number} Token allowance for owner
 */
ERC20.prototype.allowance = function(owner, spender) {
  Assert.strictEqual(typeof owner, 'string', `owner must be of type 'string'`);
  Assert.strictEqual(typeof spender, 'string', `spender must be of type 'string'`);
  enforceAddress(owner);
  enforceAddress(spender);

  const allowance = this._allowances[owner]||{};
  return Number(allowance[spender] || 0);
}


/**
 * @param {string} sender The address of the sender
 * @param {string} from The address of the spending account
 * @param {string} to The address of the receiver
 * @param {number} value Number of tokens to transfer
 * @returns {string} New transaction ID
 */
ERC20.prototype.transferFrom = function(sender, from, to, value) {
  Assert.strictEqual(typeof sender, 'string', `sender must be of type 'string'`);
  Assert.strictEqual(typeof from, 'string', `from must be of type 'string'`);
  Assert.strictEqual(typeof to, 'string', `to must be of type 'string'`);
  Assert.strictEqual(typeof value, 'number', `value must be of type 'number'`);
  Assert.strictEqual(value, Math.trunc(value));
  Assert.ok(value > 0, "Invalid value");
  enforceAddress(sender);
  enforceAddress(from);
  enforceAddress(to);

  const allowancesFrom = this._allowances[from]||{};
  allowancesFrom[sender] = SafeMath.sub(this.allowance(from, sender), value);
  this._allowances[from] = allowancesFrom;

  return this.transfer(from, to, value);
}


/**
 * @param {string} sender The address of the sender
 * @param {string} spender The address of the spender
 * @param {number} value Number of tokens to approve
 * @returns {string} New transaction ID
 */
ERC20.prototype.approve = function(sender, spender, value) {
  Assert.strictEqual(typeof sender, 'string', `sender must be of type 'string'`);
  Assert.strictEqual(typeof spender, 'string', `spender must be of type 'string'`);
  Assert.strictEqual(typeof value, 'number', `value must be of type 'number'`);
  Assert.strictEqual(value, Math.trunc(value));
  Assert.ok(value >= 0, "Invalid value");
  enforceAddress(sender);
  enforceAddress(spender);

  const allowancesFrom = this._allowances[sender]||{};
  allowancesFrom[spender] = value;
  this._allowances[sender] = allowancesFrom;
  return newTxID();
}
