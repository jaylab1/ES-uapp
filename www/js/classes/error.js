'use strict'

controllers.factory('Error', ['$timeout', function($timeout) {

	var Error = augment.defclass({

		constructor: function (message, isShown, isCritical) {
			this.message = message ? message : null;
			this._isShown = isShown || false;
			this._isCritical = isCritical || false;

			if (this._isShown)
				this._onMessageShow();
		},

		/**
		 * Show an Error message
		 * @param  {String} message to show
		 */
		show: function(message) {

			this._onMessageShow();
			if (message)
				this.message = message;
			
			this._isShown = true;
			return this;
		},

		/**
		 * Hide Error
		 */
		hide: function() {			
			this._isShown = false;
			return this;
		},

		/**
		 * is error shown
		 * @return {Boolean} error is shown or not
		 */
		isShown: function() {
			return this._isShown;
		},

		/**
		 * is error critical
		 * @return {Boolean} error is critical or not
		 */
		isCritical: function() {
			return this._isCritical;
		},

		/**
		 * is error critical
		 * @param {Boolean} error is critical or not
		 */
		critical: function(isCritical) {
			this._isCritical = isCritical;
			return this;
		},

		/**
		 * Get Message
		 * @return {String} error message to show
		 */
		getMessage: function() {
			return this.message;
		},
		/**
		 * _onMessageShow
		 * @return {[type]}  delete the error message after time
		 */
		_onMessageShow :  function(){
			var self =  this;
			 $timeout(function() {
			 	self.hide();
   			 }, 3000);
		}
	});

	return Error;

		
}]);