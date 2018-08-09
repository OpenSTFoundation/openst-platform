'use strict';

/**
 * Start the OpenST Setup step-by-step
 */
const program = require('commander');

const rootPrefix = '../..',
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  InstanceComposer = require(rootPrefix + '/instance_composer');

// registering following files in Instance Composer
require(rootPrefix + '/tools/setup/performer');

/**
 * Perform a particular step in the installation. If step is not passed the whole installation will be done from scratch.
 *
 * @param {string} step - step of the setup to run.
 * @param {string} config - config to use for the setup.
 *
 * @return {promise}
 */
const run = async function(step, config) {
  const instanceComposer = new InstanceComposer(config || {}),
    performer = instanceComposer.getOpenSTSetup();

  logger.step('** Setup START for step:', step);

  await performer.perform(step);

  logger.win('** Setup DONE for step:', step);
  logger.win('** Exiting...');
  process.exit(0);
};

program
  .description('Setup OpenST-Platform')
  .option(
    '-s, --step <step>',
    'Step to be performed. (all|setup|init|st_contract|fund_users_with_st|deploy_platform_contracts|snm_intercomm|snmp_intercomm|st_prime_mint|end)',
    /^(all|setup|init|st_contract|fund_users_with_st|deploy_platform_contracts|snm_intercomm|snmp_intercomm|st_prime_mint|end)$/i,
    'all'
  )
  .option('-c, --config <path>', 'Json Config file path.');

program.parse(process.argv);

const step = program.step;
console.log('step', step);
const config = program.path ? require(program.path) : {};
run(step || 'all', config);
