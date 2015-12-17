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

		
		show: function(message) {

			this._onMessageShow();
			if (message)
				this.message = message;
			
			this._isShown = true;
			return this;
		},

		
		hide: function() {			
			this._isShown = false;
			return this;
		},

		
		isShown: function() {
			return this._isShown;
		},

		
		isCritical: function() {
			return this._isCritical;
		},

		
		critical: function(isCritical) {
			this._isCritical = isCritical;
			return this;
		},

		
		getMessage: function() {
			return this.message;
		},
		
		_onMessageShow :  function(){
			var self =  this;
			 $timeout(function() {
			 	self.hide();
   			 }, 3000);
		}
	});

	return Error;

		
}]);