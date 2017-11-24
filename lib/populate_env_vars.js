"use strict";
/*
 * Helper
 *
 * * Author: Abhay
 * * Date: 22/11/2017
 * * Reviewed by:
 */

const mustache = require('mustache')
  , fs = require('fs')
  , Path = require('path')
 , openStEnvVarsSourceFile = '../test/open_st_env_vars.sh';

const addressTemplate = "export OST_FOUNDATION_ADDR='{{ost_foundation_address}}'\n" +
"export OST_REGISTRAR_ADDR='{{ost_registrar_address}}'\n" +
  "export OST_REGISTRAR_PASSPHRASE=''";

const contractTemplate = "export OST_SIMPLE_TOKEN_CONTRACT_ADDR='{{ost_simpletoken_contract_address}}'\n"+
"export OST_STAKING_CONTRACT_ADDR='{{ost_stake_contract_address}}'";

const deployerAddressTemplate = "export OST_DEPLOYER_ADDR='{{ost_deployer_address}}'";

const populateEnvVars = {

  renderAndPopulate: function (type, vars) {
    var renderData = '';
    try {
      if (type == 'address') {
        renderData = mustache.to_html(addressTemplate, vars);
      }
      else if (type == 'contract') {
        renderData = mustache.to_html(contractTemplate, vars);
      }
      else if (type == "deployer") {
        renderData = mustache.to_html(deployerAddressTemplate, vars);
      }
      else {
        console.error(" Invalid Template Type To render");
        process.exit(1);
      }
      var existingSourceFileData = fs.readFileSync(Path.join(__dirname, '/' + openStEnvVarsSourceFile));
      var dataToWrite = existingSourceFileData.toString() + "\n\n" + renderData;
      console.log("ENV Constants to Write");
      console.log(dataToWrite);
      fs.writeFileSync(Path.join(__dirname, '/' + openStEnvVarsSourceFile), dataToWrite);
    } catch(e) {
      console.error("Error Reading and Populating Source File");
      console.error(e);
      process.exit(1);
    }

  },

};

module.exports = populateEnvVars;
