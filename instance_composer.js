"use strict";

const InstanceComposer = function ( configStrategy ) {
  this.configStrategy = configStrategy || {};
  this.instanceMap = {};
  this.shadowedClassMap = {};
};





//Some static properties & methods.
const composerMap = {};
const instanceComposerMethodName = "ic";
const shadowMap = {};

InstanceComposer.register = function ( ClassConstructor, getterMethodName, mustRetainInstance, constructorParamsBuilderFunction ) {  
  if ( composerMap.hasOwnProperty( getterMethodName ) || shadowMap.hasOwnProperty( getterMethodName ) ) {
    console.trace("Duplicate register Getter Method name", getterMethodName);
    throw `Duplicate register Getter Method Name ${getterMethodName}`;
  }


  if ( typeof constructorParamsBuilderFunction === "function" ) {
    //TBD: We need a shadow derived class here.
    //ClassConstructor = DerivedClassConstructor
  }

  composerMap[ getterMethodName ] = ClassConstructor;
  InstanceComposer.prototype[ getterMethodName ] = function () {
    const oThis = this; //this refers to instance of InstanceComposer.
    let _instance;
    if ( mustRetainInstance ) {
      _instance = oThis.instanceMap[ getterMethodName ];
      if ( !_instance ) {
        _instance = new ClassConstructor( oThis.configStrategy, oThis );
        oThis.instanceMap[ getterMethodName ] = _instance;
      }
      _instance[ instanceComposerMethodName ] = function () {
        return oThis
      };
    } else {
      _instance = new ClassConstructor( oThis.configStrategy, oThis );
      _instance[ instanceComposerMethodName ] = function () {
        return oThis
      };
    }
    
    return _instance;
  };
};

InstanceComposer.registerShadowableClass = function ( ClassConstructor, classGetterName ) {
  if ( composerMap.hasOwnProperty( classGetterName ) || shadowMap.hasOwnProperty( classGetterName ) ) {
    console.trace("Duplicate registerShadowableClass Getter Method name", classGetterName);
    throw `Duplicate registerShadowableClass Getter Method Name. ${classGetterName}`;
  }

  shadowMap[ classGetterName ] = ClassConstructor;
  InstanceComposer.prototype[ classGetterName ] = function () {
    const oThis = this; //this refers to instance of InstanceComposer.
    let _shadowedClass;
    _shadowedClass = oThis.shadowedClassMap[ classGetterName ];
    if ( !_shadowedClass ) {
      oThis.shadowedClassMap[ classGetterName ] = _shadowedClass = oThis.createShadowClass( ClassConstructor );
    }
    return _shadowedClass;
  }

};

InstanceComposer.prototype = {
  configStrategy: null
  , instanceMap: null
  , shadowedClassMap: null
  , createShadowClass : function ( ClassConstructor ) {
    const oThis = this;//this refers to instance of InstanceComposer.

    const basePrototype = ClassConstructor.prototype || {};
    const derivedPrototype = Object.create( basePrototype );

    derivedPrototype[ instanceComposerMethodName ] = function () {
      return oThis;
    };

    const DerivedClass = function () {
      ClassConstructor.apply( this, arguments );
    }
    DerivedClass.prototype = derivedPrototype;
    return DerivedClass;
  }
};




module.exports = InstanceComposer;