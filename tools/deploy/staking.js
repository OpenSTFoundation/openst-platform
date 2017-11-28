"use strict";

const rootPrefix = '../..'
  , readline = require('readline')
  , contractName = 'staking'
  , deployerName = 'foundation'
  , web3RpcProvider = require(rootPrefix+'/lib/web3/providers/value_rpc')
  , contractHelper = require(rootPrefix+'/lib/contract_interact/helper')
  , deployHelper = require('./helper')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , prompts = readline.createInterface(process.stdin, process.stdout)
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , contractBin = coreAddresses.getBinForContract(contractName)
  , registrarAddress = coreAddresses.getAddressForUser('utilityRegistrar')
  , simpleTokenAddress = coreAddresses.getAddressForContract('simpleToken');

const performer = async function() {
  console.log(contractName + " - Deployer Address: " + deployerAddress);
  console.log(contractName + " - Registrar Address: " + registrarAddress);

  await new Promise(
    function (onResolve, onReject){
      prompts.question("Please verify all above addresses. Do you want to proceed? [Y/N]", function (intent) {
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

  const deploySummary = await deployHelper.perform(
    contractName,
    web3RpcProvider,
    contractAbi,
    contractBin,
    deployerName,
    [simpleTokenAddress]
  );

  const stakingContractAddr = deploySummary.contractAddress
    , currContract = new web3RpcProvider.eth.Contract(contractAbi, stakingContractAddr);

  console.log('setting the admin address of staking contract to registrar.');


  var encodedABI = currContract.methods.setAdminAddress(registrarAddress).encodeABI();
  var transactionReceipt = await contractHelper.safeSend(web3RpcProvider, stakingContractAddr, encodedABI, deployerName,
    {
      gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE
    });

  console.log(transactionReceipt);

  console.log('DONE');

};

performer();