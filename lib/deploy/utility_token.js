"use strict";

const rootPrefix = '../..'
  , readline = require('readline')
  , contractName = 'utilityToken'
  , config = require(rootPrefix + '/config.json')
  , deployerName = 'registrar'
  , web3Provider = require(rootPrefix+'/lib/web3/providers/utility_rpc')
  , deployHelper = require('./helper')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , prompts = readline.createInterface(process.stdin, process.stdout)
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , deployerPassphrase = coreAddresses.getPassphraseForUser(deployerName)
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , contractBin = coreAddresses.getBinForContract(contractName)
  , Assert = require('assert')
  , staking = require('../contract_interact/staking');

const describeMemberDetails = function(member){
  console.log("Describing Member Details...");
  for (var mem in member){
    console.log(mem + ": " + member[mem]);
  }
};

const validateMemberDetails = function(member) {
  Assert.strictEqual(typeof member.Symbol, 'string', `symbol must be of type 'string'`);
  Assert.strictEqual(typeof member.Name, 'string', `name must be of type 'string'`);
  Assert.strictEqual(typeof member.Decimals, 'number', `decimals must be of type 'number'`);
  Assert.strictEqual(typeof member.ChainId, 'string', `chainId must be of type 'string'`);
  Assert.notEqual(member.Symbol, "");
  Assert.notEqual(member.Name, "");
  Assert.ok(member.Decimals > 0, "decimals must be ≥ 0");
  Assert.ok(member.Decimals <= 18, "decimals must be ≤ 18");
  Assert.strictEqual(member.Decimals, Math.trunc(member.Decimals));
};

// TODO Validation old address
const performer = async function(member) {
  describeMemberDetails(member);
  validateMemberDetails(member);

  console.log(contractName + " Deployer Name: " + deployerName);
  console.log(contractName + " Deployer Address: " + deployerAddress);

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

  console.log("Deploying Utility Token for Member: " + member.Name);
  var txReceipt = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerAddress,
    deployerPassphrase
  );
  console.log(txReceipt);
  console.log("Utility Token Contract deployed for Member: " + member.Name);

  console.log("Registering Member company: " + member.Name +" in Staking Contract");
  await staking.registerUtilityToken(member.Symbol, member.Name, member.Decimals, member.ConversionRate, member.ChainId, member.Reserve, deployerAddress);
  console.log("Member company: " + member.Name +" is registered in Staking Contract");

};

performer(config.Members[0]);