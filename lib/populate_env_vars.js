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
  "export OST_UTILITY_REGISTRAR_ADDR='{{ost_utility_registrar_address}}'\n"+
  "export OST_VALUE_REGISTRAR_ADDR='{{ost_value_registrar_address}}'\n"+
  "export OST_UTILITY_CHAIN_OWNER_ADDR='{{ost_utility_chain_owner_address}}'\n"+
  "export OST_VALUE_OPS_ADDR='{{ost_value_ops_address}}'\n"+
  "export OST_DEPLOYER_ADDR='{{ost_deployer_address}}'";

const contractTemplate = "export OST_SIMPLE_TOKEN_CONTRACT_ADDR='{{ost_simpletoken_contract_address}}'";

const valueRegistrarContractAddress = "export OST_VALUE_REGISTRAR_CONTRACT_ADDR='{{ost_value_registrar_contract_address}}'";

const openstValueContractAddress = "export OST_OPENSTVALUE_CONTRACT_ADDR='{{ost_openst_value_contract_address}}'";

const valueCoreContractAddress = "export OST_VALUE_CORE_CONTRACT_ADDR='{{ost_value_core_contract_address}}'";

const deployScript2AddressesTemplate = "export OST_UTILITY_REGISTRAR_CONTRACT_ADDR='{{ost_utility_registrar_contract_addr}}'\n" +
  "export OST_OPENSTUTILITY_CONTRACT_ADDR='{{ost_openstutility_contract_addr}}'\n"+
  "export OST_OPENSTUTILITY_ST_PRIME_UUID='{{ost_openstutility_st_prime_uuid}}'";

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
      else if (type == "valueRegistrar") {
        renderData = mustache.to_html(valueRegistrarContractAddress, vars);
      }
      else if (type == "valueOpenst") {
        renderData = mustache.to_html(openstValueContractAddress, vars);
      }
      else if (type == "valueCore") {
        renderData = mustache.to_html(valueCoreContractAddress, vars);
      }
      else if (type == "deployScript2AddressesTemplate") {
        renderData = mustache.to_html(deployScript2AddressesTemplate, vars);
      }
      else {
        console.error(" Invalid Template Type To render");
        process.exit(1);
      }
      var existingSourceFileData = fs.readFileSync(Path.join(__dirname, '/' + openStEnvVarsSourceFile));
      var dataToWrite = existingSourceFileData.toString() + "\n\n" + renderData;
      //console.log("ENV Constants to Write");
      //console.log(dataToWrite);
      fs.writeFileSync(Path.join(__dirname, '/' + openStEnvVarsSourceFile), dataToWrite);
    } catch(e) {
      console.error("Error Reading and Populating Source File");
      console.error(e);
      process.exit(1);
    }

  },

};

module.exports = populateEnvVars;
