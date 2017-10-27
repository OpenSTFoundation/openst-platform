const Assert = require('assert');

const SimpleTokenStakeJson = require("../contracts/Staking.json");
const Geth = require('./geth');

const SimpleTokenStakeContract = SimpleTokenStakeJson.contracts['Staking.sol:Staking'];

function enforceAddress(address) {
    Assert.ok(Geth.ValueChain.utils.isAddress(address), `Invalid blockchain address: ${address}`);
}


/** Constructor.
 * @param {string} memberCompany The address of the memberCompany
 * @param {string?} address The address of the staking contract
 */
const StakeContract = module.exports = function(memberCompany, address) {
  Assert.strictEqual(typeof memberCompany, 'string', `memberCompany must be of type 'string'`);
  // Assert.strictEqual(typeof address, 'string', `address must be of type 'string'`);
  enforceAddress(memberCompany);
  // enforceAddress(address);

  this._memberCompany = memberCompany;
  const stakeAbi = JSON.parse(SimpleTokenStakeContract.abi);
  this._instance = new Geth.ValueChain.eth.Contract(stakeAbi, address);
};


/** Deploy a new instance.
 * @param {string} erc20address The address of the SimpleToken ERC20
 */
StakeContract.prototype.deploy = function(erc20address) {
  Assert.strictEqual(typeof erc20address, 'string', `erc20address must be of type 'string'`);
  enforceAddress(erc20address);

  const oldAddress = this._instance.options.address;
  return Geth.ValueChain.deployContract(this._memberCompany, SimpleTokenStakeContract, oldAddress, erc20address);
};


/**
 * @param {number|string} amount Amount to raise the stake by
 * @returns {boolean|Promise} false or receipt
 */
StakeContract.prototype.increaseStake = function(amount) {
  return this._instance.methods.increaseStake(amount).call({from: this._memberCompany})
    .then(result => {
      if (result !== true) {
        return result;
      }
      return Geth.ValueChain.eth.personal.unlockAccount(this._memberCompany).then(_ => {
        return this._instance.methods.increaseStake(amount).send({from: this._memberCompany, gas: 100000});
      });
  });
};


/**
 * @param {number|string} amount Amount to decrease the stake by
 * @returns {boolean|Promise} false or receipt
 */
StakeContract.prototype.decreaseStake = function(amount) {
  return this._instance.methods.decreaseStake(amount).call({from: this._memberCompany})
    .then(result => {
      if (result !== true) {
        return result;
      }
      return Geth.ValueChain.eth.personal.unlockAccount(this._memberCompany).then(_ => {
        return this._instance.methods.decreaseStake(amount).send({from: this._memberCompany, gas: 100000});
      });
  });
};
