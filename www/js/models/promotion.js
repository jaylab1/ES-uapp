application.factory('Promotion', [
    'Model', 'Http',
    function(Model, Http) {
        'use strict';

        var Promotion = augment(Model, function(parent) {
            
            this.constructor = function(row) {
            	this._fields = ["name", "description", "image", "cta", "link"];
            	this._tableName = "Promotion";
                this._modelType = Promotion;
                parent.constructor.call(this, row);
            };
        });

        Promotion.FindAll = function (user, onSuccess, onError) {
            
            var http = new Http();
            http.get({
                url: CONFIG.SERVER.URL,
                model: Promotion,
                params: {
                    promo: true,
                    userId: user.id
                },
                onSuccess: onSuccess,
                onFail: onError,
                onError: onError
            });
        };

        return Promotion;
    }
]);