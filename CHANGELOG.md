## OpenST-platform v0.9.2

This release enabled horizontal scaling of the restful APIs implementing the ability to launch a cluster of Node.js 
processes to handle the load. Number of worker processes is based on number of CPUs and multiplication factor.

Central caching was brought in to the API layer. Prior to this, "in process" caching was being used, 
which became inconsistent in presence of multiple workers. Redis and Memcached were explored for in memory caching.
Decision of which caching to use is governed by an ENV variable 'CACHING_ENGINE'.

Stake and mint related cache inconsistency bug was resolved.

Detailed changelog:
- Horizontal scaling of Restful API ([openst-platform#61](https://github.com/OpenSTFoundation/openst-platform/issues/61))
- Replace "in process caching" with "in memory caching" ([openst-platform#62](https://github.com/OpenSTFoundation/openst-platform/issues/62))
- Cache flush not happening in stake and mint for branded token ([openst-platform#76](https://github.com/OpenSTFoundation/openst-platform/issues/76))


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
    - services/inter_comm/stake_and_mint.js
      - Listens: StakingIntentDeclared event on value chain.
      - Action: confirms staking intent on utility chain.
    - services/inter_comm/redeem_and_unstake.js
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
