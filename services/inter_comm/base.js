"use strict";

/**
 * This is the base class for intercom classes
 *
 * @module services/inter_comm/base
 *
 */

const fs = require('fs');

const rootPrefix = '../..'
  , InstanceComposer = require(rootPrefix + "/instance_composer")
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
    ;
    
    // let go of all instances
    oThis.ic().instanceMap = {};
    
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
          logger.info('getPastEvents done from block:', oThis.fromBlock, 'to block:', oThis.toBlock);
        }
      );
      await oThis.processEventsArray(events);
      
      oThis.schedule();
    } catch (err) {
      logger.info('Exception got:', err);
      
      if (oThis.interruptSignalObtained) {
        logger.info('Exiting Process....');
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
    
    process.on('SIGINT', function () {
      logger.info("Received SIGINT, cancelling block scaning");
      oThis.interruptSignalObtained = true;
    });
    process.on('SIGTERM', function () {
      logger.info("Received SIGTERM, cancelling block scaning");
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
      , promiseArray = []
    ;
    
    // nothing to do
    if (!events || events.length === 0) {
      oThis.updateIntercomDataFile();
      return Promise.resolve();
    }
    
    for (var i = 0; i < events.length; i++) {
      const eventObj = events[i]
        , j = i
      ;
      
      // await oThis.processEventObj(eventObj);
      
      if (oThis.parallelProcessingAllowed()) {
        promiseArray.push(new Promise(function (onResolve, onReject) {
          setTimeout(function () {
            oThis.processEventObj(eventObj)
              .then(onResolve)
              .catch(function (error) {
                logger.error('##### inside catch block #####: ', error);
                return onResolve();
              });
          }, (j * 1000 + 100));
        }));
      } else {
        await oThis.processEventObj(eventObj)
          .catch(function (error) {
            logger.error('inside catch block: ', error);
            return Promise.resolve();
          });
      }
    }
    
    if (oThis.parallelProcessingAllowed()) {
      await Promise.all(promiseArray);
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
    
    if (oThis.interruptSignalObtained) {
      logger.info('Exiting Process....');
      process.exit(1);
    }
  }
};

InstanceComposer.registerShadowableClass(IntercomBaseKlass, "getIntercomBaseKlass");

module.exports = IntercomBaseKlass;