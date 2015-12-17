application.factory('HailRequest', [
    'Model', 'Http', 'Error', 'Callback', 'Settings',
    'Driver', 'Util', 'SyncTrip', 'Mode', '$timeout',
    'Geolocation',
    function(Model, Http, Error, Callback, Settings,
        Driver, Util, SyncTrip, Mode, $timeout,
        Geolocation) {
        'use strict';

        var HailRequest = augment(Model, function(parent) {
            
            this.constructor = function(row) {
                this._fields = ["ride_id", "hail", "response", "arrived", "pickup", "dropoff", "cancel", "noservice", "pickup_address", "dropoff_address", "pickup_location", "dropoff_location", "passengers", "fare", "paid", "payment_method", "trip_mode", "driver", "driver_dropoff_address", "driver_dropoff_location"];
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
                this.stage = null;
                this.onEtaArrival = null;
                this.etaArriaval = null;
                this.pingActionIndex = null;
            };

            this.getDropoffLocation = function() {
                return Geolocation.ParsePosition("30.2,31.4");

                var dropoffLocation = null;


                if (this.dropoff_location.length <= 1 || this.driver_dropoff_location.length <= 1)
                    return null;

                dropoffLocation = this.dropoff_location.length > 1 ? Geolocation.ParsePosition(this.dropoff_location) : null;

                if (!dropoffLocation)
                    dropoffLocation = this.driver_dropoff_location.length > 1 ? Geolocation.ParsePosition(this.driver_dropoff_location) : null;

                return dropoffLocation;
            };

            this.getDropoffAddress = function() {

                if (!this.dropoff_address || !this.driver_dropoff_address)
                    return null;

                if (this.dropoff_address.toUpperCase().search("NOT SET") !== -1)
                    return this.dropoff_address;

                if (this.driver_dropoff_address.toUpperCase().search("NOT SET") !== -1)
                    return this.driver_dropoff_address;

                return null;
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
                            if (onSuccess) onSuccess.fire(self.totalCost);
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
                var self = this;
                //user.subtractCredit(this.totalCost, onSuccess, onError);
                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        ride_payment: true,
                        userId: user.id,
                        rideId: this.rideId
                    },
                    onSuccess: new Callback(function(m, s, r, data) {
                        self.totalCost = data.fee;
                        onSuccess.fire();
                    }),
                    onFail: new Callback(function(e, s, r, data) {
                        self.totalCost = data.fee;
                        onError.fire(e);
                    }),
                    onError: onError
                });
            };

            this.ping = function(user, onSuccess, onError, onFail) {
                if (this.pingActionIndex) {
                    this.isPingable = true;
                    return;
                }

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
                        onFail: new Callback(function(e) {
                            self.isPingable = false;
                            onError.fire(e);

                            if (onFail) onFail.fire(e);
                        }),
                        onError: onError
                    });
                };

                var pingIndex = user.pingActions.push(sendPingData);
                this.pingActionIndex = pingIndex - 1;

                

            };

            this.sync = function(user, onSuccess, onError) {
                var self = this;
                self.isSyncable = true;

                var http = new Http();
                http.isLoading = false;

                var makeSync = function() {
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
                            
                            if (!sync) return;
                            if (sync.cancel_by_driver.trim().length !== 0) {
                                self.status = "RIDE IS CANCELED";
                                self.isSyncable = false;
                                self.stage = HailRequest.STAGE.CANCEL;
                                if (self.onDriverCanceled) self.onDriverCanceled.fire();
                            } else if (sync.cancel.trim().length !== 0) {
                                self.status = "RIDE IS CANCELED";
                                self.isSyncable = false;
                                self.stage = HailRequest.STAGE.CANCEL;
                            } else if (sync.dropoff.trim().length !== 0) {
                                self.status = "THANKS FOR USING ESERVISS";
                                self.isSyncable = false;
                                self.stage = HailRequest.STAGE.DROPOFF;
                                self.fare = sync.fare;
                                console.log(sync, sync.fare);
                                if (self.onDroppedoff) self.onDroppedoff.fire();
                            } else if (sync.pickup.trim().length !== 0) {
                                self.stage = HailRequest.STAGE.PICKUP;
                                self.status = Util.String("YOU HAVE BEEN PICKED UP", [sync.mode.name.toUpperCase()]);
                            } else if (sync.arrived.trim().length !== 0) {
                                self.stage = HailRequest.STAGE.ARRIVED;
                                self.status = Util.String("YOUR RIDE HAS ARRIVED", [sync.mode.name.toUpperCase()]);
                            } else if (sync.response.trim().length !== 0) {
                                self.stage = HailRequest.STAGE.RESPONSE;
                                self.status = Util.String("DRIVER IS COMING", [sync.mode.name.toUpperCase()]);
                            }

                            onSuccess.fire(sync);
                        }),
                        onFail: null,
                        onError: onError
                    });

                    var makeEtaArrivalRequest = function() {
                        if (user.position && user.position.lat() && user.position.lng()) {
                            http.get({
                                url: CONFIG.SERVER.URL,
                                params: {
                                    eta_arrival: true,
                                    car_id: self.driver.CarId,
                                    lat: user.position.lat(),
                                    "long": user.position.lng(),
                                },
                                onSuccess: new Callback(function(arrival) {
                                    self.etaArrival = arrival;
                                    if (self.onEtaArrival) self.onEtaArrival.fire(arrival);
                                }),
                                onFail: null,
                                onError: null
                            });
                        }
                    };

                    makeEtaArrivalRequest();

                    


                };
                makeSync();
                user.pingActions.push(makeSync);
            };

            this.findFare = function(user, onSuccess, onError) {
                var self = this;
                var MAX_REQUESTS = 5;
                var requestsCounter = 0;
 
                var findFareRequest = function() {
                    requestsCounter++;
                    var http = new Http();
                    http.isLoading = false;
                    http.get({
                        url: CONFIG.SERVER.URL,
                        model: SyncTrip,
                        params: {
                            sync: true,
                            userId: user.id
                        },
                        onSuccess: new Callback(function(sync) {
                            if (sync.fare.trim().length === 0 && requestsCounter < MAX_REQUESTS) {
                                $timeout(findFareRequest, 1000);
                                return;
                            } else if (requestsCounter >= MAX_REQUESTS) {
                                onError.fire(new Error("Can't get fare now"));
                                return;
                            }

                            self.fare = parseFloat(sync.fare);
                            onSuccess.fire();
                        }),
                        onError: onError,
                        onFail: onError
                    });
                };

                $timeout(findFareRequest, 1000);


            }

            this.make = function(user, onSuccess, onError) {
                var self = this;

                var isLocked = localStorage.getItem(HailRequest.HAIL_LOCK);
                if (isLocked) {
                    onError.fire(new Error("Please close eserviss and reopen it again."));
                    return;
                }

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
                    http.isLoading = false;
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
                    http.isLoading = false;
                    http.get({
                        url: CONFIG.SERVER.URL,
                        params: {
                            find: true,
                            userId: user.id,
                            currentLat: self.pickupLocation.lat(),
                            currentLng: self.pickupLocation.lng(),
                            destinationLat: self.dropoffLocation ? self.dropoffLocation.lat() : null,
                            destinationLng: self.dropoffLocation ? self.dropoffLocation.lng() : null,
                            tripType: self.mode.id,
                            passengers: self.passengers
                        },
                        onSuccess: new Callback(function() {
                            self.isPingable = true;
                            self.ping(user, onSuccess, onError, new Callback(function() {
                                localStorage.removeItem(HailRequest.HAIL_LOCK);
                            }));

                            // initDriverTimeout();
                        }),
                        onFail: null
                            
                            ,
                        onError: null 
                    });
                };

                var makeUserRequest = function() {
                    var http = new Http();
                    http.isLoading = false;
                    http.get({
                        url: CONFIG.SERVER.URL,
                        params: {
                            user: true,
                            user_id: user.id,
                            trip_type: self.mode.id,
                            passengers: self.passengers,
                            lat1: self.pickupLocation.lat(),
                            long1: self.pickupLocation.lng(),
                            lat2: self.dropoffLocation ? self.dropoffLocation.lat() : null,
                            long2: self.dropoffLocation ? self.dropoffLocation.lng() : null,
                            address1: self.pickupAddress,
                            address2: self.dropoffAddress ? self.dropoffAddress : null,
                            comment: self.comment
                        },
                        onSuccess: new Callback(function(rideId) {
                            
                            self.rideId = rideId;
                            localStorage.setItem(HailRequest.HAIL_LOCK, rideId);
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

            this.cancelRide = function(reason, onSuccess, onError) {
                var self = this;

                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        'cancel': true,
                        rideId: this.rideId,
                        comment: reason
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

                    


                }), onError);
            };

            this.inService = function(onSuccess, onError) {
                var self = this;
                
                var http = new Http();
                
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        available_cars: true,
                        trip_type: this.mode.id
                    },
                    onSuccess: onSuccess,
                    onFail: new Callback(function(e) {
                        if (self.mode.noservice && self.mode.noservice.length > 0) onError.fire(new Error(self.mode.noservice));
                        else onError.fire(e);
                    }),
                    onError: onError
                });
            };


        });

        

        HailRequest.EstimateCost = function(modeId, pickupLocation, dropoffLocation, onSuccess, onError) {
            var http = new Http();
            http.get({
                url: CONFIG.SERVER.URL,
                params: {
                    fare: true,
                    pickupLat: pickupLocation.lat(),
                    pickupLng: pickupLocation.lng(),
                    dropoffLat: dropoffLocation ? dropoffLocation.lat() : null,
                    dropoffLng: dropoffLocation ? dropoffLocation.lng() : null,
                    modeId: modeId
                },
                onSuccess: onSuccess,
                onFail: onError,
                onError: onError
            });
        };

        HailRequest.HAIL_LOCK = "ESERVISS.HAIL_LOCK";
        HailRequest.STAGE = {
            HAIL: "HAIL",
            RESPONSE: "RESPONSE",
            ARRIVED: "ARRIVED",
            PICKUP: "PICKUP",
            DROPOFF: "DROPOFF",
            CANCEL: "CANCEL",
            NO_SERVICE: "NO_SERVICE"
        };

        return HailRequest;
    }
]);
