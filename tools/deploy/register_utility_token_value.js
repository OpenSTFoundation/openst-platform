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
    , OpenStValueContractInteract = require(rootPrefix+'/lib/contract_interact/openst_value')
    , populateEnvVars = require(rootPrefix+"/lib/populate_env_vars.js")
    ;

function updateConfig(valueCoreContractAddr) {

    return new Promise( (resolve,reject) => {
            logger.step("Updating Source file open_st_env_vars");
    populateEnvVars.renderAndPopulate('valueCore', {
        ost_value_core_contract_address: valueCoreContractAddr
    });

})
.catch( reason =>  {
        logger.error("Failed to populate open_st_env_vars.sh file!");
    catchAndExit( reason );
})
.then( _ => {
        logger.win("open_st_env_vars updated.");
});

};

const performer = async function() {

    console.log("Value Chain Registrar Address: " + coreAddresses.getAddressForUser("registrar"));
    console.log("Core Contract Address: " + coreAddresses.getAddressForContract('valueCore'));

    // deploy Core contract
    var contractName = 'valueCore'
        ,contractAbi = coreAddresses.getAbiForContract(contractName)
        ,contractBin = coreAddresses.getBinForContract(contractName)
        ,constructorArgs = [
        coreAddresses.getAddressForContract("valueRegistrar"),
        coreConstants.OST_VALUE_CHAIN_ID,
        coreConstants.OST_UTILITY_CHAIN_ID,
        coreAddresses.getAddressesForContract("openSTUtility")]

    console.log("Deploying valueCore Contract on ValueChain");
    var coreContractDeployResult = await deployHelper.perform(
        contractName,
        web3Provider,
        contractAbi,
        contractBin,
        deployerName,
        constructorArgs
    );
    console.log(coreContractDeployResult);
    console.log(contractName + " Contract deployed ");

    // Add Core contract address to Environment config
    const coreContractAddress = coreContractDeployResult.contractAddress;
    await updateConfig(coreContractAddress);

    // Add core to openst_value
    const openSTValueContractAddress = coreAddresses.getAddressForContract("openSTValue"),
        , openStValueContractInteract = new OpenStValueContractInteract(openSTValueContractAddress);

    var addCoreResponse = await openStValueContractInteract.addCore(deployerName, coreContractAddress);
    console.log(addCoreResponse);
    console.log("Core Contract " + coreContractAddress + " is added to Value Chain.");

    //set ops address to VC registrar addr


};

performer();