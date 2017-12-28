'use strict';

const helper = {
  promisifyMethod: function (scope, methodName, args) {
    return new Promise(function (onResolve, onReject) {
      args.push(function (err, data) {
        if (err) {
          onReject(err);
        } else {
          onResolve(data)
        }
      });

      scope[methodName].apply(scope, args);
    });
  }
};

module.exports = helper;