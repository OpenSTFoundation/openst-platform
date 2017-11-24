"use strict";

const shortId = require('shortid');

function Result(data, err_code, err_msg) {
  this.success = (err_code == null);

  this.data = data || {};

  if (!this.success) {
    this.err = {
      code: err_code,
      msg: err_msg
    };
  }

  // Check if response has success
  this.isSuccess = function () {
    return this.success;
  };

  // Check if response is not success. More often not success is checked, so adding a method.
  this.isFailure = function () {
    return !this.isSuccess();
  };

  // Format data to hash
  this.toHash = function () {
    var s = {};
    if (this.success) {
      s.success = true;
      s.data = this.data;
    } else {
      s.success = false;
      s.err = this.err;
    }

    return s;
  };

  // Render final error or success response
  this.renderResponse = function (res, status) {
    status = status || 200;
    return res.status(status).json(this.toHash());
  };
}

const responseHelper = {

  // Generate success response object
  successWithData: function (data) {
    return new Result(data);
  },

  // Generate error response object
  error: function(err_code, err_msg, err_prefix) {
    err_code = 'ost_platform(' + err_code + ":" + shortId.generate() + ')';
    if(err_prefix){
      err_code = err_prefix + "*" + err_code;
    }
    console.error('### Error ### ' + err_code + ' ###');
    console.error('### Error MSG ### ' + err_msg + ' ###');
    return new Result({}, err_code, err_msg);
  }

};

module.exports = responseHelper;