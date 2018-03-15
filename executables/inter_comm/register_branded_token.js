"use strict";

/**
 * This executable / script is intermediate communicator between value chain and utility chain used for the registering branded token.
 *
 * <br>It listens to the ProposedBrandedToken event emitted by proposeBrandedToken method of openSTUtility contract.
 * On getting this event, it calls registerBrandedToken method of utilityRegistrar contract followed
 * by calling registerUtilityToken method of valueRegistrar contract.
 *
 * @module executables/inter_comm/register_branded_token
 */
const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , RegisterBrandedTokenInterComm = require(rootPrefix + '/services/inter_comm/register_branded_token')
;

const args = process.argv
  , filePath = args[2]
;

const registerBrandedTokenInterCommObj = new RegisterBrandedTokenInterComm({file_path: filePath});
registerBrandedTokenInterCommObj.registerInterruptSignalHandlers();
registerBrandedTokenInterCommObj.init();
logger.win("InterComm Script for Register Branded Token initiated.");
