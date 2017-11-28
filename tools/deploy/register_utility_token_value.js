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
    , OpenStUtilityContractInteract = require(rootPrefix+'/lib/contract_interact/openst_utility')
    , ValueRegistrarContractInteract = require(rootPrefix+'/lib/contract_interact/value_registrar')
    , populateEnvVars = require(rootPrefix+"/lib/populate_env_vars.js")
    , logger = require(rootPrefix+'/helpers/custom_console_logger')
    ;

function updateConfig(coreContractAddress) {

    return new Promise(
      function (onResolve, onReject) {
          logger.step("Updating Source file open_st_env_vars");
          populateEnvVars.renderAndPopulate('valueCore', {
              ost_value_core_contract_address: valueCoreContractAddr
          });

          onResolve();
      })
      .then( function () {
          logger.win("open_st_env_vars updated.");
      })
      .catch( function(reason)  {
          logger.error("Failed to populate open_st_env_vars.sh file!");
          logger.error(reason);
          process.exit(1);
      });

};

const performer = async function() {

    logger.step("Deploying Value Core Contract on Value Chain");
    logger.info("Value Chain Registrar Address: " + coreAddresses.getAddressForUser("valueRegistrar"));

    // deploy Core contract
    var contractName = 'valueCore'
        ,contractAbi = coreAddresses.getAbiForContract(contractName)
        ,contractBin = coreAddresses.getBinForContract(contractName)
        ,constructorArgs = [
        coreAddresses.getAddressForContract("valueRegistrar"),
        coreConstants.OST_VALUE_CHAIN_ID,
        coreConstants.OST_UTILITY_CHAIN_ID,
        coreAddresses.getAddressForContract("openSTUtility")];

    var coreContractDeployResult = await deployHelper.perform(
        contractName,
        web3Provider,
        contractAbi,
        contractBin,
        deployerName,
        constructorArgs
    );
    logger.info(coreContractDeployResult);
    logger.win(contractName + " Contract deployed ");

    // Add core to openst_value
    logger.step("Add Value Core contract on Value Chain.");
    const coreContractAddress = coreContractDeployResult.contractAddress;
    const openSTValueContractAddress = coreAddresses.getAddressForContract("openSTValue"),
          openStValueContractInteract = new OpenStValueContractInteract(openSTValueContractAddress);

    var addCoreResponse = await openStValueContractInteract.addCore(deployerName, coreContractAddress);
    logger.info(addCoreResponse);
    logger.win("Core Contract " + coreContractAddress + " is added to Value Chain.");

    // Register Utility token on Value chain
    logger.step("Register Utility token for STPrime on Value Chain.");
    const openSTUtilityContractAddress = coreAddresses.getAddressForContract("openSTUtility"),
          openStUtilityContractInteract = new OpenStUtilityContractInteract(openSTUtilityContractAddress);

    var symbolResult = await openStUtilityContractInteract.getSymbol();
    var nameResult = await openStUtilityContractInteract.getName();
    var conversionRateResult = await openStUtilityContractInteract.getConversationRate();

    var registerUtilityTokenResponse = await openStValueContractInteract.registerUtilityToken(
        symbolResult.data.symbol,
        nameResult.data.name,
        conversionRateResult.data.conversion_rate,
        coreConstants.OST_UTILITY_CHAIN_ID,
        0,
        coreConstants.OST_OPENSTUTILITY_ST_PRIME_UUID,
        deployerName);
    logger.info(registerUtilityTokenResponse);
    logger.win("Utility token registered on Value Chain.");

    //set ops address to VC registrar addr
    logger.step("Set Ops Address to Value Registrar.");
    const registrarAddress = coreAddresses.getAddressForUser("valueRegistrar"),
          valueRegistrarContractAddress = coreAddresses.getAddressForContract("valueRegistrar"),
          valueRegistrarContractInteract = new ValueRegistrarContractInteract(valueRegistrarContractAddress);

    var setOpsAddressResponse = await valueRegistrarContractInteract.setOpsAddress(deployerName, registrarAddress);
    logger.info(setOpsAddressResponse);
    logger.win("Registrar " + registrarAddress + " is set to ValueRegistrarContract " + valueRegistrarContractAddress);

    // Initiate Ownership transfer of Value registrar contract to STF
    logger.step("Initiate Ownership transfer of Value registrar contract to STF.");
    var initiateOwnerShipTransferResponse = await valueRegistrarContractInteract.initiateOwnerShipTransfer(
        deployerName,
        coreAddresses.getAddressForUser("foundation")
    );
    logger.info(initiateOwnerShipTransferResponse);
    logger.win("Foundation " + coreAddresses.getAddressForUser("foundation") + " is set to ValueRegistrarContract " + valueRegistrarContractAddress);

    // Add Core contract address to Environment config
    await updateConfig(coreContractAddress);

    logger.win(" Deploy script 3 completed ");

};

performer();