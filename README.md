OpenST-Platform
============

OpenST Platform is a npm package exposing all the needed functionalities provided by OpenST-Protocol.

# Install OpenST Platform

```bash
npm install @openstfoundation/openst-platform --save
```

# Set EVN Variables
Populate all the needed environment variables in test/open_st_env_vars.sh file and then source it.

##### Source the environment variable file:
```bash
source test/open_st_env_vars.sh
```

# Example:

Require the npm package to start using the exported functionalities.

```js
const openSTPlatform = require('@openstfoundation/openst-platform')
```

## On-Boarding Services

For on-boarding partner companies, we have 2 services:
- **propose branded token** - To start the registration process, a propose step is needed.

```js
openSTPlatform.services.onBoarding.proposeBt(
  '0x8312731f3c4446b6aae61caebdf9c9249409f140', // address which will perform proposal transaction
  'testtest', // passphrase of the address above
  'KC', // symbol of the branded token
  'Kedar Coin', // name of the branded token
  100 // how many branded tokens will 1 OST correspond to
  )
```

This returns a Promise, which resolves into transaction hash of the proposal transaction.

- **get registration status** - The transaction hash which is obtained above, can be used to fetch the current status of the registration.

```js
proposalTxHash = '0x55ee82802027eb83e45ac33ba8e681765f141cd5781d4a6e2fcd57e56276519e'
openSTPlatform.services.onBoarding.getRegistrationStatus(
  proposalTxHash // this is the transaction hash which is obtained while proposing the branded token
  )
```

This returns a Promise which resolves to an object having the ERC20 contract address of the branded token, uuid of the 
branded token and various flags signifying the steps which are done and pending.


# [OpenST platform](https://simpletoken.org) - bridging cryptocurrencies and mainstream consumer apps

While OpenST 0.9 is available as-is for anyone to use, we caution that this is early stage software and under heavy ongoing development and improvement. Please report bugs and suggested improvements.

Watch demo video of milestone 1 (will take you to [https://www.youtube.com/watch?v=-SxJ8c1Xh_A](https://www.youtube.com/watch?v=-SxJ8c1Xh_A))

[![Milestone 1 demo video](https://img.youtube.com/vi/-SxJ8c1Xh_A/0.jpg)](https://www.youtube.com/watch?v=-SxJ8c1Xh_A)

## About Simple Token

Simple Token [“ST”] is an EIP20 token and OpenST is a protocol to support token economies in mainstream consumer applications. The business and technical challenge we set out to solve is to enable mainstream consumer applications to benefit from deploying their own branded crypto-backed token economies, in a scalable and cryptographically auditable manner, without needing to mint and maintain their own publicly-tradeable EIP20 tokens.

The OpenST protocol enables the creation of utility tokens on a utility blockchain while the value of those tokens is backed by staked crypto-assets on a value blockchain.

The OpenST Protocol establishes a bridge between two differently purposed blockchains.  A value blockchain, which is required in order to hold cryptographically secured valuable assets; and a utility blockchain, which has utility tokens in favor of which the assets are held on the value blockchain.

## OpenST Platform

OpenST Platform is a network of open utility chains, where Simple Token is staked on Ethereum mainnet to mint different branded tokens on the utility chains.  Each branded token serves the users of a different consumer application.  Users can earn and spend across these economies.

`openst-platform` provides the middleware and application programming interface for a mainstream consumer application to integrate the OpenST protocol and platform into its backend.

<img src="https://openstfoundation.github.io/openst-platform/illustrations/platform-illustration.png" style="max-width: 100%;" />

## Roadmap

Milestone 1 : OpenST Platform v0.9 (7 November 2017)

Milestone 2 : OpenST Platform v1.0 (Q1 2018)

Milestone 3 : Public Launch of Initial Member Companies (Q2 2018)

Milestone 4 : 10 Founding Member Companies (Q3-Q4 2018)

Milestone 5 : Consolidation of OpenST as open platform (2019)
