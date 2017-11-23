'use strict';
/*
 * *
 * * Author: Rachin Kapoor
 * * Date: 12/10/2017
 * * Reviewed by:
 * * 
 */




function Cache() {
  this._records = Object.create( null );
}

Cache.prototype = {
  constructor: Cache
  /**
   *  Class Refrence. You can use this to create a new instance of Cache.
   *  You can use this to create a new instance of cache. E.g. new cache.Cache()
   */
  ,Cache: Cache
  ,_records: null

  /**
   * Stores a new value
   * @param {string} key The key
   * @param {mixed} val JSON/number/string that you want to store.
   * @param {number} lifetime how long the data needs to be stored measured in seconds
   * @return {Promise<boolean>} A promise to set the key.  On resolve, the boolean flag indicates if cache was set successfully or not.
   */
  ,set: function (key, val, lifetime) {
    var oThis = this;
    return new Promise((resolve, reject) => {
      const record = oThis._getRecord( key ) || oThis._newRecord( key );
      record.setValue( val );
      record.setExpires( lifetime );
      resolve( true );
    });
  }


  /**
   * Get the value for the given key.
   * @param {string} key The key
   * @return {Promise<mixed>} A promise to return value of the key.
   */
  ,get: function (key) {
    var oThis = this;
    return new Promise((resolve, reject) => {
      const record = oThis._getRecord( key );
      const val  = record ? record.getValue() : null;
      resolve( val );
    });
  }

  /**
   * Remove the key from cache.
   * @param {string} key The key.
   * @return {Promise<boolean>} A promise to delete. On resolve, the boolean flag indicates if key was valid before deleting.
   */
  ,del: function ( key ) {
    var oThis = this;
    return new Promise((resolve, reject) => {
      const record = oThis._getRecord( key );
      if ( record ) {
        record.setExpires( Date.now() - 1000 );
        delete oThis._records[ key ];
        resolve( true );
      } else {
        resolve( false );
      }
    });
  }

  /**
   * Touches the given key.
   * @param {string} key The key
   * @param {number} lifetime After how long should the key expire measured in seconds.
   * @return {Promise} A promise to touch
   */
  ,touch: function (key, lifetime) {
    var oThis = this;
    return new Promise((resolve, reject) => {
      const record = oThis._getRecord( key ) || oThis._newRecord( key );
      record.setExpires( lifetime );
      resolve();
    });
  }

  /**
   * Internal Method. Get record Object for key
   * @param {string} key The key
   */
  ,_getRecord: function ( key ) {
    var record = null;
    var oThis = this;
    if ( key in oThis._records ) { 
      record = oThis._records[ key ];
      if ( record.hasExpired() ) {
        delete oThis._records[ key ];
        record = null;
      }
    }
    return record;
  }
  /**
   * Internal Method. Create a record Object for key
   * @param {string} key The key
   */
  ,_newRecord: function ( key ) {
    const oThis = this;
    const record = new Record();
    oThis._records[ key ] = record;
    return oThis._records[ key ];
  }
}

const cache = module.exports = new Cache();


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



