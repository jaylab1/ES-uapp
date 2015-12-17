'use strict'

controllers.factory('Validator', [
    'Error', 'Util',
    function(Error, Util) {

        var Validator = augment.defclass({

            constructor: function() {
                this._error = new Error();
                this._blockMessage = '';
                this._isPassed = true;
            },

            
            _validate: function(isValid, errorMessage, inputId) {
                inputId = !inputId ? null : inputId;

                var isValidFlag = false;

                if (isValid())
                    isValidFlag = true;
                this._isPassed = this._isPassed && !isValidFlag;

                if (errorMessage != null && isValidFlag) {
                    this._error.show(errorMessage);
                    this._blockMessage = this._blockMessage.length === 0 ? errorMessage : this._blockMessage + ' and ' + errorMessage;
                }

                if (inputId !== null) {
                	var inputElem = angular.element(document.getElementById(inputId));
                    if (isValidFlag) {
                        inputElem.addClass('input-error');
                    } else {
                    	inputElem.removeClass('input-error');
                    }

                }


                return isValidFlag;
            },

            
            isEmpty: function(value, errorMessage, inputId) {
                return this._validate(function() {
                    return !value || value.length == 0;
                }, errorMessage, inputId);
            },

            
            isNull: function(value, errorMessage, inputId) {
                return this._validate(function() {
                    return value == null;
                }, errorMessage, inputId);
            },

            
            isNotEmail: function(value, errorMessage, inputId) {
                return this._validate(function() {
                    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    return !re.test(value);
                }, errorMessage, inputId);
            },

            
            isNotNumber: function(value, errorMessage, inputId) {
                return this._validate(function() {
                    return !value || isNaN(value);
                }, errorMessage, inputId);
            },

            
            isIn: function(values, isMatched, errorMessage, inputId) {
                return this._validate(function() {
                    return Util.Find(values, isMatched) != null;
                }, errorMessage, inputId);
            },

            
            getError: function() {
                return this._error;
            },

            
            getErrorBlock: function() {
            	var error = new Error();
            	console.log(this._blockMessage);
                error.show(this._blockMessage);
                return error;
            },

            isPassed: function () {
            	return this._isPassed;
            }
        });

        return Validator;


    }
]);