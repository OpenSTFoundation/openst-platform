## OpenST-platform v0.9.2

In this release OpenST platform is published as a [node module](https://www.npmjs.com/package/@openstfoundation/openst-platform), now independent development can be supported using platform as the base layer.
Sample restful APIs have been released in a separate repository [Sample Restful APIs](https://github.com/OpenSTFoundation/openst-platform-apis). Various services are exposed for handling tasks in on boarding, get balance, transfer, stake & mint.

Auto registration is introduced after propose branded token to support requests coming from sandbox environments.

Deployment of platform was simplified to help developers to quickly get platform up and running.

There was a limitation in the earlier stake and mint process because the keystore files needed to be there on both utility chain geth node and value chain geth node for staker and redeemer addresses.
This was solved by change in process in which all the transactions are now done by a single address and the beneficiary address is credited with the desired value in terms of Branded tokens in stake & mint and in terms of Simple tokens in redeem and unstake.
Process staking, process minting and claim is now to be done using inter chain communicator.

[OpenST Cache](https://www.npmjs.com/package/@openstfoundation/openst-cache) is also developed to replace "in process" caching implemented in previous version, 
which became inconsistent in presence of multiple workers/processes. Caching layer now provide Redis, Memcached and none (in process) options to suite the platform 
run environment. Decision of which caching layer to use is governed by an ENV variable 'OST_CACHING_ENGINE'.

Simple Token Prime Balance was cached to improve performance. Stake and mint related cache inconsistency bug was resolved.

Detailed changelog:
- Platform [Sample Restful APIs](https://github.com/OpenSTFoundation/openst-platform-apis) in separate repository ([openst-platform#97](https://github.com/OpenSTFoundation/openst-platform/issues/97))
- Publish platform as node module ([openst-platform#98](https://github.com/OpenSTFoundation/openst-platform/issues/98))
- Simplified platform setup for development and test environments ([openst-platform#99](https://github.com/OpenSTFoundation/openst-platform/issues/99))
- Service for following tasks were exposed out of the platform module:
    - Get transaction receipt([openst-platform#109](https://github.com/OpenSTFoundation/openst-platform/issues/109))
    - Services for transfer of branded tokens, simple tokens, eth and simple token prime([openst-platform#108](https://github.com/OpenSTFoundation/openst-platform/issues/108))
    - Stake and mint(([openst-platform#107](https://github.com/OpenSTFoundation/openst-platform/issues/107)))
    - On Boarding service - propose branded token (([openst-platform#105](https://github.com/OpenSTFoundation/openst-platform/issues/105)))
    - On Boarding service - get registration information (([openst-platform#102](https://github.com/OpenSTFoundation/openst-platform/issues/102)))
    - Get balance services for Simple Token, Simple Token Prime, Eth and Branded Token (([openst-platform#104](https://github.com/OpenSTFoundation/openst-platform/issues/104)))

- Enable auto-register on both chains after proposal using an Inter chain communicator ([openst-platform#101](https://github.com/OpenSTFoundation/openst-platform/issues/101))
- Stake and mint process changes ([openst-platform#106](https://github.com/OpenSTFoundation/openst-platform/issues/106))
- Integrate openst-cache in platform ([openst-platform#96](https://github.com/OpenSTFoundation/openst-platform/issues/96))
- Publish events from platform ([openst-platform#100](https://github.com/OpenSTFoundation/openst-platform/issues/100))
- Cache flush not happening in stake and mint for branded token ([openst-platform#76](https://github.com/OpenSTFoundation/openst-platform/issues/76))
- Enable caching for simple token prime ([openst-platform#77](https://github.com/OpenSTFoundation/openst-platform/issues/77))
- Fixed - Scripts: variables/members are appended and not overwritten ([openst-platform#94](https://github.com/OpenSTFoundation/openst-platform/issues/94))
- Fixed - Scripts: make confirmations case-insensitive and clarify fails ([openst-platform#84](https://github.com/OpenSTFoundation/openst-platform/issues/84))
- Fixed - Failed to unlock Reserve ([openst-platform#95](https://github.com/OpenSTFoundation/openst-platform/issues/95))

[openst-platform v0.9.1](https://github.com/OpenSTFoundation/openst-platform/releases/tag/v0.9.1) December 19 2017
---

This release enables developers to replicate the OpenST protocol on the Ethereum mainnet leveraging the scalability and performance capabilities of OpenST defined blockchains, and stake and mint branded token.

Connecting Geth to Utility Chain
  - Users can download and execute shell script to connect to utility chain.
  - Main-Net Utility Chain
      ```
      wget https://s3.amazonaws.com/assets.simpletoken.com/scripts/setup_uc_1411_node.sh
      sh setup_uc_1411_node.sh
      ```
      
  - Test-Net Utility Chain
      ```
      wget https://s3.amazonaws.com/assets.simpletoken.com/scripts/setup_uc_1410_node.sh
      sh setup_uc_1410_node.sh
      ```
      
Development Environment
  - Scripts to setup local Value Chain & Utility Chain for development/testing purposes have been provided. Please refer [test/README.md](test/README.md)

Deployment
  - The Deployment script has been split into three parts:
    - tools/deploy/openst_and_registrar_value.js
      - Deploys Registrar Contract on value chain. 
      - Deploys OpenST Value Contract on value chain.
    - tools/deploy/openst_stprime_registrar_utility.js
      - Deploys Registrar contract on utility chain.
      - Deploys openSTUtility contract on utility chain.
      - Deploys STPrime contract on utility chain.
    - tools/deploy/core_and_register_utility_token_value.js
      - Deploys ValueCore contract.

Services
  - Intercom Services:
    Intercom services are responsible for transferring information between value chain & utility chain by listening to events.
    The intercom transfers information using registrar contracts. Services:  
    - executables/inter_comm/stake_and_mint.js
      - Listens: StakingIntentDeclared event on value chain.
      - Action: confirms staking intent on utility chain.
    - executables/inter_comm/redeem_and_unstake.js
      - Listens: RedemptionIntentDeclared event on utility chain.
      - Action: Confirms redemption intent on value chain.
    
Tools
  - Stake And Mint Tools:
    - tools/stake_and_mint/for_st_prime.js
      -  Stakes `Simple Token` on the value chain and mints `Simple Token Prime` on the utility chain.
      -  By default, Staker Address is Utility-Chain Owner Address
    - tools/stake_and_mint/for_branded_token.js
      - Stakes `Simple Token` on the value chain and mints `Branded Token` on the utility chain.
      
  - Redeem And Unstake Tools:
    - tools/unstake_and_redeem/for_st_prime.js
      - Redeems `Simple Token Prime` on the utility chain and unstakes `Simple Token` on the value chain.
    - tools/unstake_and_redeem/for_branded_token.js
      - Redeems `Branded Token` on the utility chain and unstakes `simple-token` on the value chain.

API
  - All branded token API have been moved to /bt/[SYMBOL]/
  - Standard format for API has been updated. New format:
  ```javascript
  {
    success: true/false /*Indicates if API call was successful or not. */
    data: {
      ... /* Any data that is expected from API.*/
    },
    error: {  /* If an error occours, the error details */
      code: "[ERROR_CODE]",
      msg: "[ERROR_MESSAGE]"
    }
  }
  ```

  - Available API
    - /bt/[SYMBOL]/
      - Serves as health check for the `Branded Token` API(s).
    - /bt/[SYMBOL]/reserve
      - Returns the reserve address associated with `Branded Token`.
    - /bt/[SYMBOL]/name
      - Returns the `Branded Token` name.
    - /bt/[SYMBOL]/uuid
      - Returns the UUID of the `Branded Token`.
    - /bt/[SYMBOL]/symbol
      - Returns the symbol of the `Branded Token`.
    - /bt/[SYMBOL]/decimals
      - Returns the decimals configured in the `Branded Token`.
    - /bt/[SYMBOL]/totalSupply 
      - Returns the total supply of `Branded Token`.
    - /bt/[SYMBOL]/balanceOf?owner=[OWNER] 
      - Returns the amount of `Branded Token` owned by the address [OWNER]
    - /bt/[SYMBOL]/newkey 
      - Creates a new managed user key and returns the address.
    - /bt/[SYMBOL]/transfer?sender=[SENDER]&to=[RECIPIENT]&amount=[AMOUNT]&tag=[TRANSFER_TAG]. 
      - Transfers specified [AMOUNT] `Branded Tokens` from SENDER address to RECIPIENT address.
      - Also returns TRANSACTION_UUID generated for the transaction. This TRANSACTION_UUID can be used fetch transaction logs.
      - Notes: 
        - RESERVE address must be managed address created using tools/init_utility_token script.
        - SENDER address must be managed address created using /bt/[SYMBOL]/newkey Api.
        - The RESERVE address also transfers ST Prime to the sender address if sender address does not have sufficient ST Prime to carry out the transfer.
    - /bt/[SYMBOL]/failed-transactions
      - Returns an array of failed TRANSACTION_UUID(s).
    - /bt/[SYMBOL]/pending-transactions
      - Returns an array of TRANSACTION_UUID(s) that are currently in progress.
    - /bt/[SYMBOL]/transaction-logs?transactionUUID=[TRANSACTION_UUID]
      - Returns the transaction logs associated with TRANSACTION_UUID.
      
[openst-platform v0.9.0](https://github.com/OpenSTFoundation/openst-platform/releases/tag/v0.9.0) November 8 2017
---
Initial release of the OpenST platform as used in the demonstration [video](https://youtu.be/-SxJ8c1Xh_A).<br />
Starting the chains and the nodejs app starts a full dev environment to start building on top of the OpenST platform: 
https://github.com/OpenSTFoundation/openst-platform/blob/v0.9.0/test/README.md
