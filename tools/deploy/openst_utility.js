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
  , utilityRegistrarAddress = coreAddresses.getAddressForUser('utilityRegistrar')
  , OpenStUtilityContractInteract = require(rootPrefix+'/lib/contract_interact/openst_utility')
  , StPrimeContractInteract = require(rootPrefix+'/lib/contract_interact/st_prime')
  , customLogger = require(rootPrefix+'/helpers/custom_console_logger')
  , populateEnvVars = require(rootPrefix+"/lib/populate_env_vars.js")
  ;

const performer = async function() {

  const stPrimeTotalSupplyInWei = web3Provider.utils.toWei( coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY ,"ether");
  customLogger.log("Deployer Address: " + deployerAddress);
  customLogger.log("Total ST Prime Which will be transferred: " + stPrimeTotalSupplyInWei);
  customLogger.log("Utility Chain Owner Address: " + utilityChainOwnerAddress);
  customLogger.log("Utility Chain Registrar User Address: " + utilityRegistrarAddress);

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
  var contractName = 'utilityRegistrar'
     ,contractAbi = coreAddresses.getAbiForContract(contractName)
     ,contractBin = coreAddresses.getBinForContract(contractName);

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
  var registrarContractAddress = registrarContractDeployResult.contractAddress
    ,utilityRegistrarContractInteract = new UtilityRegistrarContractInteract(registrarContractAddress);
  customLogger.log('\nSetting Ops Address to Utility Chain Registrar Contract Address');
  var setOpsAddressresponse = await utilityRegistrarContractInteract.setOpsAddress(deployerName, utilityRegistrarAddress);
  customLogger.log(setOpsAddressresponse);
  customLogger.win('Ops Address Set to registrar contract address: '+ registrarContractAddress);

  // initiate owner ship transfer to utilityChainOwnerAddress
  customLogger.log('\nInitiating Ownership Transfer of contract: '+ contractName + " to deployer: " +deployerName);
  var initiateOwnershipTransferResponse = await utilityRegistrarContractInteract.initiateOwnerShipTransfer(deployerName, utilityChainOwnerAddress);
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
    deployerName,
    [coreConstants.OST_VALUE_CHAIN_ID, coreConstants.OST_UTILITY_CHAIN_ID, registrarContractAddress]
  );
  customLogger.log(utiltiyContractDeployResponse);
  customLogger.win(contractName + " Contract deployed ");

  var openSTUtilityContractAddress = utiltiyContractDeployResponse.contractAddress
    ,openStUtilityContractInteract = new OpenStUtilityContractInteract(openSTUtilityContractAddress);

  // initiate owner ship transfer to utilityChainOwnerAddress
  customLogger.log('\nInitiating Ownership Transfer of contract: '+ contractName + " to deployer: " +deployerName);
  var initiateOwnershipTransferResponse = await openStUtilityContractInteract.initiateOwnerShipTransfer(deployerName, utilityChainOwnerAddress);
  customLogger.win('Completed Ownership transfer of contract: ' + contractName + ' to deployer: ' + deployerName);

  // Query to get ST" UUID
  customLogger.info("Querying to get ST Prime UUID");
  var stPrimeUUIDResponse = await openStUtilityContractInteract.getSimpleTokenPrimeUUID();
  var simpleTokenPrimeUUID = stPrimeUUIDResponse.data.simpleTokenPrimeUUID;
  customLogger.win("ST Prime UUID: " + simpleTokenPrimeUUID);

  // Query to get ST" Contract Address
  customLogger.info("Querying to get ST Prime Auto deployed contract address");
  var stPrimeContractResponse = await openStUtilityContractInteract.getSimpleTokenPrimeContractAddress();
  var simpleTokenPrimeContractAddress = stPrimeContractResponse.data.simpleTokenPrimeContractAddress;
  customLogger.win("ST Prime Contract Address: " + simpleTokenPrimeContractAddress);

  // Transfer all base tokens from deploy key to ST" contract address
  var deployerBalance = await web3Provider.eth.getBalance(coreAddresses.getAddressForUser(deployerName));
  customLogger.info("Deployer Balance in Wei: "+deployerBalance);

  if (deployerBalance != stPrimeTotalSupplyInWei){
    customLogger.error("deployer: " + deployerBalance +" doesn't have max total supply");
    process.exit(0);
  }

  customLogger.info("Transfering all ST Prime Base Tokens to STPrime Contract Address: "+simpleTokenPrimeContractAddress);
  var stPrimeUtilityContractInteract = new StPrimeContractInteract(simpleTokenPrimeContractAddress);
  var stPrimeTransferResponse = await stPrimeUtilityContractInteract.initialize_transfer(deployerName);
  customLogger.win("Transferred all ST Prime Base Tokens to STPrime Contract Address: "+simpleTokenPrimeContractAddress);

  customLogger.info("Checking balance of simpleTokenPrimeContractAddress: "+simpleTokenPrimeContractAddress);
  var simpleTokenPrimeContractBalance = await web3Provider.eth.getBalance(simpleTokenPrimeContractAddress);
  customLogger.info(simpleTokenPrimeContractBalance);

  if (simpleTokenPrimeContractBalance != stPrimeTotalSupplyInWei){
    customLogger.error("simpleTokenPrimeContract: " + simpleTokenPrimeContractAddress +" doesn't have max total supply");
    process.exit(0);
  }

  customLogger.info("Updating env vars source file");
  populateEnvVars.renderAndPopulate('deployScript2AddressesTemplate', {
    ost_utility_registrar_contract_addr: registrarContractAddress,
    ost_openstutility_contract_addr: openSTUtilityContractAddress,
    ost_openstutility_st_prime_uuid: simpleTokenPrimeUUID
  });
  customLogger.win("ENV vars Source file Updated");
  customLogger.win("Successfully Completed!!!");



};

performer();