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

1)  In test/open_st_env_vars.sh, verify all the addressed if known else keep it blank
    - source test/open_st_env_vars.sh

2) On Development only
   - cd test/
   - ./init_keys.sh
   - populate OST_FOUNDATION_ADDR(SimpleTokenFoundation), OST_REGISTRAR_ADDR(ValueChain.Admin) from config.json to test/open_st_env_vars.sh
   - source test/open_st_env_vars.sh

3) On Development only
    - Verify genesis test/poa-genesis-value.json
    - Open a new Terminal and Run
    - cd test
    - ./run_value_chain.sh

4) Verify test/poa-genesis-utility.json
   - Open a New Terminal
   - cd test
   - ./run_utility_chain.sh

6) On development only - if simple contract is not deployed
    - On value chain machine
    - source test/open_st_env_vars.sh
    - node test/deployOpenSTOnTestNet.js
    - populate OST_SIMPLE_TOKEN_CONTRACT_ADDR in test/open_st_env_vars.sh from config.json

    # Deploys SimpleToken contract on value chain
    # Funds Member Companies

7) If staking contract is not deployed on production
    - On Value Chain machine
    - source test/open_st_env_vars.sh
    - node lib/deploy/staking.js
    - From contract deployment receipt populate OST_STAKING_CONTRACT_ADDR in open_st_env_vars.sh
    - Also populate staking contract address(config.Stake) in config.json

8) On Utility Chain Machine
    - source test/open_st_env_vars.sh
    - node lib/deploy/utility_token.js
    - From contract deployment receipt populate OST_UTILITY_TOKEN_CONTRACT_ADDR in open_st_env_vars.sh
    - Populate utility_token contract address(config.Members.ERC20) in config.json
    - Populate UUID(config.Members.UUID) from console in config.json

9) Open a new terminal and run
    - source test/open_st_env_vars.sh
    - node services/registrar.js

10) For staking and minting
   - source test/open_st_env_vars.sh
   - node tools/stakeAndMint.js

11) To Host APIs
    source test/open_st_env_vars.sh
    npm start
