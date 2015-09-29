application.factory('HailRequest', [
    'Model', 'Http', 'Error', 'Callback', 'Settings',
    'Driver', 'Util', 'SyncTrip', 'Mode', '$timeout',
    'Geolocation',
    function(Model, Http, Error, Callback, Settings,
        Driver, Util, SyncTrip, Mode, $timeout,
        Geolocation) {
        'use strict';

        var HailRequest = augment(Model, function(parent) {
            /**
             * HailRequest Constructor
             * @param  {row} resulted row from select statement
             */
            this.constructor = function(row) {
                this._fields = ["ride_id", "hail", "response", "arrived", "pickup", "dropoff", "cancel", "noservice", "pickup_address", "dropoff_address", "pickup_location", "dropoff_location", "passengers", "fare", "paid", "payment_method", "trip_mode", "driver"];
                this._tableName = "HailRequest";
                this._modelType = HailRequest;
                parent.constructor.call(this, row);

                this.pickupLocation = this.pickup_location ? Geolocation.ParsePosition(this.pickup_location) : null;
                this.pickupAddress = this.pickup_address ? this.pickup_address : null;
                this.dropoffAddress = this.dropoff_address ? this.dropoff_address : null;
                this.dropoffLocation = this.dropoff_location ? Geolocation.ParsePosition(this.dropoff_location) : null;
                this.mode = this.trip_mode ? Mode.FindById(parseInt(this.trip_mode)) : null;
                this.passengers = this.passengers ? this.passengers : 1;
                this.pingInterval = null;
                this.rideId = this.ride_id ? this.ride_id : null;
                this.comment = null;
                this.driver = this.driver ? new Driver(this.driver) : new Driver(); //assigned driver
                this.pingActions = [];
                this.status = null;
                this.onDroppedoff = null;
                this.totalCost = 0;
                this.driverTimeout = null;
                this.isPingable = true;
                this.isSyncable = true;
                this.nearestPoint = {};
                this.nearestPointWatch = null;
            };

            this.estimateCost = function(onSuccess, onError) {
                var self = this;

                var makeEstimateRequest = function() {
                    var http = new Http();
                    http.get({
                        url: CONFIG.SERVER.URL,
                        params: {
                            fare: true,
                            pickupLat: self.pickupLocation.lat(),
                            pickupLng: self.pickupLocation.lng(),
                            dropoffLat: self.dropoffLocation.lat(),
                            dropoffLng: self.dropoffLocation.lng(),
                            modeId: self.mode.id
                        },
                        onSuccess: new Callback(function(cost) {
                            self.totalCost = cost * self.passengers;
                            onSuccess.fire(self.totalCost);
                        }),
                        onFail: onError,
                        onError: onError
                    });
                };

                if (this.mode.id === Mode.ID.SERVISS) {
                    makeEstimateRequest();
                } else {
                    var http = new Http();
                    http.isLoading = false;
                    http.get({
                        url: CONFIG.SERVER.URL,
                        params: {
                            trip_validate: true,
                            trip_type: this.mode.id,
                            lat1: this.pickupLocation.lat(),
                            long1: this.pickupLocation.lng(),
                            lat2: this.dropoffLocation.lat(),
                            long2: this.dropoffLocation.lng(),
                            address1: this.pickupAddress,
                            address2: this.dropoffAddress
                        },
                        onSuccess: new Callback(function() {
                            makeEstimateRequest();
                        }),
                        onFail: onError,
                        onError: onError
                    });
                }


            };

            this.consumeCost = function(user, onSuccess, onError) {
                user.subtractCredit(this.totalCost, onSuccess, onError);
            };

            this.ping = function(user, onSuccess, onError) {
                var self = this;

                var http = new Http();
                http.isLoading = false;

                var sendPingData = function() {

                    if (!self.isPingable)
                        return;

                    http.get({
                        url: CONFIG.SERVER.URL,
                        model: Driver,
                        params: {
                            ping: true,
                            userId: user.id
                        },
                        onSuccess: new Callback(function(driver) {
                            self.isPingable = false;
                            
                            if (self.driverTimeout) $timeout.cancel(self.driverTimeout);

                            self.driver = driver;
                            onSuccess.fire(driver);
                        }),
                        onFail: new Callback(function (e) {
                            self.isPingable = false;
                            onError.fire(e);
                        }),
                        onError: onError
                    });
                };

                user.pingActions.push(sendPingData);

                /*this.pingInterval = $interval(function() {
                    sendPingData();
                    for (var i = 0; i < self.pingActions.length; i++) {
                        self.pingActions[i]();
                    }
                }, Settings.getInstance().server_rate * 1000);*/

            };

            this.sync = function(user, onSuccess, onError) {
                var self = this;
                
                var http = new Http();
                http.isLoading = false;

                user.pingActions.push(function() {
                    
                    if (!self.isSyncable)
                        return;

                    http.get({
                        url: CONFIG.SERVER.URL,
                        model: SyncTrip,
                        params: {
                            sync: true,
                            userId: user.id
                        },
                        onSuccess: new Callback(function(sync) {
                            /*var sync = syncArray[0];*/
                            if (sync.dropoff.trim().length !== 0) {
                                self.status = "THANKS FOR USING ESERVISS";
                                self.isSyncable = false;
                                if (self.onDroppedoff) self.onDroppedoff.fire();
                            } else if (sync.pickup.trim().length !== 0) {
                                self.status = Util.String("{0} PICKED YOU UP", [sync.mode.name]);
                            } else if (sync.arrived.trim().length !== 0) {
                                self.status = Util.String("{0} ARRIVED", [sync.mode.name]);
                            } else if (sync.response.trim().length !== 0) {
                                self.status = Util.String("{0} ON ITS WAY", [sync.mode.name]);
                            }

                            onSuccess.fire(sync);
                        }),
                        onFail: null,
                        onError: onError
                    });
                });
            };


            this.make = function(user, onSuccess, onError) {
                var self = this;

                var requestDriverTimeout = function(settings) {
                    var http = new Http();
                    http.isLoading = false;
                    http.get({
                        url: CONFIG.SERVER.URL,
                        model: Settings,
                        params: {
                            driver_timeout: true,
                            rideID: self.rideId,
                            userID: user.id
                        },
                        onSuccess: new Callback(function(settings) {
                            $timeout(function() {
                                requestDriverTimeout(settings);
                            }, settings.provider_timeout * 1000);
                        }),
                        onFail: new Callback(function(e) {
                            self.isPingable = false;
                            onError.fire(e);
                        }),
                        onError: onError
                    });
                };

                var initDriverTimeout = function() {
                    var http = new Http();
                    /*http.isLoading = false;*/
                    http.get({
                        url: CONFIG.SERVER.URL,
                        model: Settings,
                        params: {
                            start: true
                        },
                        onSuccess: new Callback(function(settings) {
                            $timeout(function() {
                                requestDriverTimeout(settings);
                            }, settings.provider_timeout * 1000);
                        }),
                        onError: onError
                    });
                };

                var find = function() {
                    var http = new Http();
                    http.timeout = null;
                    /*http.isLoading = false;*/
                    http.get({
                        url: CONFIG.SERVER.URL,
                        params: {
                            find: true,
                            userId: user.id,
                            currentLat: self.pickupLocation.lat(),
                            currentLng: self.pickupLocation.lng(),
                            destinationLat: self.dropoffLocation.lat(),
                            destinationLng: self.dropoffLocation.lng(),
                            tripType: self.mode.id,
                            passengers: self.passengers
                        },
                        onSuccess: new Callback(function() {
                            self.isPingable = true;
                            self.ping(user, onSuccess, onError);

                            // initDriverTimeout();
                        }),
                        onFail: null /*new Callback(function(e) {
                            onError.fire(new Error("There is no cars available at the current time!", true, true));
                        })*/,
                        onError: null /*onError*/
                    });
                };

                var makeUserRequest = function() {
                    var http = new Http();
                    /*http.isLoading = false;*/
                    http.get({
                        url: CONFIG.SERVER.URL,
                        params: {
                            user: true,
                            user_id: user.id,
                            trip_type: self.mode.id,
                            passengers: self.passengers,
                            lat1: self.pickupLocation.lat(),
                            long1: self.pickupLocation.lng(),
                            lat2: self.dropoffLocation.lat(),
                            long2: self.dropoffLocation.lng(),
                            address1: self.pickupAddress,
                            address2: self.dropoffAddress,
                            comment: self.comment
                        },
                        onSuccess: new Callback(function(rideId) {
                            /*self.isPingable = true;
                            self.ping(user, onSuccess, onError);*/
                            self.rideId = rideId;
                            find();
                        }),
                        onFail: onError,
                        onError: onError
                    });
                };

                makeUserRequest();
            };

            this.feedback = function(user, rating, comment, onSuccess, onError) {
                var self = this;

                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        'insert-feedback': true,
                        rideId: this.rideId,
                        userId: user.id,
                        driverId: this.driver.id,
                        comment: comment,
                        rate: rating
                    },
                    onSuccess: onSuccess,
                    onFail: onError,
                    onError: onError
                });
            };

            this.setMode = function(mode) {

                if (mode === null)
                    return;

                this.mode = mode;
                if (this.passengers > mode.maxPassengers)
                    this.passengers = mode.maxPassengers;
            };

            this.validateServicePickup = function(onSuccess, onError) {
                var self = this;
                if (!this.mode || this.mode.id !== Mode.ID.SERVISS) {
                    onSuccess.fire(true);
                    return;
                }

                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        'validate-service-pickup': true,
                        pickupLat: this.pickupLocation.lat(),
                        pickupLng: this.pickupLocation.lng()
                    },
                    onSuccess: new Callback(function(r) {
                        /*if (r.safe === null) {
                            onSuccess.fire(true);
                            return;
                        }*/


                        self.nearestPoint.location = Geolocation.ParsePosition(r.location);
                        self.nearestPoint.distance = r.distance;
                        self.nearestPoint.message = r.safe ? r.safe : "Meeting point with service is near";
                        self.nearestPoint.header = {
                            line: []
                        };
                        onSuccess.fire(false);
                    }),
                    onFail: onError,
                    onError: onError
                });
            };

            this.watchToMeetingPoint = function(onProgress, onMinDistance, onNearDistance, onError) {
                var self = this;

                if (this.nearestPointWatch) this.nearestPointWatch.stopWatching();
                var MIN_DISTANCE = 10;
                var NEAR_DISTANCE = 100;

                /*var counter = 0;*/

                this.nearestPointWatch = new Geolocation();
                this.nearestPointWatch.watch(new Callback(function(position) {
                    onProgress.fire(position);

                    var minDistance = MIN_DISTANCE + position.accuracy;
                    minDistance = minDistance > 50 ? 50 : minDistance;

                    var nearDistance = NEAR_DISTANCE + position.accuracy;
                    nearDistance = nearDistance > 150 ? 150 : nearDistance;


                    var distance = position.calculateDistance(self.nearestPoint.location);

                    if (distance <= nearDistance) {
                        console.log("nearDistance", nearDistance);
                        onNearDistance.fire();
                    }

                    if (distance <= minDistance) {
                        self.nearestPointWatch.stopWatching();
                        onMinDistance.fire();
                    }

                    /*counter++;
                    console.log(counter, self.nearestPoint.location.lat(), self.nearestPoint.location.lng(), distance);
                    if (counter > 2)
                        self.nearestPoint.location = position;*/


                }), onError);
            };

            this.inService = function(onSuccess, onError) {
                /*onSuccess.fire(true);
                return;*/
                var http = new Http();
                /*http.isLoading = false;*/
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        available_cars: true,
                        trip_type: this.mode.id
                    },
                    onSuccess: onSuccess,
                    onFail: onError,
                    onError: onError
                });
            };


        });

        /*Object.defineProperty(HailRequest.prototype, 'dropoffLocation', {
            set: function(val) {
                this._dropoffLocation = val;
                if (this.mode && this.mode.id === Mode.ID.TAXI) {
                    this._dropoffLocation = val;
                    return
                }

                var MAX_DISTANCE = 10 * 1000;

                if (this.pickupLocation && val) {
                    var distance = google.maps.geometry.spherical.computeDistanceBetween(this.pickupLocation, val);
                    if (distance > MAX_DISTANCE || isNaN(distance)) {
                        this.dropoffAddress = null;
                        this._dropoffLocation = null;
                    } else {
                        this._dropoffLocation = val;
                    }
                }
            },
            get: function() {
                return this._dropoffLocation;
            }
        });*/

        return HailRequest;
    }
]);