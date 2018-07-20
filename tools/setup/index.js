"use strict";

/**
 * Start the OpenST Setup step-by-step
 */



const rootPrefix = "../.."
    , logger = require(rootPrefix + '/helpers/custom_console_logger')
    , InstanceComposer = require( rootPrefix + "/instance_composer")
;

require(rootPrefix + '/tools/setup/performer');

const run = async function( step, config ){
  const instanceComposer = new InstanceComposer( config || {})
    , performer = instanceComposer.getOpenSTSetup()
  ;
  console.log("step", step);
  await performer.perform(step);
  process.exit(0);
};

const program = require('commander');

program
  .description("Setup OpenST-Platfomr")
  .option("-s, --step <step>", "Step to be performed. (all|setup|init|st_contract|registrar|stake_n_mint|st_prime_mint|end)" , /^(all|setup|init|st_contract|registrar|stake_n_mint|st_prime_mint|end)$/i , "all")
  .option("-c, --config <path>", "Json Config file path.")
;

program.parse( process.argv );

const step = program.step;
console.log("step", step);
const config =  program.path ? require(program.path) : {};
run( (step||'all'), config);
