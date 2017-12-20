const fs = require('fs');
const Path = require('path');

const _addresses = {
  "foundation": null,
  "admin":null,
  "valueDeployer": null,
  "opsAdd": null,
  "utilityChainOwnerAddress": null,
  "utilityDeployer": null,
  "members": []
};

const rootPrefix = ".."
  , coreConstants   = require( rootPrefix + '/config/core_constants' )
  , Config = require(process.argv[3] || coreConstants.OST_MEMBER_CONFIG_FILE_PATH )
  , poaGenesisValue = require( rootPrefix + "/test/poa-genesis-value.json" )
  , poaGenesisUtility = require( rootPrefix + "/test/poa-genesis-utility.json")
  , populateEnvVars = require( rootPrefix + "/lib/populate_env_vars.js")
;

function main( addressFile ) {
  const _path = Path.join(__dirname, addressFile );
  const fileContent = fs.readFileSync( _path, "utf8");
  fileContent.toString().split('\n').forEach(function (line, index) {

    var thisAddress = line.replace("Address: {", "0x").replace("}","").trim();
    if ( thisAddress.length < 40 ) {
      return;
    }

    if ( !_addresses.foundation ) {
      //First Address
      _addresses.foundation = thisAddress;
      fundFoundationAddress(thisAddress);
    } else if ( !_addresses.admin ) {
      _addresses.admin = thisAddress;
      fundRegistrarAddress(thisAddress);
    } else if ( !_addresses.valueDeployer ) {
      _addresses.valueDeployer = thisAddress;
    } else if ( !_addresses.utilityDeployer ) {
      _addresses.utilityDeployer = thisAddress;
      fundUtilityDeployerAddress( thisAddress );
    } else if ( !_addresses.opsAdd ) {
      _addresses.opsAdd = thisAddress;
      fundOpsAddress( thisAddress );
    } else if ( !_addresses.utilityChainOwnerAddress ) {
      _addresses.utilityChainOwnerAddress = thisAddress;
    }
    else {
      //Member Address
      _addresses.members.push( thisAddress );
      updateMember( (_addresses.members.length - 1 ), thisAddress);
    }
  });

  var configFilePath = process.argv[3] || coreConstants.OST_MEMBER_CONFIG_FILE_PATH;
  configFilePath = configFilePath;

  writeJsonToFile( Config, configFilePath, 4);

  populateEnvVars.renderAndPopulate('address', {
      ost_foundation_address: _addresses.foundation,
      ost_value_registrar_address: _addresses.admin,
      ost_utility_registrar_address: _addresses.admin,
      ost_utility_chain_owner_address: _addresses.utilityChainOwnerAddress,
      ost_value_ops_address: _addresses.opsAdd,
      ost_value_deployer_address: _addresses.valueDeployer,
      ost_utility_deployer_address: _addresses.utilityDeployer
    }
  );

}

function fundFoundationAddress( foundation ) {

  //Update poa-genesis-value
  updateGenesisAlloc( poaGenesisValue, foundation, "0x200000000000000000000000000000000000000000000000000000000000000");
  writeJsonToFile(poaGenesisValue, "./poa-genesis-value.json");

  //Update poa-genesis-utility
  updateGenesisAlloc( poaGenesisUtility, foundation, "0x2000000000000000000000000000000000000000000000000000000000000000");
  writeJsonToFile(poaGenesisUtility, "./poa-genesis-utility.json");
}

function fundRegistrarAddress(registrar) {

  //Update poa-genesis-value
  updateGenesisAlloc( poaGenesisValue, registrar, "0x200000000000000000000000000000000000000000000000000000000000000");
  writeJsonToFile(poaGenesisValue, "./poa-genesis-value.json");

  //Update poa-genesis-utility
  updateGenesisAlloc( poaGenesisUtility, registrar, "0x2000000000000000000000000000000000000000000000000000000000000000");
  writeJsonToFile(poaGenesisUtility, "./poa-genesis-utility.json");

}

function fundOpsAddress( opsAddress ) {

  //Update poa-genesis-value
  updateGenesisAlloc( poaGenesisValue, opsAddress, "0x200000000000000000000000000000000000000000000000000000000000000");
  writeJsonToFile(poaGenesisValue, "./poa-genesis-value.json");

}

function fundUtilityDeployerAddress(utilityDeployerAddress) {

  // Fund exactly 800 Million
  updateGenesisAlloc( poaGenesisUtility, utilityDeployerAddress, "0x295BE96E640669720000000");
  writeJsonToFile(poaGenesisUtility, "./poa-genesis-utility.json");
}

function updateGenesisAlloc( genesis, foundation, value ) {
  const _alloc = genesis.alloc;
  _alloc[ foundation ] = { "balance" : value };
  //Remove the place holder if it exists.
  _alloc[ "" ] && (delete _alloc[ "" ] );
}

function updateMember( indx, memberReserveAddress ) {
  const thisMember = Config.Members[ indx ];
  if ( !thisMember ) {
    console.warn("Members block missing in config.json. Ignoring Address :: ", memberReserveAddress);
    return;
  }
  thisMember["Reserve"] = memberReserveAddress;

}

function writeJsonToFile( jsObject, relativeFilePath, tab_space ) {
  tab_space = tab_space || 2;
  var json = JSON.stringify(jsObject, null, tab_space);

  var jsonFilePath = relativeFilePath;
  if ( !Path.isAbsolute( jsonFilePath ) ) {
    jsonFilePath = Path.join(__dirname, '/' + relativeFilePath );
  }

  console.log("writeJsonToFile :: jsonFilePath :: ", jsonFilePath);

  fs.writeFileSync(jsonFilePath, json );
}

main( process.argv[2] );
