# env vars
export OST_GETH_UTILITY_RPC_PROVIDER='http://127.0.0.1:9546'
export OST_GETH_UTILITY_WS_PROVIDER='ws://127.0.0.1:19546'
export OST_GETH_VALUE_RPC_PROVIDER='http://127.0.0.1:8545'
export OST_GETH_VALUE_WS_PROVIDER='ws://127.0.0.1:18545'

# [OpenST platform](https://simpletoken.org) - bridging cryptocurrencies and mainstream consumer apps

**warning: this is pre-alpha software and under heavy development**

## About Simple Token

Simple Token [“ST”] is an EIP20 token and OpenST is a protocol to support token economies in mainstream consumer applications. The business and technical challenge we set out to solve is to enable mainstream consumer applications to benefit from deploying their own branded crypto-backed token economies, in a scalable and cryptographically auditable manner, without needing to mint and maintain their own publicly-tradeable EIP20 tokens.

The OpenST protocol enables the creation of utility tokens on a utility blockchain while the value of those tokens is backed by staked crypto-assets on a value blockchain.

The OpenST Protocol establishes a bridge between two differently purposed blockchains.  A value blockchain, which is required in order to hold cryptographically secured valuable assets; and a utility blockchain, which has utility tokens in favor of which the assets are held on the value blockchain.

## OpenST Platform

OpenST Platform is a network of open utility chains, where Simple Token is staked on Ethereum mainnet to mint different branded tokens on the utility chains.  Each branded token serves the users of a different consumer application.  Users can earn and spend across these economies.

`openst-platform` provides the middleware and application programming interface for a mainstream consumer application to integrate the OpenST protocol and platform into its backend.

![](docs/platform-illustration.png)

## Roadmap

Milestone 1 : OpenST Platform v0.9 (7 November 2017)

Milestone 2 : OpenST Platform v1.0 (Q1 2018)

Milestone 3 : Public Launch of Initial Member Companies (Q2 2018)

Milestone 4 : 10 Founding Member Companies (Q3-Q4 2018)

Milestone 5 : Consolidation of OpenST as open platform (2019)

At the highest level this diagram represents past work and future roadmap items.  All milestones and work items are indicative only.

![](docs/roadmap.png)

STEPS

1) Clean up the test/open_st_env_vars.sh except fixed constants
    source test/open_st_env_vars.sh

2) cd test/
   ./init_keys.sh

3) source test/open_st_env_vars.sh

4) Open a New Terminal
    cd test
    ./run_utility_chain.sh

5) Open a new Terminal and Run
    cd test
    ./run_value_chain.sh

6) On Value Chain machine
    source test/open_st_env_vars.sh
    node tools/deployOpenSTOnTestNet.js

    #deploys simpletoken, stake contract on value chain
    #Funds Member Companies

7) On Utility Chain Machine
    source test/open_st_env_vars.sh
    node tools/deployUtilityToken.js

    #deploys Utility Token Contract

8) Open a new terminal and run
    source test/open_st_env_vars.sh
    node services/registrar.js

9) node tools/stakeAndMint.js

10) To Host APIs
    source test/open_st_env_vars.sh
    npm start
