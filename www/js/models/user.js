application.factory('User', [
    'Model', 'Http', 'localStorageService', 'Callback', 'Geolocation', 'Util',
    'Settings', '$interval', 'SyncTrip', 'HailRequest', 'Error', 'Favorite',
    '$cordovaPush', 'Share',
    function(Model, Http, localStorageService, Callback, Geolocation, Util,
        Settings, $interval, SyncTrip, HailRequest, Error, Favorite,
        $cordovaPush, Share) {
        'use strict';

        var User = augment(Model, function(parent) {
            /**
             * User Constructor
             * @param  {row} resulted row from select statement
             */
            this.constructor = function(row) {
                this._fields = ["email", "password", "firstName", "lastName", "gender", "mobile", "country", "stripeCustomerId", "stripeCardId", "profilePicture"];
                this._tableName = "User";
                this._modelType = User;
                parent.constructor.call(this, row);
                this.profilePicture = (!this.profilePicture || this.profilePicture.length === 0) ? "img/pp.png" : this.profilePicture;

                this.pingActions = [];
                this.pingInterval = null;
                this.nearbyActionIndex = null;
            };

            this.findPosition = function(onSuccess, onError) {
                var self = this;
                var g = new Geolocation();
                g.findPosition(new Callback(function (position) {
                    self.position = position;
                    onSuccess.fire(position);
                }), onError);
            };

            this.findShare = function(onSuccess, onError) {
                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    model: Share,
                    params: {
                        promo_share: true,
                        userId: this.id
                    },
                    onSuccess: onSuccess,
                    onFail: onError,
                    onError: onError
                });
            };

            this.registerPushNotification = function(token) {
                var self = this;

                var http = new Http();
                http.isLoading = false;
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        'push-register': true,
                        userId: this.id,
                        android: ionic.Platform.isAndroid() ? token : null,
                        ios: ionic.Platform.isIOS() ? token : null
                    },
                    onSuccess: new Callback(),
                    onFail: new Callback(),
                    onError: new Callback()
                });
            };

            this.signin = function(onSuccess, onInactiveMobile, onError) {
                var self = this;

                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    model: User,
                    params: {
                        signin: true,
                        email: self.email,
                        password: User.PrepareSecurityToken(self.password) //self.password
                    },
                    onSuccess: new Callback(function(user) {
                        user.password = self.password;
                        User.SharedInstance = user;
                        User.SetSecurityToken(self.password);
                        onSuccess.fire(user);
                    }),
                    onFail: new Callback(function(e, status, result) {
                        if (status === "INACTIVE_MOBILE") {
                            if (onInactiveMobile) onInactiveMobile.fire(result);
                        } else {
                            onError.fire(e);
                        }
                    }),
                    onError: onError
                });
            };

            this.signup = function(onSuccess, onError) {
                var self = this;

                var hashedPassword = new Hashes.MD5().hex(self.password);
                var onUiniqueIdFound = function(uId) {
                    var http = new Http();
                    http.get({
                        url: CONFIG.SERVER.URL,
                        model: User,
                        params: {
                            signup: true,
                            firstName: self.firstName,
                            lastName: self.lastName,
                            gender: self.gender,
                            mobile: self.mobile,
                            email: self.email,
                            password: hashedPassword, // self.password,
                            country: self.country,
                            uid: uId,
                            sid: 0 //stripe id
                        },
                        onSuccess: new Callback(function(user) {
                            self.id = user.id;
                            onSuccess.fire();
                        }),
                        onFail: new Callback(function(e, status, result) {
                            if (status === "INACTIVE_USER") {
                                onSuccess.fire();
                                return;
                            }

                            onError.fire(e);
                        }),
                        onError: onError
                    });
                };

                /*onUiniqueIdFound(Util.RandomString(32));
                return;*/

                plugins.uniqueDeviceID.get(onUiniqueIdFound, function() {
                    onError.fire(new Error("Can't find the device id, please try again later!", true, true));
                });

            };

            this.ping = function() {

                var self = this;

                var startPinging = function() {
                    self.pingInterval = $interval(function() {
                        for (var i = 0; i < self.pingActions.length; i++) {
                            self.pingActions[i]();
                        }
                    }, Settings.getInstance().server_rate * 1000);
                };


                if (!Settings.getInstance().server_rate) {
                    Settings.Download(new Callback(function() {
                        startPinging();
                    }));
                } else {
                    startPinging();
                }



            };

            this.updateProfile = function(profile, imageManager, onSuccess, onError) {
                var self = this;
                imageManager.upload(CONFIG.SERVER.URL, new Callback(function(r) {
                    onSuccess.fire();
                }), onError, {
                    params: {
                        'update-profile': true,
                        userId: self.id,
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        email: profile.email
                    }
                });
            };

            this.sync = function(hailOnProgress, hailConfirmed, onFail, onError) {
                var http = new Http();

                http.get({
                    url: CONFIG.SERVER.URL,
                    model: SyncTrip,
                    params: {
                        sync: true,
                        userId: this.id
                    },
                    onSuccess: new Callback(function(sync) {

                        if (!sync) {
                            onFail.fire();
                            return;
                        }

                        var buildRequest = function(tripSync) {
                            var request = new HailRequest(tripSync);
                            /*var request = new HailRequest({
                                id: tripSync.ride_id
                            });
                            request.pickupLocation = tripSync.pickupLocation;
                            request.pickupAddress = tripSync.pickup_address;
                            request.dropoffLocation = tripSync.dropoffLocation;
                            request.dropoffAddress = tripSync.dropoff_address;
                            request.setMode(tripSync.mode);
                            request.passengers = tripSync.passengers;*/
                            return request;
                        };

                        /*var sync = syncArray[0];*/
                        if (sync.dropoff.trim().length !== 0 || sync.noservice.trim().length !== 0 || sync.cancel_by_driver.trim().length !== 0) {
                            onFail.fire();
                            return;
                        } else if (sync.pickup.trim().length !== 0 || sync.arrived.trim().length !== 0 || sync.response.trim().length !== 0) {
                            hailConfirmed.fire(buildRequest(sync));
                            return;
                        } else if (sync.response.trim().length === 0 && sync.pickupLocation !== null) {
                            hailOnProgress.fire(buildRequest(sync));
                            return;
                        }

                        onFail.fire();
                    }),
                    onFail: null,
                    onError: onError
                });
            };

            this.verifyMobile = function(code, onSuccess, onError) {
                var self = this;
                var smsHashedCode = new Hashes.MD5().hex(code);
                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    model: User,
                    params: {
                        nexmo: true,
                        userId: this.id,
                        email: this.email,
                        val: smsHashedCode //code
                    },
                    onSuccess: new Callback(function() {
                        User.SetSecuritySmsToken(code);
                        onSuccess.fire();
                    }),
                    onFail: onError,
                    onError: onError
                });
            };

            this.resendSms = function(onSuccess, onError) {
                var self = this;
                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        SEND_SMS: true,
                        email: this.email,
                        mobile: this.mobile
                    },
                    onSuccess: new Callback(function(r) {
                        self.id = r;
                        onSuccess.fire();
                    }),
                    onFail: onError,
                    onError: onError
                });
            };

            this.forgotPasswordSendSms = function (onSuccess, onError) {
                var self = this;
                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        nexmo_forgot_password: true,
                        phone: this.mobile
                    },
                    onSuccess: onSuccess,
                    onFail: onError,
                    onError: onError
                });
            };

            this.forgotPasswordValidateMobile = function (code, onSuccess, onError) {
                var self = this;
                var smsHashedCode = new Hashes.MD5().hex(code);
                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        validate_forgot_password: true,
                        phone: this.mobile,
                        val: smsHashedCode 
                    },
                    onSuccess: onSuccess,
                    onFail: onError,
                    onError: onError
                });
            };

            this.forgotPasswordReset = function (onSuccess, onError) {
                var self = this;

                var passwordHashed = new Hashes.MD5().hex(this.password);

                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        forgot_password: true,
                        phone: this.mobile,
                        password: passwordHashed
                    },
                    onSuccess: onSuccess,
                    onFail: onError,
                    onError: onError
                });
            };

            this.createCustomer = function(onSuccess, onError) {
                var self = this;

                var requestStripeCustomer = function() {
                    var http = new Http();
                    http.get({
                        url: CONFIG.SERVER.URL,
                        params: {
                            'stripe-customer': true,
                            userId: self.id,
                            customerId: self.stripeCustomerId
                        },
                        onSuccess: new Callback(function(r) {
                            onSuccess.fire(self.stripeCustomerId);
                        }),
                        onFail: onError,
                        onError: onError
                    });
                };



                stripe.customers.create({
                    description: Util.String("#{0} {1} {2} ({3})", [this.id, this.firstName, this.lastName, this.mobile]),
                    email: this.email
                }, function(result) {
                    if (result.id) {
                        self.stripeCustomerId = result.id;
                        requestStripeCustomer();
                    } else if (result.error) {
                        onError.fire(new Error(result.error.message));
                    } else {
                        onError.fire(new Error("Customer account can't be created now!"));
                    }
                });
            };

            this.createCreditCard = function(credit, onSuccess, onError) {
                var self = this;

                var requestMotivationMessage = function() {
                    var http = new Http();
                    http.get({
                        url: CONFIG.SERVER.URL,
                        params: {
                            'motivate-credit': true,
                            userId: self.id
                        },
                        onSuccess: new Callback(function(r) {
                            onSuccess.fire(r);
                        }),
                        onFail: new Callback(function() {
                            onSuccess.fire("Credit Card is saved successfuly, you can now recharge your balance");
                        }),
                        onError: new Callback(function() {
                            onSuccess.fire("Credit Card is saved successfuly, you can now recharge your balance");
                        })
                    });
                };


                stripe.customers.createCard(this.stripeCustomerId, {
                        card: credit
                    },
                    function(result) {
                        if (result.id) {
                            self.stripeCardId = result.id;
                            requestMotivationMessage();
                            /*onSuccess.fire(self.stripeCardId);*/
                        } else if (result.error) {
                            onError.fire(new Error(result.error.message));
                        } else {
                            onError.fire(new Error("Customer account can't be created now!"));
                        }

                    });
            };

            this.editCreditCard = function(credit, onSuccess, onError) {
                var self = this;
                var tmpCreditCardId = self.stripeCardId;

                stripe.customers.removeCard(
                    self.stripeCustomerId,
                    tmpCreditCardId,
                    function(result) {
                        if (result.id && result.id === tmpCreditCardId && result.deleted) {
                            this.createCreditCard(credit, onSuccess, onError);
                        } else {
                            onError.fire(new Error("Can't edit your credit card now, try again or contact the technical support"));
                        }
                    });

            };

            this.findCreditCards = function(onSuccess, onError) {
                var defaultError = new Error("Can't retrieve customer credit cards now, please contact the technical support");

                if (typeof stripe === "undefined") {
                    onError.fire(defaultError);
                    return;
                }

                if (!this.isStripeCustomerCreated()) {
                    onSuccess.fire([]);
                    return;
                }

                stripe.customers.retrieve(this.stripeCustomerId, function(customer) {
                    if (customer.error) {
                        onError.fire();
                    } else {
                        onSuccess.fire(customer.sources.data);
                    }
                });
            };

            this.saveCreditCard = function(credit, onSuccess, onError) {
                var self = this;

                var onCustomerCreated = new Callback(function() {

                    self.createCreditCard(credit, onSuccess, onError);

                    //check if there is no credit card
                    /*if (self.stripeCardId === null || self.stripeCardId.length === 0 || self.stripeCardId === "0") {
                        self.createCreditCard(credit, onSuccess, onError);
                    } else {
                        self.editCreditCard(credit, onSuccess, onError)
                    }*/
                });

                //if there is no customer create a new one
                if (this.stripeCustomerId === null || this.stripeCustomerId.length === 0 || this.stripeCustomerId === "0") {
                    this.createCustomer(onCustomerCreated, onError);
                } else {
                    onCustomerCreated.fire();
                }
            };

            this.addRechargeCredit = function(amount, onSuccess, onError) {
                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        'add-credit': true,
                        type: 'cash',
                        credit: amount,
                        userId: self.id
                    },
                    onSuccess: onSuccess,
                    onFail: onError,
                    onError: onError
                });
            };

            this.subtractCredit = function(amount, onSuccess, onError) {
                var self = this;

                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        'deduct-credit': true,
                        userId: this.id,
                        type: 'cash',
                        payment: amount
                    },
                    onSuccess: onSuccess,
                    onFail: onError,
                    onError: onError
                });
            };

            this.prepaidCard = function(code, onSuccess, onError) {
                var self = this;

                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        'validate-prepaid': true,
                        userId: this.id,
                        code: code,
                    },
                    onSuccess: onSuccess,
                    onFail: onError,
                    onError: onError
                });
            };

            this.recharge = function(amount, onSuccess, onError) {
                var self = this;

                /*var requestAddCredit = function() {
                    var http = new Http();
                    http.get({
                        url: CONFIG.SERVER.URL,
                        params: {
                            'add-credit': true,
                            type: 'cash',
                            credit: (amount / 100),
                            userId: self.id
                        },
                        onSuccess: new Callback(function() {
                            onSuccess.fire();
                            self.credit += (amount / 100).toFixed(2);
                        }),
                        onFail: onError,
                        onError: onError
                    });
                };*/

                stripe.charges.create({
                        amount: amount,
                        currency: 'usd',
                        customer: this.stripeCustomerId,
                        description: Util.String("#{0} {1} {2} ({3}) charged with {4}$", [this.id, this.firstName, this.lastName, this.mobile, (amount / 100).toFixed(2)])
                    },
                    function(result) {
                        if (result.id && result.paid) {
                            self.addRechargeCredit((amount / 100), new Callback(function() {
                                self.credit += (amount / 100).toFixed(2);
                                onSuccess.fire();
                            }), onError);
                            /*requestAddCredit();*/
                        } else if (result.error) {
                            onError.fire(new Error(result.error.message));
                        } else {
                            onError.fire(new Error("Charging your account can't be processed now!"));
                        }
                    });
            };

            this.findCredit = function(onSuccess, onError) {
                var self = this;

                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        'display-credit': true,
                        userId: this.id,
                    },
                    onSuccess: new Callback(function(r) {
                        if (!r) 
                            self.credit = 0;
                        else
                            self.credit = r[0];
                        onSuccess.fire(self.credit);
                    }),
                    onFail: onError,
                    onError: onError
                });
            };


            this.findFavorites = function(onSuccess, onError) {
                Favorite.FindAll(this, onSuccess, onError);
            };

            this.findBlacklist = function(onSuccess, onError) {
                var self = this;

                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        'block': true,
                        userId: this.id,
                    },
                    onSuccess: new Callback(function(r) {
                        onSuccess.fire(r[0]);
                    }),
                    onFail: onError,
                    onError: onError
                });
            };

            this.store = function() {
                return localStorageService.set(User.STORAGE_KEY, this.toJson());
            };

            this.logout = function() {
                localStorageService.remove(User.STORAGE_KEY);
                $interval.cancel(this.pingInterval);
            };

            this.isStripeCustomerCreated = function() {
                if (this.stripeCustomerId === null || this.stripeCustomerId.length === 0 || this.stripeCustomerId === "0") {
                    return false;
                }


                return true;
            };

            this.findNearbyCars = function(mode, onSuccess, onError) {
                var self = this;

                var makeHttpRequest = function() {
                    self.findPosition(new Callback(function(position) {

                        var http = new Http();
                        http.isLoading = false;
                        http.get({
                            url: CONFIG.SERVER.URL,
                            params: {
                                'nearby_cars': true,
                                lat: position.lat(),
                                lng: position.lng(),
                                tripType: mode.id
                            },
                            onSuccess: onSuccess,
                            onFail: onError,
                            onError: onError
                        });
                    }))
                };

                if (this.nearbyActionIndex === null)
                    this.nearbyActionIndex = this.pingActions.push(makeHttpRequest) - 1;
                else
                    this.pingActions[this.nearbyActionIndex] = makeHttpRequest;
            };
        });

        User.STORAGE_KEY = "user";
        User.SharedInstance = null;

        User.IsStored = function() {
            var user = localStorageService.get(User.STORAGE_KEY);
            return user !== null;
        };

        User.ToAuthToken = function (code) {
            var tokenMd5 = new Hashes.MD5().hex(code);
            return tokenMd5;
        };


        User.TOKEN_KEY = "TOKEN_KEY";
        User.PrepareSecurityToken = function (password) {
            var smsToken = localStorageService.get(User.SMS_TOKEN_KEY);
            var hashedPassword = new Hashes.MD5().hex(password);
            var contanenatedCode = smsToken + hashedPassword;
            var token = new Hashes.MD5().hex(contanenatedCode);

            return token;
        };

        User.SetSecurityToken = function (password) {
            localStorageService.set(User.TOKEN_KEY, User.PrepareSecurityToken(password));
            return this;
        };

        User.GetSecurityToken = function () {
            return localStorageService.get(User.TOKEN_KEY);
        };

        User.SMS_TOKEN_KEY = "SMS_TOKEN_KEY";
        User.SetSecuritySmsToken = function (smsCode) {
            var hashedSmsCode = new Hashes.MD5().hex(smsCode);
            localStorageService.set(User.SMS_TOKEN_KEY, hashedSmsCode);
            return this;
        };

        User.InitPushNotification = function() {
            try {
                if (ionic.Platform.isAndroid()) {
                    $cordovaPush.register({
                        "senderID": "307744414387",
                    }).then(function(result) {
                        //Util.Alert(result);
                    }, function(err) {
                        //Util.Alert(err);
                    });
                } else {
                    $cordovaPush.register({
                        "badge": true,
                        "sound": true,
                        "alert": true,
                    }).then(function(deviceToken) {
                        /*Util.Alert(deviceToken);*/
                        User.getInstance().registerPushNotification(deviceToken);
                    }, function(err) {
                        /*Util.Alert(err);*/
                    });
                }

            } catch (e) {}
        };

        User.getInstance = function() {
            //check if its stored
            if (User.SharedInstance === null && User.IsStored()) {
                var userJson = localStorageService.get(User.STORAGE_KEY);
                User.SharedInstance = new User(userJson);
            } else if (User.SharedInstance === null) {
                User.SharedInstance = new User();
            }

            return User.SharedInstance;
        };
        return User;
    }
]);