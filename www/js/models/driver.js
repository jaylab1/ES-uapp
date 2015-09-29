application.factory('Driver', [
    'Model', 'Http', 'Callback',
    function(Model, Http, Callback) {
        'use strict';

        var Driver = augment(Model, function(parent) {
            /**
             * Driver Constructor
             * @param  {row} resulted row from select statement
             */
            this.constructor = function(row) {
                this._fields = ["DriverName", "DriverPhone", "DriverPhoto", "CarBrand", "CarColor", "CarNumberPalte", "CarNumber", "comment", "rate"];
                this._tableName = "Driver";
                this._modelType = Driver;
                parent.constructor.call(this, row);

                /*this.rating = null;*/
            };

            /*this.findRating = function(onSuccess, onError) {
                var self = this;

                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        'driver-rate': true,
                        driverId: this.id,
                    },
                    onSuccess: new Callback(function (r) {
                        self.rating = r;
                        onSuccess.fire(self.rating);
                    }),
                    onFail: onError,
                    onError: onError
                });
            };*/
        });

        return Driver;
    }
]);