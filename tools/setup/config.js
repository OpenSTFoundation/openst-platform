const setupConfig = {

  test_folder: "openst-tmp",

  /**
   * Chain configurations
   */
  chains: {

    // Value Chain
    value: {
      folder_name: "openst-geth-value",
      chain_id: {
        evn_var: 'OST_VALUE_CHAIN_ID',
        value: '2001'
      },
      gas_price: {
        evn_var: 'OST_VALUE_GAS_PRICE',
        value: '0xBA43B7400'
      },
      ws_provider: {
        evn_var: 'OST_GETH_VALUE_WS_PROVIDER',
        value: 'ws://localhost:18545'
      },
      rpc_provider: {
        evn_var: 'OST_GETH_VALUE_RPC_PROVIDER',
        value: 'http://localhost:8545'
      },
    },

    // Utility Chain
    utility: {
      folder_name: "openst-geth-utility",
      chain_id: {
        evn_var: 'OST_UTILITY_CHAIN_ID',
        value: '2000'
      },
      gas_price: {
        evn_var: 'OST_UTILITY_GAS_PRICE',
        value: '0x12A05F200'
      },
      ws_provider: {
        evn_var: 'OST_GETH_UTILITY_WS_PROVIDER',
        value: 'ws://localhost:19546'
      },
      rpc_provider: {
        evn_var: 'OST_GETH_UTILITY_RPC_PROVIDER',
        value: 'http://localhost:9546'
      },
    }
  },

  /**
   * Address configurations
   */
  addresses: {

    // foundation
    foundation: {
      passphrase: 'testtest',
      evn_vars: {
        address: "OST_FOUNDATION_ADDR",
        passphrase: "OST_FOUNDATION_PASSPHRASE"
      },
      chains: {
        utility: {
          fund: ''
        },
        value: {
          fund: ''
        }
      },
    },

    // utility chain owner
    utilityChainOwner: {
      passphrase: 'testtest',
      evn_vars: {
        address: "OST_UTILITY_CHAIN_OWNER_ADDR",
        passphrase: "OST_UTILITY_CHAIN_OWNER_PASSPHRASE"
      },
      chains: {
        utility: {
          fund: ''
        },
        value: {
          fund: ''
        }
      },
    },

    // Staker address
    staker: {
      passphrase: 'testtest',
      evn_vars: {
        address: "OST_STAKER_ADDR",
        passphrase: "OST_STAKER_PASSPHRASE"
      },
      chains: {
        utility: {
          fund: ''
        },
        value: {
          fund: ''
        }
      },
    },

    // Redeemer address
    redeemer: {
      passphrase: 'testtest',
      evn_vars: {
        address: "OST_REDEEMER_ADDR",
        passphrase: "OST_REDEEMER_PASSPHRASE"
      },
      chains: {
        utility: {
          fund: ''
        },
        value: {
          fund: ''
        }
      },
    },

    // Value registrar address
    valueRegistrar: {
      passphrase: 'testtest',
      evn_vars: {
        address: "OST_VALUE_REGISTRAR_ADDR",
        passphrase: "OST_VALUE_REGISTRAR_PASSPHRASE"
      },
      chains: {
        value: {
          fund: ''
        }
      },
    },

    // Utility registrar address
    utilityRegistrar: {
      passphrase: 'testtest',
      evn_vars: {
        address: "OST_UTILITY_REGISTRAR_ADDR",
        passphrase: "OST_UTILITY_REGISTRAR_PASSPHRASE"
      },
      chains: {
        utility: {
          fund: ''
        }
      },
    },

    // Value Deployer Address
    valueDeployer: {
      passphrase: 'testtest',
      evn_vars: {
        address: "OST_VALUE_DEPLOYER_ADDR",
        passphrase: "OST_VALUE_DEPLOYER_PASSPHRASE"
      },
      chains: {
        value: {
          fund: ''
        }
      },
    },

    // Utility Deployer Address
    utilityDeployer: {
      passphrase: 'testtest',
      evn_vars: {
        address: "OST_UTILITY_DEPLOYER_ADDR",
        passphrase: "OST_UTILITY_DEPLOYER_PASSPHRASE"
      },
      chains: {
        utility: {
          fund: ''
        }
      },
    },

    // Value Ops Address
    valueOps: {
      passphrase: 'testtest',
      evn_vars: {
        address: "OST_VALUE_OPS_ADDR",
        passphrase: "OST_VALUE_OPS_PASSPHRASE"
      },
      chains: {
        value: {
          fund: ''
        }
      },
    },

  }
};

module.exports = setupConfig;