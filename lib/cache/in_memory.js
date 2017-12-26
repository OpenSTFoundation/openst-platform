'use strict';

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

  del: function (key) {
  },

  multiGet: function (keys) {

  },

  increment: function (key, value, expires_in, initial) {

  },

  decrement: function (key, value, expires_in, initial) {

  },

  touch: function (key, lifetime) {

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