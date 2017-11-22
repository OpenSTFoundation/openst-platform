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

const addressTemplate = "export OST_FOUNDATION_ADDRESS='{{ost_foundation_address}}'\n" +
"export OST_REGISTRAR_ADDRESS='{{ost_registrar_address}}'\n" +
  "export OST_REGISTRAR_SECRET_KEY=''";

const contractTemplate = "export OST_SIMPLETOKEN_CONTRACT_ADDRESS='{{ost_simpletoken_contract_address}}'\n"+
"export OST_STAKE_CONTRACT_ADDRESS='{{ost_stake_contract_address}}'";

const populateEnvVars = {

  renderAndPopulate: function (type, vars) {
    var renderData = '';

    if (type == 'address') {
      renderData = mustache.to_html(addressTemplate, vars);
    }
    else if(type == 'contract') {
      renderData = mustache.to_html(contractTemplate, vars);
    } else {
      console.error(" Invalid Template Type To render");
      process.exit(1);
    }
    var existingSourceFileData = fs.readFileSync(Path.join(__dirname, '/' + openStEnvVarsSourceFile));
    var dataToWrite =  existingSourceFileData.toString() + "\n\n" + renderData;
    console.log("Data to Write");
    console.log(dataToWrite);
    fs.writeFileSync(Path.join(__dirname, '/' + openStEnvVarsSourceFile), dataToWrite);

  },

}

module.exports = populateEnvVars;
