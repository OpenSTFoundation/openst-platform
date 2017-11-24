"use strict";

const rootPrefix = '../..'
  , readline = require('readline')
  , config = require(rootPrefix + '/config.json')
  , deployerName = 'registrar'
  , web3Provider = require(rootPrefix+'/lib/web3/providers/utility_rpc')
  , deployHelper = require('./helper')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , prompts = readline.createInterface(process.stdin, process.stdout)
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , Assert = require('assert')
  , UpdateMemberInfo = require(rootPrefix+"/lib/updateMemberInfo")
  , UtilityTokenContractInteract = require('../contract_interact/utilityToken');


const performer = async function() {

  console.log("Deployer Address: " + deployerAddress);
  console.log("Total SimpleTokens: " + coreConstants.OST_TOTAL_SIMPLETOKENS);
  console.log("Value Chain Registrar Address: " + coreAddresses.getAddressForUser('registrar'));

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

  var contractName = 'registrar'
     ,contractAbi = coreAddresses.getAbiForContract(contractName)
     ,contractBin = coreAddresses.getBinForContract(contractName);

  console.log("Deploying Registrar Contract on ValueChain");
  var contractDeployTxReceipt = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerName
  );
  console.log(contractDeployTxReceipt);
  console.log(contractName + " Contract deployed ");


};

performer();