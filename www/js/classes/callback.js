'use strict'

controllers.factory('Callback', [
	'$interval',
    function($interval) {

        var Callback = augment.defclass({

            constructor: function(method, maxCalls) {
                this._method = method || null;
                this._maxCalls = maxCalls || Callback.Calls.MAX;
                this._callsCounter = 0;
            },

            /**
             * fire callback
             * @param {mixed} param1 to pass
             * @param {mixed} param2 to pass
             * @param {mixed} param3 to pass
             */
            fire: function(param1, param2, param3, param4, param5) {
                if (this._method && this.isCallable()) {
                    Callback.Fire(this._method, param1, param2, param3, param4, param5);
                    this._callsCounter++;
                }
                return this;

            },



            /**
             * is callback fired at least once or not
             * @return {Boolean} if its fired or not
             */
            isFired: function() {
                return this._callsCounter > 0;
            },

            waitFiredOnce: function() {
                while (!this.isFired());
            },

            /**
             * check if callback can be called or not
             * @return {Boolean} flag states that this method is callable or not
             */
            isCallable: function() {
                if (this._maxCalls == Callback.Calls.MAX)
                    return true;

                return this._callsCounter < this._maxCalls;
            },

            /**
             * Set extra params
             * @param {mixed} params
             */
            setExtras: function(extras) {
                this._extras = extras;
                return this;
            },

            /**
             * Get extra params
             * @return {mixed} extra params
             */
            getExtras: function() {
                return this._extras;
            }
        });

        /**
         * Fire a method
         * @param {function} method to call
         * @param {mixed} param1 to pass
         * @param {mixed} param2 to pass
         * @param {mixed} param3 to pass
         */
        Callback.Fire = function(method, param1, param2, param3, param4, param5) {

            if (method != null) {
                if (param1 != null && param2 != null && param3 != null && param4 != null && param5 != null)
                    method(param1, param2, param3, param4, param5);
                else if (param1 != null && param2 != null && param3 != null && param4 != null)
                    method(param1, param2, param3, param4);
                else if (param1 != null && param2 != null && param3 != null)
                    method(param1, param2, param3);
                else if (param1 != null && param2 != null)
                    method(param1, param2);
                else if (param1 != null)
                    method(param1);
                else
                    method();
            }
        }

        Callback.WaitAll = function(callBacks, onSuccess) {
        	var callsNumber;

            var interval = $interval(function() {
            	callsNumber = 0;
                for (var i = 0; i < callBacks.length; i++) {
                	if ( callBacks[i].isFired() )
                		callsNumber++;
                }

                if (callsNumber == callBacks.length) {
                    $interval.cancel(interval);
                    onSuccess.fire();
                }

            }, 100);
        };

        Callback.Calls = {
            MAX: -1
        }

        return Callback;


    }
]);