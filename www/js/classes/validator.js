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

            /**
             * check if value is empty or not
             * @param {Callback} isValid check if condition is true or not
             * @param  {String}  [errorMessage] error message to display
             * @param {String} [inputId] whether to say true is erorr or false
             * @return {Error}   error object
             */
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

            /**
             * check if value is empty or not
             * @param  {String}  value to check
             * @param  {String}  [errorMessage] error message to display
             * @param {String} [inputId] whether to say true is erorr or false
             * @return {Error}   error object
             */
            isEmpty: function(value, errorMessage, inputId) {
                return this._validate(function() {
                    return !value || value.length == 0;
                }, errorMessage, inputId);
            },

            /**
             * check if value is null or not
             * @param  {String}  value to check
             * @param  {errorMessage}  [errorMessage] error message to display
             * @param {String} [inputId] whether to say true is erorr or false
             * @return {Error}   error object
             */
            isNull: function(value, errorMessage, inputId) {
                return this._validate(function() {
                    return value == null;
                }, errorMessage, inputId);
            },

            /**
             * check if value is not email
             * @param  {String}  value to check
             * @param  {String}  [errorMessage] error message to display
             * @param {String} [inputId] whether to say true is erorr or false
             * @return {Error}   error object
             */
            isNotEmail: function(value, errorMessage, inputId) {
                return this._validate(function() {
                    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    return !re.test(value);
                }, errorMessage, inputId);
            },

            /**
             * check if value is not a number
             * @param  {String}  value to check
             * @param  {String}  [errorMessage] error message to display
             * @param {String} [inputId] whether to say true is erorr or false
             * @return {Error}   error object
             */
            isNotNumber: function(value, errorMessage, inputId) {
                return this._validate(function() {
                    return !value || isNaN(value);
                }, errorMessage, inputId);
            },

            /**
             * check if value is in some values or not
             * @param  {Array}  values to search in
             * @param  {function} isMatched to search with
             * @param  {string}  errorMessage
             * @param  {String} inputId  the id of input element
             * @return {String} is in or not
             */
            isIn: function(values, isMatched, errorMessage, inputId) {
                return this._validate(function() {
                    return Util.Find(values, isMatched) != null;
                }, errorMessage, inputId);
            },

            /**
             * Get Error
             * @return {Error} error object
             */
            getError: function() {
                return this._error;
            },

            /**
             * Get Block Error
             * @return {Error} error object
             */
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