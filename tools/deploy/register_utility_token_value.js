"use strict";

const rootPrefix = '../..'
    , readline = require('readline')
    , config = require(rootPrefix + '/config.json')
    , deployerName = "valueDeployer"
    , valueOpsName = "valueOps"
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
    , valueRegistrarContractAddress = coreAddresses.getAddressForContract("valueRegistrar")
    , openSTUtilityContractAddress = coreAddresses.getAddressForContract("openSTUtility")
    , openSTValueContractAddress = coreAddresses.getAddressForContract("openSTValue")
    , valueRegistrarUser = coreAddresses.getAddressForUser("valueRegistrar")
    , foundationAddress = coreAddresses.getAddressForUser("foundation")
    , valueOpsAddress = coreAddresses.getAddressForUser(valueOpsName)
    , valueOpsPassphrase = coreAddresses.getPassphraseForUser(valueOpsName)
    , deployerAddress = coreAddresses.getAddressForUser(deployerName)
    ;

const deploymentOptions = {
  gasPrice: coreConstants.OST_VALUE_GAS_PRICE,
  gasLimit: coreConstants.OST_VALUE_GAS_LIMIT
};

function updateConfig(valueCoreContractAddr) {

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
    logger.info("Deployer Address: " + deployerAddress);
    logger.info("Foundation Address: " + foundationAddress);
    logger.info("OpenST Utility Contract: " + openSTUtilityContractAddress);
    logger.info("OpenST Value Contract: " + openSTValueContractAddress);
    logger.info("Value Chain Registrar User Address: " + valueRegistrarUser);
    logger.info("Value Ops Address: " + valueOpsAddress);

    await new Promise(
      function (onResolve, onReject){
          prompts.question("Please verify all above details. Do you want to proceed? [Y/N]", function (intent) {
              if (intent === 'Y') {
                  logger.info('Great! Proceeding deployment.');
                  prompts.close();
                  onResolve();
              } else {
                  logger.error('Exiting deployment scripts. Change the env vars and re-run.');
                  process.exit(1);
              }
          });
      }
    );

    // deploy Core contract
    var contractName = 'valueCore'
        ,contractAbi = coreAddresses.getAbiForContract(contractName)
        ,contractBin = coreAddresses.getBinForContract(contractName)
        ,constructorArgs = [
        valueRegistrarContractAddress,
        coreConstants.OST_VALUE_CHAIN_ID,
        coreConstants.OST_UTILITY_CHAIN_ID,
        openSTUtilityContractAddress];

    var coreContractDeployResult = await deployHelper.perform(
        contractName,
        web3Provider,
        contractAbi,
        contractBin,
        deployerName,
        deploymentOptions,
        constructorArgs
    );
    logger.info(coreContractDeployResult);
    logger.win(contractName + " Contract deployed ");

    // Add core to openst_value
    logger.step("Add Value Core contract on Value Chain.");
    const coreContractAddress = coreContractDeployResult.contractAddress;
    const openStValueContractInteract = new OpenStValueContractInteract(openSTValueContractAddress);

    const valueRegistrarContractInteract = new ValueRegistrarContractInteract(valueRegistrarContractAddress);

    var addCoreResponse = await valueRegistrarContractInteract.addCore(valueOpsName,
                                        openSTValueContractAddress, coreContractAddress);
    logger.info(JSON.stringify(addCoreResponse));
    logger.win("Core Contract " + coreContractAddress + " is added to Value Chain.");

    // Register Utility token on Value chain
    logger.step("Register Utility token for STPrime on Value Chain.");
    const openStUtilityContractInteract = new OpenStUtilityContractInteract(openSTUtilityContractAddress);

    var symbolResult = await openStUtilityContractInteract.getSymbol();
    var nameResult = await openStUtilityContractInteract.getName();
    var conversionRateResult = await openStUtilityContractInteract.getConversationRate();

    logger.info("Symbol:"+symbolResult.data.symbol);
    logger.info("Name:"+nameResult.data.name);
    logger.info("ConversationRate:"+conversionRateResult.data.conversion_rate);


    var registerUtilityTokenResponse = await valueRegistrarContractInteract.registerUtilityToken(
        valueOpsAddress,
        valueOpsPassphrase,
        openSTValueContractAddress,
        symbolResult.data.symbol,
        nameResult.data.name,
        conversionRateResult.data.conversion_rate,
        coreConstants.OST_UTILITY_CHAIN_ID,
        0,
        coreConstants.OST_OPENSTUTILITY_ST_PRIME_UUID,
        deployerName);

    await deployHelper.assertEvent(registerUtilityTokenResponse.data.formattedTransactionReceipt, 'UtilityTokenRegistered');

    logger.step("Register Utility token for STPrime on Value Chain.");
    logger.win("Utility token registered on Value Chain.");

    //set ops address to VC registrar addr
    logger.step("Set Ops Address to Value Registrar.");

    var setOpsAddressResponse = await valueRegistrarContractInteract.setOpsAddress(deployerName, valueRegistrarUser);

    logger.step("Verifying if ops address is set properly of not: " + valueRegistrarUser);

    var opsAddress = await valueRegistrarContractInteract.getOpsAddress();

    if (web3Provider.utils.toChecksumAddress(opsAddress.data.address) != web3Provider.utils.toChecksumAddress(valueRegistrarUser)) {
        logger.error("Exiting the deployment as setops address doesn't match");
        process.exit(0);
    }

    logger.win(" Ops address set to ValueRegistrarContract address ");

    // Initiate Ownership transfer of Value registrar contract to STF
    logger.step("Initiate Ownership transfer of Value registrar contract to STF.");
    var initiateOwnerShipTransferResponse = await valueRegistrarContractInteract.initiateOwnerShipTransfer(
        deployerName,
        foundationAddress
    );

    logger.step("Verifying Ownership transfer success");

    var proposedOwnerResult = await valueRegistrarContractInteract.getOwner();

    if (web3Provider.utils.toChecksumAddress(proposedOwnerResult.data.owner) != web3Provider.utils.toChecksumAddress(foundationAddress)) {
        logger.error("Exiting the deployment as initialite ownership address doesn't match");
        process.exit(0);
    }

    logger.win(" Ownership transfered to ValueRegistrarContract.");

    // Add Core contract address to Environment config
    await updateConfig(coreContractAddress);

    logger.win(" Deploy script 3 completed ");

    process.exit(0);

};

performer();