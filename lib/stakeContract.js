const Assert = require('assert');
const coreConstants = require('../config/core_constants');

const SimpleTokenStakeJson = require("../contracts/Staking.json");
const Geth = require('./geth');

const SimpleTokenStakeContract = SimpleTokenStakeJson.contracts['Staking.sol:Staking'];

function enforceAddress(address) {
    Assert.ok(Geth.ValueChain.utils.isAddress(address), `Invalid blockchain address: ${address}`);
}


/** Constructor.
 * @param {string} foundation The address of the foundation
 * @param {string?} address The address of the staking contract
 */
const StakeContract = module.exports = function(foundation, address) {
  Assert.strictEqual(typeof foundation, 'string', `foundation must be of type 'string'`);
  // Assert.strictEqual(typeof address, 'string', `address must be of type 'string'`);
  enforceAddress(foundation);
  // enforceAddress(address);

  this._admin = coreAddresses.getAddressForUser('registrar');
  this._foundation = foundation;
  const stakeAbi = JSON.parse(SimpleTokenStakeContract.abi);
  this._instance = new Geth.ValueChain.eth.Contract(stakeAbi, address);
  this._instance.setProvider(Geth.ValueChain.currentProvider);
};


/** Deploy a new instance.
 * @param {string} erc20address The address of the SimpleToken ERC20
 */
StakeContract.prototype.deploy = function(erc20address) {
  Assert.strictEqual(typeof erc20address, 'string', `erc20address must be of type 'string'`);
  enforceAddress(erc20address);

  const oldAddress = this._instance.options.address;
  return Geth.ValueChain.deployContract(this._foundation, SimpleTokenStakeContract, oldAddress, erc20address);
};


/**
 * @param {string} member member company address
 * @param {string} uuid UUID of the UT
 * @param {number|string} amount Amount to raise the stake by
 * @returns {boolean|Promise} false or receipt
 */
StakeContract.prototype.stake = function(member, uuid, amount) {
  Assert.strictEqual(typeof member, 'string', `member must be of type 'string'`);
  Assert.strictEqual(typeof uuid, 'string', `uuid must be of type 'string'`);
  // Assert.strictEqual(typeof amount, 'string', `amount must be of type 'string'`);

  return this._instance.methods.stake(uuid, amount).call({from: member})
    .then(result => {
      if (result == 0) {
        return result;
      }
      return Geth.ValueChain.eth.personal.unlockAccount(member).then(_ => {
        return this._instance.methods.stake(uuid, amount).send({
          from: member, gas: 1000000,
          gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE
        }).then(txreceipt => {
            txreceipt.value = result;

            return txreceipt;
          });
      });
  });
};

/**
 * @param {string} member member company address
 * @param {string} uuid UUID of the UT
 * @param {string} hashIntent The HashIntent to be used.
 * @returns {boolean|Promise} false or receipt
 */
StakeContract.prototype.processStaking = function(member, uuid, hashIntent) {
  Assert.strictEqual(typeof member, 'string', `member must be of type 'string'`);
  Assert.strictEqual(typeof uuid, 'string', `uuid must be of type 'string'`);
  // Assert.strictEqual(typeof amount, 'string', `amount must be of type 'string'`);
  console.info( " processStaking : \n\t uuid : ", uuid,"\n\t hashIntent:", hashIntent, "\n\t from: ", member );
  return this._instance.methods.processStaking(uuid, hashIntent).call({from: member})
    .then(result => {
      // console.info( " processStaking then " , arguments );
      if (result == 0) {
        // console.warn(" IMP [result = 0] ");
        return result;
      }
      return Geth.ValueChain.eth.personal.unlockAccount(member).then(_ => {
        // console.log(" GOOD [result != 0] ");
        return this._instance.methods.processStaking(uuid, hashIntent).send({
          from: member,
          gas: 1000000,
          gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE
        }).then(txreceipt => {
            console.log(" GOOD processStaking done ");
            txreceipt.value = result;
            return txreceipt;
          });
      });
  });
};


/**
 * @param {number|string} amount Amount to decrease the stake by
 * @returns {boolean|Promise} false or receipt
 */
StakeContract.prototype.decreaseStake = function(amount) {
  return this._instance.methods.decreaseStake(amount).call({from: this._foundation})
    .then(result => {
      if (result !== true) {
        return result;
      }
      return Geth.ValueChain.eth.personal.unlockAccount(this._foundation).then(_ => {
        return this._instance.methods.decreaseStake(amount).send({
          from: this._foundation,
          gas: 100000,
          gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE
        });
      });
  });
};


/**
 *
 */
StakeContract.prototype.registerUtilityToken = function(symbol, name, decimals, conversionRate, chainId, member) {
  Assert.strictEqual(typeof symbol, 'string', `symbol must be of type 'string'`);
  Assert.strictEqual(typeof name, 'string', `name must be of type 'string'`);
  Assert.strictEqual(typeof decimals, 'number', `decimals must be of type 'number'`);
  Assert.strictEqual(typeof conversionRate, 'number', `conversionRate must be of type 'number'`);
  Assert.strictEqual(typeof chainId, 'string', `chainId must be of type 'string'`);
  Assert.strictEqual(typeof member, 'string', `member must be of type 'string'`);



  return this._instance.methods.registerUtilityToken(symbol, name, decimals, conversionRate, chainId, member).call({from: this._admin})
    .then(result => {
      if (result == 0x0) {
        return result;
      }
      return Geth.ValueChain.eth.personal.unlockAccount(this._admin).then(_ => {
        return this._instance.methods.registerUtilityToken(symbol, name, decimals,
          conversionRate, chainId, member).send({
          from: this._admin,
          gas: 1000000,
          gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE
        }).then(txreceipt => {
            txreceipt.value = result;
            return txreceipt;
          });
      });
    });
}
