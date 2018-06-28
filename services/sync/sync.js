const Rsync = require('rsync');

const rootPrefix = "../.."
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 *
 * @param source folder path of chainData
 * @param destination folder path of chainData
 * @constructor
 */
function SyncKlass(source, destination) {
  let oThis = this;

  oThis.source = source;
  oThis.destination = destination;
  oThis.rsync = new Rsync()
    .flags('az')
    .source(oThis.source)
    .destination(oThis.destination);
}

SyncKlass.prototype = {
  /**
   * Sync source folder to destination folder
   * @return {Promise<result>}
   */
  perform: function () {
    let oThis = this;

    oThis._validate();
    return oThis._sync();
  },
  /**
   * Sync source folder to destination folder
   * @return {Promise<result>}
   * @private
   */
  _sync: function () {
    let oThis = this;

    return new Promise(function (resolve, reject) {
      oThis.rsync.execute(function (error, code, cmd) {
        if (error) {

          logger.error(error);
          let responseError = responseHelper.error({
            internal_error_identifier: 's_s_sync_validate_1',
            api_error_identifier: 'exception',
            error_config: basicHelper.fetchErrorConfig(),
            debug: {error}
          });
          reject(responseError);
        }
        resolve(responseHelper.successWithData({
          statusCode: code,
          cmd: cmd
        }))
      });
    });
  },
  /**
   * Input validations
   * @private
   */
  _validate: async function () {
    let oThis = this;

    let errorConf = {
      internal_error_identifier: "s_s_val_validate_2",
      debug_options: {},
      error_config: basicHelper.fetchErrorConfig()
    };

    if (!oThis.source) {
      logger.error("Sync source is not defined");
      errorConf.api_error_identifier = "sync_source_undefined";
      let errorResponse = responseHelper.error(errorConf);
      return Promise.reject(errorResponse);
    }

    if (!oThis.destination) {
      logger.error("Sync destination is not defined");
      errorConf.api_error_identifier = "sync_destination_undefined";
      let errorResponse = responseHelper.error(errorConf);
      return Promise.reject(errorResponse);
    }
  }
};

module.exports = SyncKlass;
