application.factory('SyncTrip', [
    'Model', 'Mode', 'Driver',
    function(Model, Mode, Driver) {
        'use strict';

        var SyncTrip = augment(Model, function(parent) {
            
            this.constructor = function(row) {
                this._fields = ["user_id", "car_id", "ride_id", "driver_id", "hail", "response", "arrived", "pickup", "dropoff", "cancel", "noservice", "pickup_address", "dropoff_address", "pickup_location", "dropoff_location", "passengers", "fare", "paid", "payment_method", "trip_mode", "cancel_by_driver"];
                this._tableName = "SyncTrip";
                this._modelType = SyncTrip;
                parent.constructor.call(this, row);
                this.passengers = parseInt(this.passengers);
                this.trip_mode = parseInt(this.trip_mode);

                this.passengers = this.passengers === 0 ? 1 : this.passengers;
                this.mode = this.trip_mode > 0 ? Mode.FindById(this.trip_mode) : null;
                this.driver = new Driver(row.driver);
                this.pickupLocation = null;
                this.dropoffLocation = null;

                var self = this;
                
                if (this.pickup_location.trim().length !== 0 && this.pickup_location.split(',').length === 2) {
                    this.pickupLocation = {
                        lat: function () {
                            return self.pickup_location.split(',')[0];
                        },
                        lng: function () {
                            return self.pickup_location.split(',')[1];
                        }
                    };
                }

                if (this.dropoff_location.trim().length !== 0 && this.dropoff_location.split(',').length === 2) {
                    this.dropoffLocation = {
                        lat: function () {
                            return self.dropoff_location.split(',')[0];
                        },
                        lng: function () {
                            return self.dropoff_location.split(',')[1];
                        }
                    };
                }
            };
        });

        return SyncTrip;
    }
]);