"use strict";

/**
 * Start the deployment of OpenST platform
 */

const rootPrefix = "../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const args = process.argv
  , environment = args[2]
  , environments = ['development', 'test']
;

const performer = async function () {

  logger.step("** Deploy and finalize Simple Token Contract");


  // Exit
  process.exit(1);

};

if (!environments.includes(environment)) {
  logger.error("** Usages: node tools/deploy/index.js <environment>");
  logger.info("** Note: For scalibity reasons, step tools should only be used in " + environments.join(' and ') +' environments.');
} else {
  performer();
}
