const setupConfig = {

  test_folder: "openst-tmp",

  /**
   * Chain configurations
   */
  chains: {

    // Value Chain
    value: {
      folder_name: "openst-geth-value",
      alloc_balance_to_addr: 'foundation',
      chain_id: {
        evn_var: 'OST_VALUE_CHAIN_ID',
        value: 2001
      },
      network_id: {
        evn_var: '',
        value: 1411
      },
      port: {
        evn_var: '',
        value: 30301
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
      }
    },

    // Utility Chain
    utility: {
      folder_name: "openst-geth-utility",
      alloc_balance_to_addr: 'utilityDeployer',
      chain_id: {
        evn_var: 'OST_UTILITY_CHAIN_ID',
        value: 2000
      },
      network_id: {
        evn_var: '',
        value: 1410
      },
      port: {
        evn_var: '',
        value: 30300
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
      }
    }
  },

  /**
   * Address configurations
   */
  addresses: {

    // foundation
    foundation: {
      address: {
        evn_var: 'OST_FOUNDATION_ADDR',
        value: ''
      },
      passphrase: {
        evn_var: 'OST_FOUNDATION_PASSPHRASE',
        value: 'testtest'
      },
      chains: {
        value: {
          fund: ''
        }
      }
    },

    // utility chain owner
    utilityChainOwner: {
      address: {
        evn_var: 'OST_UTILITY_CHAIN_OWNER_ADDR',
        value: ''
      },
      passphrase: {
        evn_var: 'OST_UTILITY_CHAIN_OWNER_PASSPHRASE',
        value: 'testtest'
      },
      chains: {
        utility: {
          fund: ''
        },
        value: {
          fund: ''
        }
      }
    },

    // Sealer address
    sealer: {
      address: {
        evn_var: '',
        value: ''
      },
      passphrase: {
        evn_var: '',
        value: 'testtest'
      },
      chains: {
        utility: {
          fund: ''
        },
        value: {
          fund: ''
        }
      }
    },

    // Staker address
    staker: {
      address: {
        evn_var: 'OST_STAKER_ADDR',
        value: ''
      },
      passphrase: {
        evn_var: 'OST_STAKER_PASSPHRASE',
        value: 'testtest'
      },
      chains: {
        utility: {
          fund: ''
        },
        value: {
          fund: ''
        }
      }
    },

    // Redeemer address
    redeemer: {
      address: {
        evn_var: 'OST_REDEEMER_ADDR',
        value: ''
      },
      passphrase: {
        evn_var: 'OST_REDEEMER_PASSPHRASE',
        value: 'testtest'
      },
      chains: {
        utility: {
          fund: ''
        },
        value: {
          fund: ''
        }
      }
    },

    // Value registrar address
    valueRegistrar: {
      address: {
        evn_var: 'OST_VALUE_REGISTRAR_ADDR',
        value: ''
      },
      passphrase: {
        evn_var: 'OST_VALUE_REGISTRAR_PASSPHRASE',
        value: 'testtest'
      },
      chains: {
        value: {
          fund: ''
        }
      }
    },

    // Utility registrar address
    utilityRegistrar: {
      address: {
        evn_var: 'OST_UTILITY_REGISTRAR_ADDR',
        value: ''
      },
      passphrase: {
        evn_var: 'OST_UTILITY_REGISTRAR_PASSPHRASE',
        value: 'testtest'
      },
      chains: {
        utility: {
          fund: ''
        }
      }
    },

    // Value Deployer Address
    valueDeployer: {
      address: {
        evn_var: 'OST_VALUE_DEPLOYER_ADDR',
        value: ''
      },
      passphrase: {
        evn_var: 'OST_VALUE_DEPLOYER_PASSPHRASE',
        value: 'testtest'
      },
      chains: {
        value: {
          fund: ''
        }
      }
    },

    // Utility Deployer Address
    utilityDeployer: {
      address: {
        evn_var: 'OST_UTILITY_DEPLOYER_ADDR',
        value: ''
      },
      passphrase: {
        evn_var: 'OST_UTILITY_DEPLOYER_PASSPHRASE',
        value: 'testtest'
      },
      chains: {
        utility: {
          fund: ''
        }
      }
    },

    // Value Ops Address
    valueOps: {
      address: {
        evn_var: 'OST_VALUE_OPS_ADDR',
        value: ''
      },
      passphrase: {
        evn_var: 'OST_VALUE_OPS_PASSPHRASE',
        value: 'testtest'
      },
      chains: {
        value: {
          fund: ''
        }
      }
    },

  }
};

module.exports = setupConfig;
