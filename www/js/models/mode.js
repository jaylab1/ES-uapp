application.factory('Mode', [
    'Model', 'Util', 'Http', 'Callback',
    function(Model, Util, Http, Callback) {
        'use strict';

        var Mode = augment(Model, function(parent) {
            
            this.constructor = function(row) {
                this._fields = ["mode", "name", "allowed_passengers", "maxPassengers", "minFare", "cancelationFee", "etaTime", "trip_icon", "hail_title", "type_id", "trip_icon", "noservice"];
                this._tableName = "Mode";
                this._modelType = Mode;
                parent.constructor.call(this, row);

                this.id = this.type_id;
                this.maxPassengers = this.allowed_passengers;
                this.icon = this.trip_icon;
                this.name = this.mode;


                

                console.log(this.icon);
            };

            this.getDragDealerStep = function() {
                for (var i = 0; i < Mode.All.length; i++) {
                    if (Mode.All[i].id == this.id)
                        return (i+1);
                };
                
            };

            this.isTaxi = function () {
                return this.id == Mode.ID.TAXI;
            };

            this.isService = function () {
                return this.id == Mode.ID.SERVISS;
            };


            this.isServicePlus = function () {
                return this.id == Mode.ID.SERVISS_PLUS;
            };

            this.isFree = function () {
                return this.id == Mode.ID.FREE;
            }


            this.eta = function (onSuccess, onError) {
                var self = this;

                var http = new Http();
                http.isLoading = false;
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        eta_estimation: true,
                        tripTypeId: this.id
                    },
                    onSuccess: new Callback(function (r) {
                        if (self.isTaxi())
                            self.etaTime = r.taxi;
                        else if (self.isService())
                            self.etaTime = r.service;
                        else if (self.isServicePlus())
                            self.etaTime = r.serviceplus;

                        if (onSuccess) onSuccess.fire(r);
                    }),
                    onFail: onError,
                    onError: onError
                });
            }
        });

        Mode.ID = {
            TAXI: 1,
            SERVISS: 2,
            SERVISS_PLUS: 3,
            FREE: 4
        };

        
        
        Mode.All = [];
        Mode.FindAll = function (onSuccess, onError) {

            if (Mode.All.length > 0) {
                if (onSuccess) onSuccess.fire(Mode.All);
                return;
            }

            var http = new Http();
            http.isLoading = false;
            http.get({
                url: CONFIG.SERVER.URL,
                model: Mode,
                params: {
                    modes_fare: true
                },
                onSuccess: new Callback(function (modes) {
                    console.log(modes);
                    Mode.All = modes;
                    if (onSuccess) onSuccess.fire(Mode.All);
                }),
                onError: onError
            });
        };

        Mode.FindById = function(id) {
            if (Mode.All === null)
                return null;

            return Util.Find(Mode.All, function(mode) {
                return mode.id == id;
            });

        };

        Mode.FromDragDealer = function (stepId) {
            if (!Mode.All) return null;

            return Mode.All[stepId - 1];

            
        };

        return Mode;
    }
]);