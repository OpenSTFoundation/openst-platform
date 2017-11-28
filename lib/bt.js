const Assert = require('assert');

const UtilityTokenJson = require("../contracts/UtilityToken.json");
const Geth = require('./geth');
const coreConstants = require('../config/core_constants');
const coreAddresses = require('../config/core_addresses')
    , userName = 'registrar';
const UtilityTokenContract = UtilityTokenJson.contracts['UtilityToken.sol:UtilityToken'];


/** Constructor.
 * @param {string} mcAddress Ethereum address of member company (owner)
 * @param {string?} btAddress Ethereum address of ERC20 branded token contract
 */
const UtilityToken = module.exports = function(mcAddress, btAddress) {
    Assert.strictEqual(typeof mcAddress, 'string', `mcAddress must be of type 'string'`);
    // Assert.strictEqual(typeof btAddress, 'string', `btAddress must be of type 'string'`);

    this._mcAddress = mcAddress;
    const btAbi = JSON.parse(UtilityTokenContract.abi);
    this._btInstance = new Geth.UtilityChain.eth.Contract(btAbi, btAddress, {gasPrice: 0, gas: 1000000});
    this._btInstance.setProvider(Geth.UtilityChain.currentProvider);
};


/** Deploy a new instance.
 * @param {string} symbol The symbol of the token
 * @param {string} name The name of the token
 * @param {number} decimals The number of decimals for printing, 0≤n≤18
 * @param {string} chainId The ID of the side-chain
 */
UtilityToken.prototype.deploy = function(symbol, name, decimals, chainId, deployer) {
    deployer = deployer || this._mcAddress;
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
    UtilityTokenContract.gasPrice = 0;
    return Geth.UtilityChain.deployContract(deployer, UtilityTokenContract, oldAddress, symbol, name, decimals, chainId);
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
UtilityToken.prototype.mint = function(uuid, minter, minterNonce, amountST, amountUT, escrowUnlockHeight, mintingIntentHash) {
    const REGISTRAR_ADDRESS = coreAddresses.getAddressForUser(userName);
    const REGISTRAR_KEY = coreAddresses.getPassphraseForUser(userName);

    Assert.strictEqual(typeof uuid, 'string', `uuid must be of type 'string'`);
    Assert.strictEqual(typeof minter, 'string', `minter must be of type 'string'`);
    Assert.strictEqual(typeof mintingIntentHash, 'string', `mintingIntentHash must be of type 'string'`);
    Assert.ok(amountST > 0, "amountST should be greater than 0");
    Assert.ok(amountUT > 0, "amountUT should be greater than 0");

    return Geth.UtilityChain.eth.personal.unlockAccount( REGISTRAR_ADDRESS, REGISTRAR_KEY)
        .then(_ => {
            return this._btInstance.methods.mint(uuid, minter, minterNonce, amountST, amountUT,
              escrowUnlockHeight, mintingIntentHash).send({
                from: REGISTRAR_ADDRESS,
                gasPrice: coreConstants.OST_VALUE_GAS_PRICE
            });
        });
};


/**
 * @param {string|number} amountUT Amount of UT to redeem
 * @returns {Promise} Transaction receipt
 */
UtilityToken.prototype.redeem = function(amountUT) {

    Assert.ok(amountUT > 0, "amountUT should be greater than 0");

    return Geth.UtilityChain.eth.personal.unlockAccount(this._mcAddress)
        .then(_ => {
            return this._btInstance.methods.redeem(amountUT).send({
                from: this._mcAddress,
                gasPrice: coreConstants.OST_VALUE_GAS_PRICE
            });
        });
};


/**
 * @returns {Promise} UUID
 */
UtilityToken.prototype.uuid = function(amountUT) {

    return this._btInstance.methods.uuid().call({from: this._mcAddress});
};
