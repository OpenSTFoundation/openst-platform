const Web3 = require('web3');

const Config = require('../config.json');


const Geth = module.exports = {};

Geth.ValueChain = new Web3(new Web3.providers.HttpProvider(Config.ValueChain.Rpc));

Geth.UtilityChain = new Web3(new Web3.providers.HttpProvider(Config.UtilityChain.Rpc));


/** Helper for deploying a contract, if changed.
 * @param {string} sender Address of sender
 * @param {object} contract Contract JSON
 * @param {string?} oldAddress Old address of this contract
 * @param {...} args Optional constructor arguments
 * @returns {Promise} Resolves to address of contract
 */
Web3.prototype.deployContract = function(sender, contract, oldAddress, ...args) {

    const newCode = "0x" + contract.bin;
    return Promise.resolve()
        .then(_ => oldAddress ? this.eth.getCode(oldAddress) : "")
        .then(oldCode => {
            // Reconsider this optimization
            // if (oldCode.length > 2 && newCode.endsWith(oldCode.substr(2))) {
            //     console.log("Skipped: contract body unchanged; constructor might have changed though!");
            //     return oldAddress;
            // }
            // else {
                return this.eth.personal.unlockAccount(sender)
                    .catch(_ => "unlockAccount fails on testrpc")
                    .then(success => {
                        const abi = JSON.parse(contract.abi);
                        return new this.eth.Contract(abi, oldAddress, {gasPrice: contract.gasPrice})
                            .deploy({data: newCode, arguments: args})
                            .send({from: sender, gas: contract.gas || 4000000, gasPrice: contract.gasPrice})
                            .on("transactionHash", txid => console.log(txid))
                            .then(instance => instance.options.address);
                    });
            // }
        });
};
