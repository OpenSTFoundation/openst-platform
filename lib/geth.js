const Web3 = require('web3');
const Assert = require('assert');

const Config = require('../config.json');


const Geth = module.exports = {};

Geth.ValueChain = new Web3(new Web3.providers.HttpProvider(Config.ValueChain.Rpc));
Geth.ValueChain._id = "VC";

Geth.UtilityChain = new Web3(new Web3.providers.HttpProvider(Config.UtilityChain.Rpc));
Geth.UtilityChain._id = "UC";

const DEF_DEPLOY_GAS = 4000000;

/** Helper for deploying a contract, if changed.
 * @param {string} sender Address of sender
 * @param {object} contract Contract JSON
 * @param {string?} oldAddress Old address of this contract
 * @param {...} args Optional constructor arguments
 * @returns {Promise<string>} Resolves to address of contract
 */
Web3.prototype.deployContract = function(sender, contract, oldAddress, ...args) {
    const minimumGasPrice = 100;
    const forceRedeployContract = true;
    const newCodeWithCtor = "0x" + contract.bin;
    return Promise.resolve()
        .then(_ => oldAddress ? this.eth.getCode(oldAddress) : "")
        .then(oldCode => {
            if (oldCode.length > 2 && newCodeWithCtor.endsWith(oldCode.substr(2)) && !forceRedeployContract ) { 
                // console.log("Skipped: contract body unchanged; constructor/args might have changed though!");
                return oldAddress;
            }
            else {
                return this.eth.personal.unlockAccount(sender)
                    // unlockAccount always fails under testrpc
                    .catch(err => console.error(this._id, err.message || err))
                    .then(success => {
                        const abi = JSON.parse(contract.abi);

                        // Fix for web3js bug: create data first. but deploy to correct chain
                        const txdata = new this.eth.Contract(abi, null)
                            .deploy({data: newCodeWithCtor, arguments: args})
                            .encodeABI();

                        //Make sure contracts are not deployed with 0 gas price.
                        // console.log("deployContract :: contract.gas = " , contract.gas);
                        var contractGasPrice = contract.gas || minimumGasPrice;
                        // console.log("...final contractGasPrice = " + contractGasPrice);


                        return this.eth.sendTransaction({from: sender, data: txdata, gas: contract.gas || DEF_DEPLOY_GAS, gasPrice: contractGasPrice })
                            .on("transactionHash", txid => console.log(this._id, "TxHash =", txid))
                            //.on("receipt", value => console.log(this._id, value))
                            .then(instance => {
                                return this.eth.getCode(instance.contractAddress)
                                    .then(code => {
                                        Assert(code.length > 2 && newCodeWithCtor.endsWith(code.substr(2)));
                                        return instance.contractAddress
                                    })

                            });
                    });
            }
        });
};
