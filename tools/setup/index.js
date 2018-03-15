"use strict";

/**
 * Start the OpenST Setup step-by-step
 */

const rootPrefix = "../.."
    , performer = require(rootPrefix + '/tools/setup/performer')
    , logger = require(rootPrefix + '/helpers/custom_console_logger')
  ;

var run = async function(step){

  await performer.perform(step);

  process.exit(0);
}

var args = process.argv.slice(2)
  , step = args[0]
;

run(step||'all');

// To run step-by-step follow following order:

// run('setup');
// run('init');
// run('st_contract');
// run('registrar');
// run('stake_n_mint');
// run('st_prime_mint');
// run('end');
