"use strict";

/**
 * This is the base class for intercom classes
 *
 * @module executables/inter_comm/base
 *
 */

const fs = require('fs');

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const IntercomBaseKlass = function (params) {
  const oThis = this
  ;

  oThis.filePath = params.file_path;
  oThis.fromBlock = 0;
  oThis.toBlock = 0;
  oThis.snmData = {};
  oThis.interruptSignalObtained = false;
};

IntercomBaseKlass.prototype = {
  /**
   * Starts the process of the script with initializing processor
   *
   */
  init: function () {
    const oThis = this
      , clearCacheOfExpr = /(openst-platform\/config\/)|(openst-platform\/lib\/)/
    ;

    Object.keys(require.cache).forEach(function(key)
    {
      if (key.search(clearCacheOfExpr) !== -1) {
        delete require.cache[key];
      }
    });
    oThis.setContractObj();

    // Read this from a file
    oThis.snmData = JSON.parse(fs.readFileSync(oThis.filePath).toString());

    oThis.checkForFurtherEvents();
  },

  /**
   * Check for further events
   *
   */
  checkForFurtherEvents: async function () {
    const oThis = this
    ;

    try {
      const highestBlock = await this.getChainHighestBlock();

      // return if nothing more to do.
      if (highestBlock - 6 <= oThis.lastProcessedBlock) return oThis.schedule();

      // consider case in which last block was not processed completely

      oThis.fromBlock = oThis.snmData.lastProcessedBlock + 1;
      oThis.toBlock = highestBlock - 6;

      const events = await oThis.completeContract.getPastEvents(
        oThis.EVENT_NAME,
        {fromBlock: oThis.fromBlock, toBlock: oThis.toBlock},
        function (error, logs) {
          if (error) logger.error('getPastEvents error:', error);
          logger.log('getPastEvents done from block:', oThis.fromBlock, 'to block:', oThis.toBlock);
        }
      );
      await oThis.processEventsArray(events);

      oThis.schedule();
    } catch(err) {
      logger.info('Exception got:', err);

      if(oThis.interruptSignalObtained){
        console.log('Exiting Process....');
        process.exit(1);
      } else {
        oThis.reInit();
      }

    }
  },

  /**
   * Register interrup signal handlers
   *
   */
  registerInterruptSignalHandlers: function () {
    const oThis = this;

    process.on('SIGINT', function() {
      console.log("Received SIGINT, cancelling block scaning");
      oThis.interruptSignalObtained = true;
    });
    process.on('SIGTERM', function() {
      console.log("Received SIGTERM, cancelling block scaning");
      oThis.interruptSignalObtained = true;
    });
  },

  /**
   * Process events array
   *
   * @param {array} events - events array
   *
   */
  processEventsArray: async function (events) {
    const oThis = this
    ;

    // nothing to do
    if (!events || events.length === 0) {
      oThis.updateIntercomDataFile();
      return Promise.resolve();
    }

    //TODO: last processed transaction index.
    for (var i = 0; i < events.length; i++) {
      const eventObj = events[i]
      ;

      await oThis.processEventObj(eventObj);
    }

    oThis.updateIntercomDataFile();
    return Promise.resolve();
  },

  /**
   * Schedule
   */
  schedule: function () {
    const oThis = this
    ;
    setTimeout(function () {
      oThis.checkForFurtherEvents();
    }, 5000);
  },

  /**
   * Re init
   */
  reInit: function () {
    const oThis = this
    ;
    setTimeout(function () {
      oThis.init();
    }, 5000);
  },

  /**
   * Update intercom data file
   */
  updateIntercomDataFile: function () {
    const oThis = this
    ;

    oThis.snmData.lastProcessedBlock = oThis.toBlock;

    fs.writeFileSync(
      oThis.filePath,
      JSON.stringify(oThis.snmData),
      function (err) {
        if (err)
          logger.error(err);
      }
    );

    if(oThis.interruptSignalObtained){
      console.log('Exiting Process....');
      process.exit(1);
    }
  }
};

module.exports = IntercomBaseKlass;