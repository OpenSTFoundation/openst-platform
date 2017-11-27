"use strict";

const rootPrefix = '../..'
  , readline = require('readline')
  , config = require(rootPrefix + '/config.json')
  , deployerName = 'deployer'
  , web3Provider = require(rootPrefix+'/lib/web3/providers/utility_rpc')
  , deployHelper = require('./helper')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , prompts = readline.createInterface(process.stdin, process.stdout)
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , UtilityRegistrarContractInteract = require(rootPrefix+'/lib/contract_interact/utility_registrar')
  , utilityChainOwnerAddress = coreAddresses.getAddressForUser('utilityChainOwner')
  , OpenStUtilityContractInteract = require(rootPrefix+'/lib/contract_interact/openst_utility')
  , StPrimeContractInteract = require(rootPrefix+'/lib/contract_interact/st_prime')
  , customLogger = require(rootPrefix+'/custom_console_logger')
  ;

// TODO Colourful Logger Changes
// TODO var VS const
// TODO Write to config.json and open_st_env_vars.sh
const performer = async function() {

  customLogger.log("Deployer Address: " + deployerAddress);
  customLogger.log("Total ST Prime: " + coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY);
  customLogger.log("Utility Chain Registrar Address: " + coreAddresses.getAddressForUser('registrar'));

  await new Promise(
    function (onResolve, onReject){
      prompts.question("Please verify all above details. Do you want to proceed? [Y/N]", function (intent) {
        if (intent === 'Y') {
          console.log('Great! Proceeding deployment.');
          prompts.close();
          onResolve();
        } else {
          console.log('Exiting deployment scripts. Change the env vars and re-run.');
          process.exit(1);
        }
      });
    }
  );

  // deploy Registrar
  var contractName = 'registrar'
     ,contractAbi = coreAddresses.getAbiForContract(contractName)
     ,contractBin = coreAddresses.getBinForContract(contractName);

  console.log("Deploying Registrar Contract on UtilityChain");
  customLogger.step("Deploying " + contractName + "Contract on UtilityChain");
  var registrarContractDeployResult = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerName
  );
  customLogger.log(registrarContractDeployResult);
  customLogger.win(contractName + " Contract deployed ");

  // set ops address to UC registrar addr
  const registrarContractAddress = registrarContractDeployResult.contractAddress
    ,utilityRegistrarContractInteract = new UtilityRegistrarContractInteract(registrarContractAddress);
  customLogger.log('\nSetting Ops Address to Utility Chain Registrar Address');
  var setOpsAddressresponse = await utilityRegistrarContractInteract.setOpsAddress(deployerName, registrarContractAddress);
  customLogger.info(setOpsAddressresponse);
  customLogger.win('Ops Address Set to Value Utility Registrar Address');

  // initiate owner ship transfer to utilityChainOwnerAddress
  customLogger.log('\nInitiating Ownership Transfer of contract: '+ contractName + " to deployer: " +deployerName);
  var initiateOwnershipTransferResponse = await utilityRegistrarContractInteract.initiateOwnerShipTransfer(deployerName, utilityChainOwnerAddress);
  customLogger.info(initiateOwnershipTransferResponse);
  customLogger.win('Completed Ownership transfer of contract: ' + contractName + ' to deployer: ' + deployerName);

  //deploy contract openSTUtility, auto deploys ST" contract
  var contractName = 'openSTUtility'
  ,contractAbi = coreAddresses.getAbiForContract(contractName)
  ,contractBin = coreAddresses.getBinForContract(contractName);

  customLogger.log('\nDeploying Contract ' + contractName + ' on UtilityChain');
  var utiltiyContractDeployResponse = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerName
  );
  customLogger.log(utiltiyContractDeployResponse);
  customLogger.win(contractName + " Contract deployed ");

  const openSTUtilityContractAddress = utiltiyContractDeployResponse.contractAddress
    ,openStUtilityContractInteract = new OpenStUtilityContractInteract(openSTUtilityContractAddress);

  // initiate owner ship transfer to utilityChainOwnerAddress
  customLogger.log('\nInitiating Ownership Transfer of contract: '+ contractName + " to deployer: " +deployerName);
  var initiateOwnershipTransferResponse = await openStUtilityContractInteract.initiateOwnerShipTransfer(deployerName, utilityChainOwnerAddress);
  customLogger.info(initiateOwnershipTransferResponse);
  customLogger.win('Completed Ownership transfer of contract: ' + contractName + ' to deployer: ' + deployerName);

  // Query to get ST" Contract Address
  customLogger.info("Querying to get ST Prime Auto deployed contract address");
  var stPrimeContractResponse = await openStUtilityContractInteract.getSimpleTokenPrimeContractAddress();
  customLogger.win(stPrimeContractResponse);
  var simpleTokenPrimeContractAddress = stPrimeContractResponse.data.simpleTokenPrimeContractAddress;
  customLogger.win("ST Prime Contract Address: " + simpleTokenPrimeContractAddress);


  // Transfer all base tokens from deploy key to ST" contract address
  customLogger.info("Transfering all ST Prime Base Tokens to STPrime Contract Address");
  var stPrimeUtilityContractInteract = new StPrimeContractInteract(simpleTokenPrimeContractAddress);
  var stPrimeTransferResponse = await stPrimeUtilityContractInteract.initialize(coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY);
  customLogger.win(stPrimeTransferResponse);

};

performer();