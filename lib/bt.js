const Assert = require('assert');

const BrandedTokenJson = require("../contracts/UtilityToken.json");
const Geth = require('./geth');
const Config = require('../config.json');

const BrandedTokenContract = BrandedTokenJson.contracts['UtilityToken.sol:UtilityToken'];


/** Constructor.
 * @param {string} mcAddress Ethereum address of member company (owner)
 * @param {string?} btAddress Ethereum address of ERC20 branded token contract
 */
const BrandedToken = module.exports = function(mcAddress, btAddress) {
    Assert.strictEqual(typeof mcAddress, 'string', `mcAddress must be of type 'string'`);
    // Assert.strictEqual(typeof btAddress, 'string', `btAddress must be of type 'string'`);

    this._mcAddress = mcAddress;
    const btAbi = JSON.parse(BrandedTokenContract.abi);
    this._btInstance = new Geth.UtilityChain.eth.Contract(btAbi, btAddress, {gasPrice: 0, gas: 1000000});
    this._btInstance.setProvider(Geth.UtilityChain.currentProvider);
};


/** Deploy a new instance.
 * @param {string} symbol The symbol of the token
 * @param {string} name The name of the token
 * @param {number} decimals The number of decimals for printing, 0≤n≤18
 * @param {string} chainId The ID of the side-chain
 */
BrandedToken.prototype.deploy = function(symbol, name, decimals, chainId) {
    Assert.strictEqual(typeof symbol, 'string', `symbol must be of type 'string'`);
    Assert.strictEqual(typeof name, 'string', `name must be of type 'string'`);
    Assert.strictEqual(typeof decimals, 'number', `decimals must be of type 'number'`);
    Assert.strictEqual(typeof chainId, 'string', `chainId must be of type 'string'`);
    Assert.notEqual(symbol, "");
    Assert.notEqual(name, "");
    Assert.ok(decimals > 0, "decimals must be ≥ 0");
    Assert.ok(decimals <= 18, "decimals must be ≤ 18");
    Assert.strictEqual(decimals, Math.trunc(decimals));

    const oldAddress = this._btInstance.options.address;

    // Set gasPrice to 0 so we don't consume utility-chain-ether for deployment
    BrandedTokenContract.gasPrice = 0;
    return Geth.UtilityChain.deployContract(this._mcAddress, BrandedTokenContract, oldAddress, symbol, name, decimals, chainId);
};


/**
 * @param {string} uuid
 * @param {string} minter
 * @param {string|number} minterNonce
 * @param {string|number} amountST
 * @param {string|number} amountUT Amount of UT to mint
 * @param {string|number} escrowUnlockHeight
 * @param {string} mintingIntentHash
 * @returns {Promise} Transaction receipt
 */
BrandedToken.prototype.mint = function(uuid, minter, minterNonce, amountST, amountUT, escrowUnlockHeight, mintingIntentHash) {

    Assert.strictEqual(typeof uuid, 'string', `uuid must be of type 'string'`);
    Assert.strictEqual(typeof minter, 'string', `minter must be of type 'string'`);
    Assert.strictEqual(typeof mintingIntentHash, 'string', `mintingIntentHash must be of type 'string'`);
    Assert.ok(amountST > 0, "amountST should be greater than 0");
    Assert.ok(amountUT > 0, "amountUT should be greater than 0");

    return Geth.UtilityChain.eth.personal.unlockAccount(Config.SimpleTokenFoundation)
        .then(_ => {
            return this._btInstance.methods.mint(uuid, minter, minterNonce, amountST, amountUT, escrowUnlockHeight, mintingIntentHash).send({from: Config.SimpleTokenFoundation});
        });
};


/**
 * @param {string|number} amountUT Amount of UT to redeem
 * @returns {Promise} Transaction receipt
 */
BrandedToken.prototype.redeem = function(amountUT) {

    Assert.ok(amountUT > 0, "amountUT should be greater than 0");

    return Geth.UtilityChain.eth.personal.unlockAccount(this._mcAddress)
        .then(_ => {
            return this._btInstance.methods.redeem(amountUT).send({from: this._mcAddress});
        });
};


/**
 * @returns {Promise} UUID
 */
BrandedToken.prototype.uuid = function(amountUT) {

    return this._btInstance.methods.uuid().call({from: this._mcAddress});
};
