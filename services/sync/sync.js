const Rsync = require('rsync');

const rootPrefix = "../.."
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 * For remote Sync specify user and host in sourceConfig/destinationConfig, for local sync dont add user and host key
 * @param sourceConfig object {user:'source_user', host:'10.1.2.2', path:'~/temp'}
 * @param destinationConfig object {user:'destination_user', host:'10.1.2.3', path:'~/temp'}
 * @constructor
 */
function SyncKlass(sourceConfig, destinationConfig) {
  let oThis = this;

  oThis.source = oThis._formatPath(sourceConfig);
  oThis.destination = oThis._formatPath(destinationConfig);
}

SyncKlass.prototype = {
  /**
   * Sync source folder to destination folder
   * @return {Promise<result>}
   */
  perform: function () {
    let oThis = this;

    return oThis._sync();
  },
  /**
   * Sync source folder to destination folder
   * @return {Promise<result>}
   * @private
   */
  _sync: async function () {
    let oThis = this;

    await oThis._validate();

    oThis.rsync = new Rsync()
      .flags('az')
      .source(oThis.source)
      .destination(oThis.destination);

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
  },

  /**
   * @param origin source/destination
   * @return {string} formatted path of source/destination
   * @private
   */
  _formatPath: function (origin) {

    let user = origin.user;
    let host = origin.host;
    let path = origin.path;
    if (!user || !host) {
      return path;
    }
    return path ? `${user}@${host}:${path}` : path;
  }

};

module.exports = SyncKlass;
