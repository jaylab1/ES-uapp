application.factory('Mode', [
    'Model', 'Util', 'Http', 'Callback',
    function(Model, Util, Http, Callback) {
        'use strict';

        var Mode = augment(Model, function(parent) {
            /**
             * Mode Constructor
             * @param  {row} resulted row from select statement
             */
            this.constructor = function(row) {
                this._fields = ["name", "maxPassengers", "minFare", "cancelationFee", "etaTime"];
                this._tableName = "Mode";
                this._modelType = Mode;
                parent.constructor.call(this, row);
            };

            this.getDragDealerStep = function() {
                if (this.isService())
                    return 1;
                else if (this.isServicePlus())
                    return 2;
                else if (this.isTaxi())
                    return 3;
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
            SERVISS_PLUS: 3
        };

        /*Mode.All = [(new Mode({
            id: 1,
            name: "Taxi",
            maxPassengers: 1
        })), (new Mode({
            id: 2,
            name: "Service",
            maxPassengers: 4
        })), (new Mode({
            id: 3,
            name: "Service+",
            maxPassengers: 3
        }))];*/
        
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
            var modeId = null;
            if (stepId === 1)
                modeId = Mode.ID.SERVISS;
            else if (stepId === 2)
                modeId = Mode.ID.SERVISS_PLUS;
            else if (stepId === 3)
                modeId = Mode.ID.TAXI;
            
            return Mode.FindById(modeId);
        };

        return Mode;
    }
]);