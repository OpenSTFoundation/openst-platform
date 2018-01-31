"use strict";

/**
 * Contract interaction methods for branded token contract.<br><br>
 *
 * @module lib/contract_interact/branded_token
 *
 */

const uuid = require('uuid')
  , BigNumber = require('bignumber.js')
  , cacheModule = require('@openstfoundation/openst-cache')
;

const rootPrefix = '../..'
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , StPrimeKlass = require(rootPrefix + '/lib/contract_interact/st_prime')
  , TransactionLogger = require(rootPrefix + '/helpers/transactionLogger')
;

const contractName = 'brandedToken'
  , stPrimeTransferFactor = 3
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , registrarAddress = coreAddresses.getAddressForUser('valueRegistrar')
  , registrarKey = coreAddresses.getPassphraseForUser('valueRegistrar')
  , chainId = coreConstants.OST_UTILITY_CHAIN_ID
  , UTILITY_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE
  , stPrime = new StPrimeKlass(null)
  , cacheImplementer = cacheModule.cache
  , cacheKeys = cacheModule.OpenSTCacheKeys
;

/**
 * Constructor to create object of BrandedTokenContractInteractKlass
 *
 * @constructor
 *
 * @param {object} memberObject - Object containing member company's Config - this should have these keys -
 * ERC20, Reserve and Symbol
 *
 */
const BrandedTokenContractInteractKlass = function (memberObject) {
  this.memberObject = memberObject;
  this.currContract = new web3RpcProvider.eth.Contract(contractAbi, this._getBTAddress());
  this.currContract.setProvider(web3RpcProvider.currentProvider);
};

BrandedTokenContractInteractKlass.prototype = {

  currContract: null,
  memberObject: null,

  /**
   * Fetch Web3 Provider for this member company
   *
   * @return {web3RpcProvider}
   *
   */
  getWeb3Provider: function () {
    return web3RpcProvider;
  },

  /**
   * Fetch Name for this member company
   *
   * @return {promise<result>}
   *
   */
  getName: function () {
    const oThis = this;
    const cache_key = cacheKeys.btName(chainId, oThis._getBTAddress());

    return cacheImplementer.get(cache_key)
      .then(function (response) {
        if (response.isSuccess() && response.data.response != null) {
          return response.data.response;

        } else {

          const mcAddress = oThis._getMemberReserve();
          const btAddress = oThis._getBTAddress();

          const transactionObject = oThis.currContract.methods.name();
          const encodeABI = transactionObject.encodeABI();
          const transactionOutputs = helper.getTransactionOutputs(transactionObject);

          return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
            .then(function (decodedResponse) {
              logger.info("decodedResponse", decodedResponse);
              return decodedResponse[0];
            })
            .then(function (name) {
              logger.info("===========---==", "name", name, "cache_key", cache_key);
              cacheImplementer.set(cache_key, name);
              return name;
            });
        }
      })
      .then(function (response) {
        logger.info("response", JSON.stringify(response));
        return responseHelper.successWithData({name: response});
      })
      .catch(function (err) {
        logger.error(err);
        return Promise.resolve(responseHelper.error('ci_ut_1', 'Something went wrong'));
      })
      ;
  },

  /**
   * Fetch Symbol for this member company
   *
   * @return {promise<result>}
   *
   */
  getSymbol: function () {
    const oThis = this;
    const cache_key = cacheKeys.btSymbol(chainId, oThis._getBTAddress());
    return cacheImplementer.get(cache_key)
      .then(function (response) {
        if (response.isSuccess() && response.data.response != null) {
          return response.data.response;
        } else {

          const mcAddress = oThis._getMemberReserve();
          const btAddress = oThis._getBTAddress();

          const transactionObject = oThis.currContract.methods.symbol();
          const encodeABI = transactionObject.encodeABI();
          const transactionOutputs = helper.getTransactionOutputs(transactionObject);

          return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
            .then(function (decodedResponse) {
              return decodedResponse[0];
            })
            .then(function (symbol) {
              cacheImplementer.set(cache_key, symbol);
              return symbol;
            });
        }
      })
      .then(function (response) {
        return responseHelper.successWithData({symbol: response});
      })
      .catch(function (err) {
        logger.error(err);
        return responseHelper.error('ci_ut_2', 'Something went wrong');
      })
      ;
  },

  /**
   * Fetch Decomals for this member company
   *
   * @return {promise<result>}
   *
   */
  getDecimals: function () {
    const oThis = this;
    const cache_key = cacheKeys.btDecimals(chainId, oThis._getBTAddress());
    return cacheImplementer.get(cache_key)
      .then(function (response) {
        if (response.isSuccess() && response.data.response != null) {
          logger.info("getDecimals cache hit");
          return response.data.response;

        } else {
          logger.info("getDecimals cache miss");
          const mcAddress = oThis._getMemberReserve();
          const btAddress = oThis._getBTAddress();

          const transactionObject = oThis.currContract.methods.decimals();
          const encodeABI = transactionObject.encodeABI();
          const transactionOutputs = helper.getTransactionOutputs(transactionObject);

          return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
            .then(function (decodedResponse) {
              return decodedResponse[0];
            })
            .then(function (decimals) {
              cacheImplementer.set(cache_key, decimals);
              return decimals;
            });
        }
      })
      .then(function (response) {
        return responseHelper.successWithData({decimals: response});
      })
      .catch(function (err) {
        logger.error(err);
        return responseHelper.error('ci_ut_3', 'Something went wrong');
      })
      ;
  },

  /**
   * Fetch UUID for this member company
   *
   * @return {promise<result>}
   *
   */
  getUuid: function () {
    const oThis = this;
    const cache_key = cacheKeys.btUUID(chainId, oThis._getBTAddress());
    return cacheImplementer.get(cache_key)
      .then(function (response) {
        if (response.isSuccess() && response.data.response != null) {
          logger.info("getUuid cache hit");
          return response.data.response;

        } else {
          logger.info("getUuid cache miss");
          const mcAddress = oThis._getMemberReserve();
          const btAddress = oThis._getBTAddress();

          const transactionObject = oThis.currContract.methods.uuid();
          const encodeABI = transactionObject.encodeABI();
          const transactionOutputs = helper.getTransactionOutputs(transactionObject);

          return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
            .then(function (decodedResponse) {
              return decodedResponse[0];
            })
            .then(function (uuid) {
              cacheImplementer.set(cache_key, uuid);
              return uuid;
            });
        }
      })
      .then(function (response) {
        return Promise.resolve(responseHelper.successWithData({uuid: response}));
      })
      .catch(function (err) {
        logger.error(err);
        return responseHelper.error('ci_ut_4', 'Something went wrong');
      })
      ;
  },

  /**
   * Fetch Total Supply for this member company's Branded Token
   *
   * @return {promise<result>}
   *
   */
  getTotalSupply: function () {
    const oThis = this;
    const mcAddress = oThis._getMemberReserve();
    const btAddress = oThis._getBTAddress();

    const transactionObject = oThis.currContract.methods.totalSupply();
    const encodeABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);

    return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
      .then(function (decodedResponse) {
        return decodedResponse[0];
      })
      .then(function (totalSupply) {
        return responseHelper.successWithData({totalSupply: totalSupply});
      })
      .catch(function (err) {
        logger.error(err);
        return responseHelper.error('ci_ut_5', 'Something went wrong');
      })
      ;
  },

  /**
   * Fetch allowance for this member company
   *
   * @param {string} owner
   * @param {string} spender
   *
   * @return {promise<result>}
   *
   */
  //Note: Allowance is not cached, as the allowance allocation happens from outside.
  getAllowance: function (owner, spender) {
    const oThis = this
      , isOwnerValid = helper.isAddressValid(owner)
      , isSpenderValid = helper.isAddressValid(spender)
    ;

    if (!isOwnerValid || !isSpenderValid) {
      return new Promise(function (resolve, reject) {
        var invalidAddress;
        if (!isOwnerValid) {
          invalidAddress = owner;
        } else {
          invalidAddress = spender;
        }
        resolve(responseHelper.error('ci_ut_6', `Invalid blockchain address: ${invalidAddress}`));
      });
    }


    const mcAddress = oThis._getMemberReserve();
    const btAddress = oThis._getBTAddress();

    const transactionObject = oThis.currContract.methods.allowance(owner, spender);
    const encodeABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);

    return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
      .then(function (decodedResponse) {
        return decodedResponse[0];
      })
      .then(function (allowance) {
        return responseHelper.successWithData({allowance: allowance});
      })
      .catch(function (err) {
        logger.error(err);
        return responseHelper.error('ci_ut_6', 'Something went wrong');
      })
      ;

  },

  /**
   * Fetch Balance For a given address
   *
   * @param {string} owner - address for which balance is to be fetched
   *
   * @return {promise<result>}
   *
   */
  getBalanceOf: function (owner) {
    const oThis = this
      , isOwnerValid = helper.isAddressValid(owner)
    ;

    //Validation
    if (!isOwnerValid) {
      return new Promise(function (resolve, reject) {
        resolve(responseHelper.error('ci_ut_7', `Invalid blockchain address: ${owner}`));
      });
    }

    return oThis.getBalanceFromCache(owner)
      .then(function (cachedBalance) {
        if (cachedBalance.isSuccess() && cachedBalance.data.response != null) {
          logger.info("balance cache hit");
          return cachedBalance.data.response;
        } else {
          logger.info("balance cache miss");
          const mcAddress = oThis._getMemberReserve();
          const btAddress = oThis._getBTAddress();

          const transactionObject = oThis.currContract.methods.balanceOf(owner);
          const encodeABI = transactionObject.encodeABI();
          const transactionOutputs = helper.getTransactionOutputs(transactionObject);

          return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress}, transactionOutputs)
            .then(function (decodedResponse) {
              //Decode the response
              return decodedResponse[0];
            })
            .then(async function (balance) {

              //To-Do: Ensure cache is empty. 
              //Someone else might have already fetched it and may be performing operations.
              //Aquire lock ?

              var existingRecord = await oThis.getBalanceFromCache(owner);
              if (existingRecord.isSuccess() && cachedBalance.data.response != null) {
                //Ignore the balance we already have.
                return existingRecord.data.response;
              }

              //Cache it
              await oThis.setBalanceToCache(owner, new BigNumber(balance));
              return balance;
            })
            .catch(async function (reason) {
              //This code uses internal methods and MUST change.
              //It ensures that if value is returned if it is present in cache.
              var existingRecord = await oThis.getBalanceFromCache(owner);
              if (existingRecord.isSuccess() && cachedBalance.data.response != null) {
                //Ignore the exception, we already have balance in cache.
                return existingRecord.data.response;
              }

              //We can't help. throw again.
              throw reason;
            })
            ;
        }
      })
      .then(function (balance) {
        //Format the response
        return responseHelper.successWithData({balance: balance});
      })
      .catch(function (err) {
        //Format the error
        logger.error(err);
        return responseHelper.error('ci_ut_7', 'Something went wrong');
      })

      ;
  },

  /**
   * Transfer amount
   *
   * @param {string} sender - address of user who is sending amount
   * @param {string} recipient - address of user who is receiving amount
   * @param {BigNumber} amountInWei - amount which is being transferred
   * @param {string} tag - extra param which gets logged into this transaction
   *
   * @return {promise<result>}
   *
   */
  transfer: function (sender, recipient, amountInWei, tag) {
    const oThis = this;

    //Basic Validation
    //..Validate sender address
    if (!helper.isAddressValid(sender)) {
      return Promise.resolve(responseHelper.error('ci_ut_8.v.1', `Invalid blockchain address: ${sender}`));
    }

    //..Validate recipient address
    if (!helper.isAddressValid(recipient)) {
      //Invalid Recipient Address
      return Promise.resolve(responseHelper.error('ci_ut_8.v.2', `Invalid blockchain address: ${recipient}`));
    }

    //..Prepare amount for validation.
    var bigNumAmount = null;
    if (amountInWei instanceof BigNumber) {
      bigNumAmount = amountInWei;
    } else {
      //Try to conver amountInWei into BigNumber.
      var numAmount = Number(amountInWei);
      if (!isNaN(numAmount)) {
        bigNumAmount = new BigNumber(amountInWei);
      }
    }

    //..Validate Transfer Amount.
    if (!bigNumAmount || bigNumAmount.lessThan(0)) {
      return Promise.resolve(responseHelper.error('ci_ut_8.v.4', `Invalid tramsfer amount: ${amountInWei}`));
    }

    const senderBalancePromise = oThis.validateBalance(sender, bigNumAmount)
      , recipientBalancePromise = oThis.validateBalance(recipient, new BigNumber(0))
    ;

    //Fetch balances in parallel.
    return Promise.all([senderBalancePromise, recipientBalancePromise])
      .then(async function (responses) {

        const senderResponse = responses[0]
          , recipientResponse = responses[1]
        ;
        if (senderResponse.isFailure()) {
          //Insufficient Sender Balance or Failed to fetch balance.
          return senderResponse;
        }

        if (recipientResponse.isFailure()) {
          //Failed to fetch balance.
          return responseHelper.error('ci_ut_8.v.5', 'Failed to fetch balance of the recipient.');
        }

        // Generating uniq uuid for the transaction.
        const txUUID = uuid.v4();

        const transferParams = {
          transaction_hash: '',
          transactionUUID: txUUID,
          transactionType: 'transfer',
          sender: sender,
          recipient: recipient,
          amount: bigNumAmount,
          tag: tag
        };

        // initializing ther transaction logger object.
        const transactionLogger = new TransactionLogger(transferParams, oThis.memberObject.Symbol);

        //Update Cache and not waiting for promise resolution. Pessimistically reducing the balance.
        oThis._debitBalanceInCache(sender, bigNumAmount, transactionLogger);

        // creating the transaction object
        const transactionObject = oThis.currContract.methods.transfer(recipient, bigNumAmount.toString(10));

        const rollbackFn = function (response) {
          transactionLogger.logError('=====Transaction Failed. Rollback Transfer =====');
          transactionLogger.logStep('response:', response);
          transactionLogger.logStep('transferParams:', transferParams);
          transactionLogger.markFailed();

          // Credit back to sender, in case of rollback
          oThis._creditBalanceInCache(sender, bigNumAmount, transactionLogger);

          return Promise.resolve(response);
        };

        var fundStPrimeResponse = await oThis._fundSenderForTransferIfNeeded(
          transferParams,
          transactionObject,
          transactionLogger
        );

        if (fundStPrimeResponse.isFailure()) {
          transactionLogger.logWarning("BT :: transfer :: failed to fund sender");
          return rollbackFn(fundStPrimeResponse);
        }

        var transferTxHash = await oThis._initiateTransferInChain(
          transferParams,
          transactionObject,
          transactionLogger
        );

        // append transaction hash to the transfer params.
        transferParams['transaction_hash'] = transferTxHash;

        const addressToNameMap = {};
        addressToNameMap[oThis._getBTAddress().toLowerCase()] = contractName;

        // following returns a promise for which we don't have to wait so not writing await here.
        helper.getTxReceipt(web3RpcProvider, transferTxHash, addressToNameMap)
          .then(function (response) {
            if (response.isSuccess()) {
              transactionLogger.logWin('transfer get receipt successful');

              //Credit the amount to the recipient.
              oThis._creditBalanceInCache(recipient, bigNumAmount, transactionLogger);
              transactionLogger.logWin("Transfer successful");
              transactionLogger.markSuccess();
            } else {
              transactionLogger.logWarning('BT :: transfer :: transfer get receipt failed');
              return rollbackFn(initiateTransferInChainResponse);
            }
          });

        return responseHelper.successWithData(transferParams);
      });
  },

  /**
   * Fetches Member Company's Reserve Address
   *
   * @return {promise<result>}
   */
  getReserve: function () {
    const oThis = this;
    const mcAddress = oThis._getMemberReserve();
    return Promise.resolve(responseHelper.successWithData({reserve: mcAddress}));
  },

  /**
   * Process Minting
   *
   * @param {object} memberObject - confir of Member Company
   * @param {string} mintingIntentHash - minting intent hash
   *
   * @return {promise<result>}
   */
  processMinting: function (memberObject, mintingIntentHash) {

    const oThis = this;
    const encodeABI = oThis.currContract.methods.processMinting(mintingIntentHash).encodeABI();
    const mcAddress = memberObject.Reserve;
    const btAddress = memberObject.ERC20;

    return helper.send(web3RpcProvider, btAddress, encodeABI,
      {from: mcAddress, gasPrice: coreConstants.OST_UTILITY_GAS_PRICE})
      .catch(function (err) {
        //The catch should always be the last block in the chain.
        //When placed as the last block it acts as catch all.
        //Please move it after then. Catch bolck does not break the promise chain.
        logger.error(err);
        return Promise.resolve(responseHelper.error('ci_ut_2', 'Something went wrong'));
      })
      .then(function (response) {
        logger.info(response);
        return Promise.resolve(responseHelper.successWithData({}));
      });
  },

  /**
   * Mint
   *
   * @param {string} btAddress - contract address for BT
   * @param {string} uuid - member company's UUID
   * @param {string} minter - minter's address
   * @param {string} minterNonce - nonce of minter
   * @param {string} amountST - amount of ST which were staked
   * @param {string} amountUT -  amount of UT which is to be minted
   * @param {string} escrowUnlockHeight
   * @param {string} mintingIntentHash
   *
   * @return {promise<result>}
   */
  mint: function (btAddress, uuid, minter, minterNonce, amountST, amountUT, escrowUnlockHeight, mintingIntentHash) {

    const oThis = this;

    Assert.strictEqual(typeof uuid, 'string', `uuid must be of type 'string'`);
    Assert.strictEqual(typeof minter, 'string', `minter must be of type 'string'`);
    Assert.strictEqual(typeof mintingIntentHash, 'string', `mintingIntentHash must be of type 'string'`);
    Assert.ok(amountST > 0, "amountST should be greater than 0");
    Assert.ok(amountUT > 0, "amountUT should be greater than 0");

    const encodeABI = oThis.currContract.methods.mint(uuid, minter, minterNonce, amountST, amountUT,
      escrowUnlockHeight, mintingIntentHash).encodeABI();

    return web3RpcProvider.eth.personal.unlockAccount(registrarAddress, registrarKey)
      .then(function () {
        return helper.send(web3RpcProvider, btAddress, encodeABI,
          {from: REGISTRAR_ADDRESS, gasPrice: coreConstants.OST_UTILITY_GAS_PRICE}
        ).catch(function (err) {
          //The catch should always be the last block in the chain.
          //When placed as the last block it acts as catch all.
          //Please move it after then. Catch bolck does not break the promise chain.
          logger.error(err);
          return Promise.resolve(responseHelper.error('ci_ut_3', 'Something went wrong'));
        })
          .then(function (response) {
            logger.info(response);
            return Promise.resolve(responseHelper.successWithData({response: response}));
          })
      });
  },

  /**
   * Generate a New User Account
   *
   * @return {promise<result>}
   */
  newUserAccount: function () {
    //STUB METHOD.
    //Figure out various inputs required to generate passphrase.
    var input1 = ""
      , input2 = ""
      , input3 = ""
    ;
    const passphrase = helper.generateManagedKeyPassphrase(input1, input2, input3);
    return stPrime.newManagedAccount(passphrase);
  },

  /**
   * Get passphrase for a address
   *
   * @param {string} address
   *
   * @return {string}
   *
   */
  getUserPassphrase: function (address) {
    //STUB METHOD.
    //Figure out various inputs (based on address), required to generate passphrase.
    var input1 = ""
      , input2 = ""
      , input3 = ""
    ;

    return helper.generateManagedKeyPassphrase(input1, input2, input3);
  },

  /**
   * Get passphrase for a member company address
   *
   * @param {string} address
   *
   * @return {string}
   */
  getPassphrase: function (address) {
    const oThis = this;
    const mcAddress = oThis._getMemberReserve();

    address = String(address);
    if (address.toLowerCase() === mcAddress.toLowerCase()) {
      return stPrime.getMemberPassphrase(address);
    } else {
      return oThis.getUserPassphrase(address);
    }
  },

  /**
   * Calls Claim method
   *
   * @param {string} senderAddress - address of sender
   * @param {string} senderPassphrase - passphrase of sender
   * @param {string} beneficiaryAddress - address to which balance would be credited
   *
   * @return {promise<result>}
   */
  claim: async function (senderAddress, senderPassphrase, beneficiaryAddress) {

    const oThis = this;
    const encodedABI = oThis.currContract.methods.claim(beneficiaryAddress).encodeABI();

    const transactionReceiptResult = await helper.safeSendFromAddr(
      web3RpcProvider,
      oThis._getBTAddress(),
      encodedABI,
      senderAddress,
      senderPassphrase,
      {gasPrice: coreConstants.OST_UTILITY_GAS_PRICE}
    );

    // Returns amount that is claimed.
    return Promise.resolve(transactionReceiptResult);

  },

  /**
   * Method by which we can find how much of autorized value by ownerAddress is unspent by spenderAddress
   *
   * @param {string} ownerAddress - address which authorized spenderAddress to spend value
   * @param {string} spenderAddress - address which was authorized to spend value
   *
   * @return {promise<result>}
   *
   */
  allowance: function (ownerAddress, spenderAddress) {
    const oThis = this;
    const encodedABI = oThis.currContract.methods.allowance(ownerAddress, spenderAddress).encodeABI();

    return helper.call(
      web3RpcProvider,
      oThis._getBTAddress(),
      encodedABI,
      {},
      ['uint256']
    )
      .then(function (response) {
        return Promise.resolve(responseHelper.successWithData({remaining: response[0]}));
      });
  },

  /**
   * Method by which ownerAddress authorizes spenderAddress to spend value on their behalf.
   *
   * @param {string} ownerAddress - address which authorizes spenderAddress to spend value
   * @param {string} ownerPassphrase - passphrase of ownerAddress
   * @param {string} spenderAddress - address which is authorized to spend value
   * @param {number} value - value
   * @param {boolean} inAsync - true of one wants only the transaction hash and not wait till the mining
   *
   * @return {promise<result>}
   *
   */
  approve: async function (ownerAddress, ownerPassphrase, spenderAddress, value, inAsync) {

    const oThis = this;
    const encodedABI = oThis.currContract.methods.approve(spenderAddress, value).encodeABI();

    if (inAsync) {
      return helper.sendTxAsyncFromAddr(
        web3RpcProvider,
        oThis._getBTAddress(),
        encodedABI,
        ownerAddress,
        ownerPassphrase,
        {gasPrice: coreConstants.OST_UTILITY_GAS_PRICE}
      );
    } else {
      const transactionReceipt = await helper.safeSendFromAddr(
        web3RpcProvider,
        oThis._getBTAddress(),
        encodedABI,
        ownerAddress,
        ownerPassphrase,
        {gasPrice: coreConstants.OST_UTILITY_GAS_PRICE}
      );

      return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
    }
  },

  /**
   * Get balance from cache
   *
   * @param {string} owner - address of user whose balance is to be found
   *
   * @return {promise<result>}
   *
   */
  getBalanceFromCache: function (owner) {
    const oThis = this
      , cache_key = cacheKeys.btBalance(chainId, oThis._getBTAddress(), owner);

    return cacheImplementer.get(cache_key)
  },

  /**
   * Set balance to cache
   *
   * @param {string} owner - address of user whose balance is to be set
   * @param {BigNumber} balance - balance of the user
   *
   * @return {promise<result>}
   *
   */
  setBalanceToCache: function (owner, balance) {
    const oThis = this
      , cache_key = cacheKeys.btBalance(chainId, oThis._getBTAddress(), owner);

    return cacheImplementer.set(cache_key, balance.toString(10))
  },

  /**
   * @ignore
   */
  _getMemberReserve: function () {
    // Internal Method. Returns Reserve Address mentioned in config.
    return this.memberObject.Reserve;
  },

  /**
   * @ignore
   */
  _getBTAddress: function () {
    // Internal Method. Returns ERC20 Address mentioned in config.
    return this.memberObject.ERC20;
  },

  /**
   * @ignore
   */
  _getBTSymbol: function () {
    // Internal Method. Returns ERC20 Address mentioned in config.
    return this.memberObject.Symbol;
  },

  /**
   * @ignore
   */
  _getCacheKeyForProperty: function (propName) {
    // Internal Method. Returns key name to be used for caching properties of ERC20 contract like
    // * name, symbol, decimals, reserve etc.
    return this._getBTSymbol() + "_prop_" + propName;
  },

  /**
   * @ignore
   */
  _getCacheKeyForBalance: function (address) {
    // Internal Method. Returns key name to be used for caching balance of an address
    return this._getBTSymbol() + "_balance_" + address.toLowerCase();
  },

  /**
   * @ignore
   */
  _unlockUserAddress: function (userAddress) {
    // Internal Method. Unlocks User-Address
    const oThis = this;
    return web3RpcProvider.eth.personal.unlockAccount(userAddress, oThis.getUserPassphrase());
  },

  /**
   * @ignore
   */
  _creditBalanceInCache: function (owner, bigAmount, transactionLogger) {

    // Internal Method. Credits Balance in Owner's Cache

    const oThis = this;

    transactionLogger.logStep("_creditBalanceInCache called for :: " + owner + " :: bigAmount" + bigAmount.toString(10));

    return oThis.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {
          var balance = response.data.balance;
          var bigBalance = new BigNumber(balance);
          bigBalance = bigBalance.plus(bigAmount);

          transactionLogger.logInfo("_creditBalanceInCache :: balance :: " + balance);

          return oThis.setBalanceToCache(owner, bigBalance)
            .then(function (setResponse) {
              if (setResponse.isSuccess() && setResponse.data.response != null) {
                transactionLogger.logWin("_creditBalanceInCache :: cache set :: ");
                return responseHelper.successWithData({});
              }
              transactionLogger.logError("_creditBalanceInCache :: cache could not be set");
              return responseHelper.error('ci_ut_9', 'Something went wrong')
            });
        }
        return response;
      });
  },

  /**
   * @ignore
   */
  _debitBalanceInCache: function (owner, bigAmount, transactionLogger) {

    const oThis = this;

    transactionLogger.logStep("_debitBalanceInCache called for :: " + owner + " :: bigAmount :: " + bigAmount.toString(10));

    return oThis.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {

          var balance = response.data.balance
            , bigBalance = new BigNumber(balance);

          bigBalance = bigBalance.minus(bigAmount);

          transactionLogger.logInfo("_debitBalanceInCache :: balance :: " + balance);

          return oThis.setBalanceToCache(owner, bigBalance)
            .then(function (setResponse) {
              if (setResponse.isSuccess() && setResponse.data.response != null) {
                transactionLogger.logWin("_debitBalanceInCache :: cache set :: ");
                return responseHelper.successWithData({});
              }
              transactionLogger.logError("_debitBalanceInCache :: cache could not be set");
              return responseHelper.error('ci_ut_10', 'Something went wrong')
            });
        }
        return response;
      });
  },

  /**
   * @ignore
   */
  _fundSenderForTransferIfNeeded: async function (transferParams, transactionObject, transactionLogger) {

    // Internal Method. Funds Transaction's Sender if it doesn't have GAS to execute transaction

    transactionLogger.logStep("_fundSenderForTransferIfNeeded initiated");

    const oThis = this
      , reserve = oThis._getMemberReserve()
      , senderAddr = transferParams.sender
    ;

    var estimatedGas = await transactionObject.estimateGas({
      from: senderAddr
    });

    //TODO: Geth version < 1.7.1 issues with gas estimation. https://github.com/aragon/aragon-core/issues/141
    if (estimatedGas < 80000) {
      estimatedGas = 80000;
    }

    estimatedGas = new BigNumber(estimatedGas);
    transactionLogger.logStep("_fundSenderForTransferIfNeeded : estimatedGas = " + estimatedGas.toString(10));

    const senderBalanceResponse = await stPrime.getBalanceOf(senderAddr);
    if (!senderBalanceResponse.isSuccess()) {
      transactionLogger.logError("_fundSenderForTransferIfNeeded: Failed to validate STPrime balance of sender");
      return Promise.resolve(senderBalanceResponse);
    }

    const senderBalance = new BigNumber(senderBalanceResponse.data.balance);
    var gasPrice = new BigNumber(UTILITY_GAS_PRICE);
    var estimatedCost = estimatedGas.mul(gasPrice);
    logger.info("_fundSenderForTransferIfNeeded :: estimatedGas", estimatedGas.toString(10));
    logger.info("_fundSenderForTransferIfNeeded :: gasPrice", gasPrice.toString(10));
    logger.info("_fundSenderForTransferIfNeeded :: estimatedCost", estimatedCost.toString(10));
    logger.info("_fundSenderForTransferIfNeeded :: senderBalance", senderBalance.toString(10));

    transferParams.estimatedGas = estimatedGas.toString(10);
    transferParams.estimatedCost = estimatedCost.toString(10);

    if (estimatedCost.lessThan(senderBalance)) {
      transactionLogger.logStep("_fundSenderForTransferIfNeeded: Sender already has sufficient STPrime");
      return Promise.resolve(
        responseHelper.successWithData({
          transferParams: transferParams,
          estimatedGas: estimatedGas.toString(10),
          estimatedCost: estimatedCost.toString(10)
        }))
        ;
    }

    if (reserve.toLowerCase() === senderAddr.toLowerCase()) {
      transactionLogger.logError("_fundSenderForTransferIfNeeded : Member company does not have sufficient STPrime to perform transfer");
      return Promise.resolve(responseHelper.error('ci_ut_10', 'Insufficient gas to perform transfer'));
    }

    const stPrimeToTransfer = estimatedCost.times(stPrimeTransferFactor);

    return stPrime.transfer(reserve, senderAddr, stPrimeToTransfer, "Funding member for BT transfer")
      .then(function (response) {
        if (!response.isSuccess()) {
          transactionLogger.logError("_fundSenderForTransferIfNeeded : Failed to fund sender with ST prime.");
          return response;
        }

        return responseHelper.successWithData({
          transferParams: transferParams,
          estimatedGas: estimatedGas.toString(10),
          estimatedCost: estimatedCost.toString(10)
        });

      });
  },

  /**
   * @ignore
   */
  _initiateTransferInChain: function (transferParams, transactionObject, transactionLogger) {
    const oThis = this;

    const toAddress = transferParams.recipient
      , senderAddr = transferParams.sender
      , value = transferParams.amount.toString(10)
      , senderPassphrase = oThis.getPassphrase(senderAddr)
    ;

    const btAddress = oThis._getBTAddress();
    const encodeABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);

    return helper.call(web3RpcProvider, btAddress, encodeABI, {from: senderAddr}, transactionOutputs)
      .then(function () {
        transactionLogger.logStep("UtilityToken._initiateTransferInChain CALL Successful");
        return helper.sendTxAsyncFromAddr(
          web3RpcProvider,
          btAddress,
          encodeABI,
          senderAddr,
          senderPassphrase,
          {
            from: senderAddr,
            gasPrice: coreConstants.OST_UTILITY_GAS_PRICE,
            gas: transferParams.estimatedGas
          }
        ).catch(function (reason) {
          transactionLogger.logError("UtilityToken._initiateTransferInChain SEND Failed!");
          transactionLogger.logError("reason", reason);
          return responseHelper.error('ci_ut_10', 'Transaction Failed');
        });
      });
  },

  /**
   * @ignore
   */
  _processInitiateTransferInChainResponse: function (iTResponse) {
    return iTResponse.then(function (response) {
      return oThis.processSafeSendResponse(response, transferParams, transactionLogger);
    })
  },

  /**
   * @ignore
   */
  processSafeSendResponse: function (response, transferParams, transactionLogger) {
    const oThis = this;

    transactionLogger.logInfo("UtilityToken._initiateTransferInChain :: safeSendFromAddr response received.");
    transactionLogger.logInfo(JSON.stringify(response.data));
    if (!response.isSuccess()) {
      transactionLogger.logError("UtilityToken._initiateTransferInChain :: failed to receive transactionReceipt");
      return responseHelper.error('ci_ut_10', 'Transaction Failed');
    }


    const txReceipt = response.data.rawTransactionReceipt;
    const formattedTxReceipt = response.data.formattedTransactionReceipt;

    if (!oThis.isTransferReceiptValid(formattedTxReceipt, transferParams, transactionLogger)) {
      transactionLogger.logError("processSafeSendResponse :: TxReceipt is not valid.");
      return responseHelper.error('ci_ut_11', 'Transaction Failed');
    }

    transactionLogger.logWin("UtilityToken._initiateTransferInChain SEND Successful");

    return responseHelper.successWithData({
      txReceipt: txReceipt,
      formattedReceipt: formattedTxReceipt,
      transactionHash: txReceipt.transactionHash,
      transferParams: transferParams
    });
  },

  /**
   * @ignore
   */
  isTransferReceiptValid: function (formattedTxReceipt, transferParams, transactionLogger) {
    const oThis = this;

    const expectedEventName = ("Transfer").toLowerCase();

    if (!formattedTxReceipt.eventsData || !formattedTxReceipt.eventsData.length) {
      return false;
    }

    const transferEvent = formattedTxReceipt.eventsData.find(function (data) {
      if (data.name) {
        const thisEventName = String(data.name).toLowerCase();
        if (thisEventName === expectedEventName) {
          transactionLogger.logWin('isTransferReceiptValid :: found ' + thisEventName, data);
          return data;
        }
      }
      return false;
    });
    return transferEvent ? true : false;
  },

  /**
   * @ignore
   */
  validateBalance: function (owner, bigMinAmount) {
    const oThis = this;

    return oThis.getBalanceOf(owner)
      .then(function (response) {
        if (!response) {
          //Unexpected Error. Please debug getBalanceOf.
          return responseHelper.error('ci_ut_9.u.1', 'Something went wrong');
        } else if (!response.success) {
          //An error occoured while fetching balance.
          return response;
        } else if (!response.data) {
          //Unexpected Error. Please debug getBalanceOf.
          return responseHelper.error('ci_ut_9.u.2', 'Something went wrong');
        }

        var balance = response.data.balance;
        if (typeof balance === "undefined" || isNaN(Number(balance))) {
          //Unexpected Error. Please debug getBalanceOf.
          return responseHelper.error('ci_ut_9.u.3', 'Something went wrong');
        }

        var bigNumBalance = new BigNumber(balance);
        if (bigNumBalance.lessThan(bigMinAmount)) {
          //Insufficient funds.
          return responseHelper.error('ci_ut_9.v.1', 'Insufficient Funds');
        }

        return responseHelper.successWithData({
          "balance": balance
          , "bigNumBalance": bigNumBalance
        });
      })
      ;
  },

};

module.exports = BrandedTokenContractInteractKlass;