'use strict';
/**
 * Start the OpenST Setup
 */
const shellSource = require('shell-source'),
  Path = require('path');

// load shelljs and disable output
const shell = require('shelljs');
shell.config.silent = true;

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  setupConfig = require(rootPrefix + '/tools/setup/config'),
  setupHelper = require(rootPrefix + '/tools/setup/helper'),
  fileManager = require(rootPrefix + '/tools/setup/file_manager'),
  envManager = require(rootPrefix + '/tools/setup/env_manager'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  StartDynamo = require(rootPrefix + '/lib/start_dynamo');

require(rootPrefix + '/tools/setup/service_manager');
require(rootPrefix + '/tools/setup/geth_manager');
require(rootPrefix + '/tools/setup/geth_checker');
require(rootPrefix + '/tools/setup/fund_users');
require(rootPrefix + '/tools/setup/dynamo_db_shard_management');
require(rootPrefix + '/tools/setup/dynamo_db_register_shards');
require(rootPrefix + '/tools/setup/simple_token/deploy');
require(rootPrefix + '/tools/setup/simple_token/finalize');
require(rootPrefix + '/tools/setup/fund_users_with_st');
require(rootPrefix + '/tools/deploy/register_st_prime');
require(rootPrefix + '/tools/deploy/value_registrar');
require(rootPrefix + '/tools/deploy/openst_value');
require(rootPrefix + '/tools/deploy/utility_registrar');
require(rootPrefix + '/tools/deploy/openst_utility');
require(rootPrefix + '/tools/deploy/value_core');
require(rootPrefix + '/tools/deploy/st_prime');
require(rootPrefix + '/tools/setup/simple_token_prime/mint');
require(rootPrefix + '/tools/setup/fund_users_with_st_prime');

const OpenSTSetup = function(configStrategy, instanceComposer) {};

OpenSTSetup.prototype = {
  perform: async function(step, options) {
    const oThis = this,
      validSteps = [
        'all',

        // value chain one time setup steps
        'fresh_setup',
        'generate_addresses',
        'init_value_chain',
        'st_contract',
        'fund_users_with_st',
        'deploy_value_chain',
        'dynamo_db_shard_management', //one time migrations

        // utility chain setup steps
        'dynamo_db_register_shards', // creation and registration of DDB shards, utility chain specific
        'init_utility_chain',
        'deploy_utility_chain',
        'snm_intercomm',
        'snmp_intercomm',
        'st_prime_mint',

        'end'
      ];

    if (validSteps.indexOf(step) === -1) {
      logger.error('\n!!! Invalid step !!!\n Step should be one of the following: [', validSteps.join(', '), ']\n');
      return;
    }

    if (step === 'fresh_setup' || step === 'all') {
      // Stop running services
      logger.step('** Stopping openST services');
      oThis.serviceManager.stopServices();

      // Cleanup old step
      logger.step('** Starting fresh setup by cleaning up old step');
      fileManager.freshSetup();
    }

    if (step === 'generate_addresses' || step === 'all') {
      // Creating temp GETH folder
      oThis.gethManager.createTempGethFolder();

      // generate all pre init required addresses
      logger.step('** Generating sealer address keystore files at temp location');
      oThis.gethManager.generatePreInitAddresses();

      // generate all required addresses
      logger.step('** Generating all required accounts.');
      let allocatedAddresses = oThis.gethManager.generateAddresses(options);

      // save allocated addresses to a file
      fileManager.createAllocatedAddressFile(allocatedAddresses);

      // Write config file
      logger.step('** Writing env variables file');
      envManager.generateConfigFile('deployment');
    }

    if (step === 'init_value_chain' || step === 'all') {
      // Modify genesis files and init value chain
      logger.step('** Initiating value chain and generating/modifying genesis files');
      oThis.gethManager.initChain('value');

      // Copy addresses to value chain
      logger.step('** Copying keystore files from temp location to value chain');
      oThis.gethManager.copyPreInitAddressesToChain('value');

      // Start services for deployment
      logger.step('** Starting openST Value GETH server for deployment');
      oThis.serviceManager.startGeth('value', 'deployment');

      // Chains have started mining
      logger.step('** Checking if value chain has started generating blocks');
      await oThis.performHelperService(oThis.gethChecker, 'isRunning', ['value']);

      // Copy addresses to value chain geth folder
      logger.step('** Convert private keys to keystore files and move to value chain GETH folder.');
      oThis.gethManager.importPostInitAddressesToChain(fileManager.getAllocatedAddresses(), 'value');

      // Write environment file
      logger.step('** Writing env variables file');
      envManager.generateConfigFile();

      // Fund required addresses
      logger.step('** Funding required addresses with ETH');
      await oThis.performHelperService(oThis.fundUsers);
    }

    if (step === 'st_contract' || step === 'all') {
      // Deploy Simple Token Contract and update ENV
      const stDeployResponse = await oThis.performHelperService(oThis.simpleTokenDeploy);
      setupConfig.contracts['simpleToken'].address.value = stDeployResponse.data.address;
      envManager.generateConfigFile();

      // Finalize Simple Token Contract
      await oThis.performHelperService(oThis.finalizeSimpleToken);
    }

    if (step === 'fund_users_with_st' || step === 'all') {
      // Fund required addresses
      logger.step('** Funding required addresses with ST');
      await oThis.performHelperService(oThis.fundUsersWithST);
    }

    if (step === 'deploy_value_chain' || step === 'all') {
      // Deploy Value Registrar Contract and update ENV
      const valueRegistrarDeployResponse = await oThis.performHelperService(oThis.deployValueRegistrarContract);
      setupConfig.contracts['valueRegistrar'].address.value = valueRegistrarDeployResponse.data.address;
      envManager.generateConfigFile();

      // Deploy OpenST Value Contract and update ENV
      const openSTValueDeployResponse = await oThis.performHelperService(oThis.openStValueDeployer);
      setupConfig.contracts['openSTValue'].address.value = openSTValueDeployResponse.data.address;
      envManager.generateConfigFile();

      // Copy the config file to config folder
      fileManager.cp('.', setupHelper.configFolder(), setupConfig.openst_platform_config_file);
    }

    if (step === 'dynamo_db_shard_management' || step === 'all') {
      let cmd = "ps aux | grep dynamo | grep java | grep -v grep | tr -s ' ' | cut -d ' ' -f2";
      let processId = shell.exec(cmd).stdout;

      if (processId === '') {
        // Start Dynamo DB
        let startDynamo = new StartDynamo();
        await startDynamo.perform();
      }

      // Dynamo DB one time migrations
      logger.step('** Dynamo DB One Time Migrations');
      await oThis.performHelperService(oThis.dynamoDbShardManagement);
    }

    if (step === 'dynamo_db_register_shards' || step === 'all') {
      // Dynamo DB creation and registration of shards
      logger.step('** Dynamo DB Shard creation and registration for Utility Chain ');
      await oThis.performHelperService(oThis.dynamoDbRegisterShards);
    }

    if (step === 'init_utility_chain' || step === 'all') {
      // Get value config file to default location
      fileManager.cp(setupHelper.configFolder(), '.', setupConfig.openst_platform_config_file);

      // Utility chain folders setup
      logger.step('** Utility chain folders setup');
      fileManager.utilityChainFoldersSetup();

      // Modify genesis files and init utility chain
      logger.step('** Initiating utility chain and generating/modifying genesis files');
      oThis.gethManager.initChain('utility');

      // Copy addresses to utility chain
      logger.step('** Copying keystore files from temp location to utility chain');
      oThis.gethManager.copyPreInitAddressesToChain('utility');

      // Start services for deployment
      logger.step('** Starting openST Utility GETH server for deployment');
      oThis.serviceManager.startGeth('utility', 'deployment');

      // Write environment file
      logger.step('** Writing env variables file');
      envManager.generateConfigFile('');

      // Chains have started mining
      logger.step('** Checking if utility chain has started generating blocks');
      await oThis.performHelperService(oThis.gethChecker, 'isRunning', ['utility']);

      // Copy addresses to value chain geth folder
      logger.step('** Convert private keys to keystore files and move to utility chain GETH folder.');
      oThis.gethManager.importPostInitAddressesToChain(fileManager.getAllocatedAddresses(), 'utility');

      // Write environment file
      logger.step('** Writing env variables file');
      envManager.generateConfigFile();
    }

    if (step === 'deploy_utility_chain' || step === 'all') {
      // Deploy Utility Registrar Contract and update ENV
      const utilityRegistrarDeployResponse = await oThis.performHelperService(oThis.utilityRegistrarDeployer);
      setupConfig.contracts['utilityRegistrar'].address.value = utilityRegistrarDeployResponse.data.address;
      envManager.generateConfigFile();

      // Deploy OpenST Utility Contract and update ENV
      const openSTUtilityDeployResponse = await oThis.performHelperService(oThis.openStUtilityDeployer);
      setupConfig.contracts['openSTUtility'].address.value = openSTUtilityDeployResponse.data.address;
      envManager.generateConfigFile();

      // Deploy Value Core Contract and update ENV
      const valueCoreDeployResponse = await oThis.performHelperService(oThis.valueCoreDeployer);
      setupConfig.contracts['valueCore'].address.value = valueCoreDeployResponse.data.address;
      envManager.generateConfigFile();

      // Deploy OpenST Utility Contract and update ENV
      const stPrimeDeploymentStepsResponse = await oThis.performHelperService(oThis.stPrimeDeployer);
      setupConfig.contracts['stPrime'].address.value = stPrimeDeploymentStepsResponse.data.address;
      setupConfig.misc_deployment.st_prime_uuid.value = stPrimeDeploymentStepsResponse.data.uuid;
      envManager.generateConfigFile();

      // Register ST Prime and update ENV
      await oThis.performHelperService(oThis.registerStPrime);
    }

    if (step === 'snm_intercomm' || step === 'all') {
      // Starting stake and mint intercomm
      logger.step('** Starting stake and mint intercomm');
      let intercomProcessDataFile =
        setupHelper.setupFolderAbsolutePath() +
        '/' +
        setupHelper.utilityChainDataFilesFolder() +
        '/' +
        'stake_and_mint.data';
      await oThis.serviceManager.startExecutable('executables/inter_comm/stake_and_mint.js ' + intercomProcessDataFile);
    }

    if (step === 'snmp_intercomm' || step === 'all') {
      // Starting stake and mint processor intercomm
      logger.step('** Starting stake and mint processor intercomm');
      let intercomProcessDataFile =
        setupHelper.setupFolderAbsolutePath() +
        '/' +
        setupHelper.utilityChainDataFilesFolder() +
        '/' +
        'stake_and_mint_processor.data';
      await oThis.serviceManager.startExecutable(
        'executables/inter_comm/stake_and_mint_processor.js ' + intercomProcessDataFile
      );
    }

    if (step === 'st_prime_mint' || step === 'all') {
      // Stake and mint simple token prime
      await oThis.performHelperService(oThis.stPrimeMinter);

      // Fund required addresses
      logger.step('** Funding required addresses with ST Prime');
      await oThis.performHelperService(oThis.fundUsersWithSTPrime);
    }

    if (step === 'end' || step === 'all') {
      fileManager.cp('.', setupHelper.utilityChainBinFilesFolder(), setupConfig.openst_platform_config_file);

      // Stop running services
      logger.step('** Stopping openST services');
      oThis.serviceManager.stopUtilityServices();

      // Print all the helpful scripts post setup
      logger.step('** OpenST Platform created following executables for further usages.');
      logger.info(Array(30).join('='));
      oThis.serviceManager.postSetupSteps();
    }

    return Promise.resolve(setupConfig);
  },

  performHelperService: function(service, methodName, args) {
    methodName = methodName || 'perform';

    const oThis = this;

    //1. Reload the config.
    oThis.ic().configStrategy = fileManager.getPlatformConfig();
    //2. Clear all retained instances.
    oThis.ic().instanceMap = {};

    //3. Pre-warm constants & addresses.
    oThis.ic().getCoreConstants();
    oThis.ic().getCoreAddresses();

    return service[methodName].apply(service, args || []);
  }
};

Object.defineProperties(OpenSTSetup.prototype, {
  serviceManager: {
    get: function() {
      return this.ic().getSetupServiceManager();
    }
  },
  gethManager: {
    get: function() {
      return this.ic().getSetupGethManager();
    }
  },
  gethChecker: {
    get: function() {
      return this.ic().getSetupGethChecker();
    }
  },
  fundUsers: {
    get: function() {
      return this.ic().getSetupFundUsers();
    }
  },
  dynamoDbShardManagement: {
    get: function() {
      return this.ic().getSetupDynamoDBShardManagement();
    }
  },
  dynamoDbRegisterShards: {
    get: function() {
      return this.ic().getSetupDynamoDBRegisterShards();
    }
  },
  simpleTokenDeploy: {
    get: function() {
      return this.ic().getSimpleTokenDeployer();
    }
  },
  finalizeSimpleToken: {
    get: function() {
      return this.ic().getSimpleTokenFinalizar();
    }
  },
  fundUsersWithST: {
    get: function() {
      return this.ic().getSetupFundUsersWithST();
    }
  },
  fundUsersWithSTPrime: {
    get: function() {
      return this.ic().getSetupFundUsersWithSTPrime();
    }
  },
  registerStPrime: {
    get: function() {
      return this.ic().getSetupRegisterSTPrime();
    }
  },
  deployValueRegistrarContract: {
    get: function() {
      return this.ic().getDeployValueRegistrarContract();
    }
  },
  openStValueDeployer: {
    get: function() {
      return this.ic().getOpenStValueDeployer();
    }
  },
  utilityRegistrarDeployer: {
    get: function() {
      return this.ic().getUtilityRegistrarDeployer();
    }
  },
  openStUtilityDeployer: {
    get: function() {
      return this.ic().getOpenStUtilityDeployer();
    }
  },
  valueCoreDeployer: {
    get: function() {
      return this.ic().getValueCoreDeployer();
    }
  },
  stPrimeDeployer: {
    get: function() {
      return this.ic().getSTPrimeDeployer();
    }
  },
  stPrimeMinter: {
    get: function() {
      return this.ic().getStakeAndMintSTPrimeMinter();
    }
  }
});

// Start the platform setup
logger.error(Array(30).join('='));
logger.error(
  'Note: For scalability and security reasons, setup tools should only be used in ' +
    setupHelper.allowedEnvironment().join(' and ') +
    ' environments.'
);
logger.error(Array(30).join('='));

InstanceComposer.register(OpenSTSetup, 'getOpenSTSetup', true);

module.exports = OpenSTSetup;
