const fs = require('fs');
const Path = require('path');

const _addresses = {
  "foundation": null,
  "admin":null,
  "members": []
};

const Config = require(process.argv[3] || '../config.json');
const poaGenesisValue = require("./poa-genesis-value.json");
const poaGenesisUtility = require("./poa-genesis-utility.json");

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
      updateFoundationAddress( thisAddress );
    } else if ( !_addresses.admin ) {
      _addresses.admin = thisAddress;
      updateAdminAddress( thisAddress );
    } else {
      //Member Address
      _addresses.members.push( thisAddress );
      updateMember( (_addresses.members.length - 1 ), thisAddress);
    }
  });
  wrtieJsonToFile( Config, '/../config.json', 4);

}

function updateFoundationAddress( foundation ) {
  //Update Config.
  Config.SimpleTokenFoundation = foundation;
  
  //Update poa-genesis-value
  updateGenesisAlloc( poaGenesisValue, foundation, "0x200000000000000000000000000000000000000000000000000000000000000");
  wrtieJsonToFile(poaGenesisValue, "./poa-genesis-value.json");

  //Update poa-genesis-utility
  updateGenesisAlloc( poaGenesisUtility, foundation, "0x2000000000000000000000000000000000000000000000000000000000000000");
  wrtieJsonToFile(poaGenesisUtility, "./poa-genesis-utility.json");
}

function updateAdminAddress( admin ) {
  Config.ValueChain.Admin = admin;
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


function wrtieJsonToFile( jsObject, relativeFilePath, tab_space ) {
  tab_space = tab_space || 2;
  var json = JSON.stringify(jsObject, null, tab_space);
  fs.writeFileSync(Path.join(__dirname, '/' + relativeFilePath ), json );
}

main( process.argv[2] );
