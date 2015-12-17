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

            
            fire: function(param1, param2, param3, param4, param5) {
                if (this._method && this.isCallable()) {
                    Callback.Fire(this._method, param1, param2, param3, param4, param5);
                    this._callsCounter++;
                }
                return this;

            },



            
            isFired: function() {
                return this._callsCounter > 0;
            },

            waitFiredOnce: function() {
                while (!this.isFired());
            },

            
            isCallable: function() {
                if (this._maxCalls == Callback.Calls.MAX)
                    return true;

                return this._callsCounter < this._maxCalls;
            },

            
            setExtras: function(extras) {
                this._extras = extras;
                return this;
            },

            
            getExtras: function() {
                return this._extras;
            }
        });

        
        Callback.Fire = function(method, param1, param2, param3, param4, param5) {

            if (method != null) {

                if (param5)
                    method(param1, param2, param3, param4, param5);
                else if (param4)
                    method(param1, param2, param3, param4);
                else if (param3)
                    method(param1, param2, param3);
                else if (param2)
                    method(param1, param2);
                else if (param1)
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