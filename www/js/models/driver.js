application.factory('Driver', [
    'Model', 'Http', 'Callback',
    function(Model, Http, Callback) {
        'use strict';

        var Driver = augment(Model, function(parent) {
            
            this.constructor = function(row) {
                this._fields = ["DriverName", "DriverPhone", "DriverPhoto", "CarBrand", "CarColor", "CarNumberPalte", "CarNumber", "CarId", "CarPhoto", "comment", "rate"];
                this._tableName = "Driver";
                this._modelType = Driver;
                parent.constructor.call(this, row);

                
            };

            
        });

        return Driver;
    }
]);