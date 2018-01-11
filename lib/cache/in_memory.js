'use strict';

/**
 * Implementation of the caching layer using in-process memory.
 * <b>NOTE: This should only be used for dev env having only one worker process,
 * otherwise this will result in inconsistent cache.</b><br><br>
 *
 * {@link module:lib/cache/implementer} acts as a wrapper for this module.
 *
 * @module lib/cache/in_memory
 */

const inMemoryCache = function () {
    this._records = Object.create( null );
};

inMemoryCache.prototype = {
  _records: null,

  /**
   * Get the value for the given key.
   * @param {string} key The key
   * @return {Promise<mixed>} A promise to return value of the key.
   */
  get: function (key) {
    const oThis = this;
    return new Promise(function (onResolve, onReject) {
      var record = oThis._getRecord(key);
      const val  = record ? record.getValue() : null;
      onResolve(val);
    })
  },

  /**
   * Stores a new value
   * @param {string} key The key
   * @param {mixed} val JSON/number/string that you want to store.
   * @param {number} lifetime how long the data needs to be stored measured in seconds
   * @return {Promise<boolean>} A promise to set the key.  On resolve, the boolean flag indicates if cache was set successfully or not.
   */
  set: function (key, value) {
    const oThis = this;
    return new Promise(function (onResolve, onReject) {
      var record = oThis._getRecord(key);
      if(record){
        record.setValue(value);
      } else {
        record = new Record(value, FarFutureLifeTime);
      }
      oThis._records[key] = record;
      onResolve(true);
    })
  },

  /**
   * Delete the value for the given key.
   * @param {string} key The key
   * @return {Promise<boolean>} A promise to delete the key.  On resolve, the boolean flag indicates if cache was deleted successfully or not.
   */
  del: function (key) {
    const oThis = this;
    return new Promise(function (onResolve, onReject) {
      var record = oThis._getRecord(key);
      if(record){
        delete oThis._records[ key ];
      }
      onResolve(true);
    })
  },

  /**
   * Get the values for the given keys.
   * @param {Array} keys, Array of keys
   * @return {Promise<mixed>} A promise to return value of the keys.
   */
  multiGet: function (keys) {
    const oThis = this;
    return new Promise(function (onResolve, onReject) {
      var retVal = {};
      if(Array.isArray(keys)){
        for(var i=0;i<keys.length;i++){
          var key = keys[i];
          var record = oThis._getRecord(key);
          var val = record ? record.getValue() : null;
          retVal[key] = val;
        }
        onResolve(retVal);
      } else {
        onReject("Invalid parameter, requires Array");
      }
    })
  },

  /**
   * Increment the non-numeric value for the given key.
   * @param {string} key The key
   * @param {number} val number that you want to increment with.
   * @return {Promise<boolean>} A promise to increment the non-numeric value.  On resolve, the boolean flag indicates if value was incremented successfully or not.
   */
  increment: function (key, value) {
    const oThis = this;
    return new Promise(function (onResolve, onReject) {
      var record = oThis._getRecord(key);
      if(record){
        var originalValue = record.getValue();
        if(isNaN(originalValue)){
          onReject('cannot increment or decrement non-numeric value');
        } else {
          originalValue += value;
          record.setValue(originalValue);
          onResolve(true);
        }
      }
      onReject('Record not found');
    })
  },

  /**
   * Decrement the non-numeric value for the given key.
   * @param {string} key The key
   * @param {Number} val number that you want to decrement with.
   * @return {Promise<boolean>} A promise to decrement the non-numeric value.  On resolve, the boolean flag indicates if value was decremented successfully or not.
   */
  decrement: function (key, value) {
    return this.increment(key, value*-1);
  },

  /**
   * Find out the record and set its new expiry time.
   * @param {string} key The key
   * @param {Integer} lifetime number that you want to set as expiry
   * @return {Promise<boolean>} A promise to update the expiry of record.  On resolve, the boolean flag indicates if record was updated successfully or not.
   */
  touch: function (key, lifetime) {
    const oThis = this;
    return new Promise(function (onResolve, onReject) {
      var record = oThis._getRecord(key);
      if(record){
          record.setExpires(lifetime);
          onResolve(true);
      }
      onReject('Record not found');
    })
  },

  /**
   * Internal Method. Get record Object for key
   * @param {string} key The key
   */
  _getRecord: function ( key ) {
    var record = null;
    if ( key in this._records ) {
      record = this._records[ key ];
      if ( record.hasExpired() ) {
        delete this._records[ key ];
        record = null;
      }
    }
    return record;
  }
};

module.exports = new inMemoryCache();

const FarFutureLifeTime = Date.now() + (1000 * 60 * 60 * 24 * 365 * 20);
function Record( value, lifetimeInSec ) {
  this.setValue( value );
  lifetimeInSec && this.setExpires( lifetimeInSec );
}
Record.prototype = {
  constructor: Record

  /**
   * @property val Value of record. Defaults to null.
   */
  ,val: null

  /**
   * @property expires Expiry timestamp of record. Defaults to FarFutureLifeTime (20 years from server start time).
   */
  ,expires: Date.now() + FarFutureLifeTime


  /**
   * Sets the expiry timestamp of the record.
   * @param {number} lifetimeInSec life-time is seconds after which record is considered expired.
   */
  ,setExpires: function ( lifetimeInSec ) {
    lifetimeInSec = Number ( lifetimeInSec );
    if ( isNaN( lifetimeInSec ) ) {
        lifetimeInSec = 0;
    }

    var lifetime = lifetimeInSec * 1000;
    if ( lifetime <= 0 ) {
        this.expires = FarFutureLifeTime;
    } else {
        this.expires = Date.now() + lifetime;
    }
  }

  /**
   * @return {boolean} returns true if the current time is greater than expiry timestamp.
   */

  ,hasExpired: function () {
    return ( this.expires - Date.now() ) < 0;
  }

  /**
   * @return {mixed} returns the value set of the record.
   */

  ,getValue: function () {
    return this.val;
  }

  /**
   * Sets the value of the record.
   * @parma {mixed} Value to set.
   */
  ,setValue: function ( val ) {
    this.val = val;
  }

  /**
   * Returns the serialized value of record.
   * If value is Object, serialized object is returned.
   * @return {string} serialized value
   */
  ,toString: function () {
    if ( this.val instanceof Object ) {
        return JSON.stringify( this.val )
    }
    return String( this.val );
  }
};