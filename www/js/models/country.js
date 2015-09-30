application.factory('Country', [
    'Model', 'Http', 'Callback',
    function(Model, Http, Callback) {
        'use strict';

        var Country = augment(Model, function(parent) {
            /**
             * Country Constructor
             * @param  {row} resulted row from select statement
             */
            this.constructor = function(row) {
            	this._fields = ["name", "phoneCode"];
            	this._tableName = "Country";
                this._modelType = Country;
                parent.constructor.call(this, row);
            };


        });

        Country.FindAll = function (onSuccess, onError) {
            var http = new Http();
            http.get({
                url: "countries.json",
                model: Country,
                onSuccess: onSuccess,
                onError: onError
            });
        };

        return Country;
    }
]);