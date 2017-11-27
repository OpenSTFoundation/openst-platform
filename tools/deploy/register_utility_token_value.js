"use strict";

const rootPrefix = '../..'
    , readline = require('readline')
    , config = require(rootPrefix + '/config.json')
    , deployerName = "deployer"
    , web3Provider = require(rootPrefix+'/lib/web3/providers/value_rpc')
    , deployHelper = require('./helper')
    , coreConstants = require(rootPrefix+'/config/core_constants')
    , coreAddresses = require(rootPrefix+'/config/core_addresses')
    , prompts = readline.createInterface(process.stdin, process.stdout)
    , deployerAddress = coreAddresses.getAddressForUser(deployerName)
    ;


const performer = async function() {

    console.log("Deployer Address: " + deployerAddress);
    console.log("Value Chain Registrar Address: " + coreAddresses.getAddressForUser("registrar"));
    console.log("Core Contract Address: " + coreAddresses.getAddressForContract('valueCore'));

    // await new Promise(
    //     function (onResolve, onReject){
    //         prompts.question("Please verify all above details. Do you want to proceed? [Y/N]", function (intent) {
    //             if (intent === 'Y') {
    //                 console.log('Great! Proceeding deployment.');
    //                 prompts.close();
    //                 onResolve();
    //             } else {
    //                 console.log('Exiting deployment scripts. Change the env vars and re-run.');
    //                 process.exit(1);
    //             }
    //         });
    //     }
    // );

    // deploy Core contract
    var contractName = 'valueCore'
        ,contractAbi = coreAddresses.getAbiForContract(contractName)
        ,contractBin = coreAddresses.getBinForContract(contractName)
        ,constructorArgs = [
        coreAddresses.getAddressForContract("valueRegistrar")
        coreConstants.OST_VALUE_CHAIN_ID,
        coreConstants.OST_UTILITY_CHAIN_ID,
        coreAddresses.getAddressesForContract("openSTUtility")]

    console.log("Deploying valueCore Contract on ValueChain");
    var contractDeployTxReceipt = await deployHelper.perform(
        contractName,
        web3Provider,
        contractAbi,
        contractBin,
        deployerName,
        constructorArgs
    );
    console.log(contractDeployTxReceipt);
    console.log(contractName + " Contract deployed ");

    //set ops address to VC registrar addr



};

performer();