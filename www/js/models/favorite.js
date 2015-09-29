application.factory('Favorite', [
    'Model', 'Http',
    function(Model, Http) {
        'use strict';

        var Favorite = augment(Model, function(parent) {
            /**
             * Favorite Constructor
             * @param  {row} resulted row from select statement
             */
            this.constructor = function(row) {
                this._fields = ["name", "res", "lat", "lng", "address", "user_id"];
                this._tableName = "Favorite";
                this._modelType = Favorite;
                parent.constructor.call(this, row);

                var self = this;
                this.location = {
                    lat: function() {
                        return self.lat;
                    },
                    lng: function() {
                        return self.lng;
                    }
                };
            };

            this.save = function(onSuccess, onError) {
                console.log(this);
                var http = new Http();
                http.get({
                    url: CONFIG.SERVER.URL,
                    model: Favorite,
                    params: {
                        edit_favourites: true,
                        id: this.id,
                        lat: this.location.lat(),
                        lng: this.location.lng(),
                        res: '',
                        address: this.address,
                        name: this.name
                    },
                    onSuccess: onSuccess,
                    onFail: onError,
                    onError: onError
                });
            };
        });

        Favorite.FindAll = function(user, onSuccess, onError) {
            var http = new Http();
            http.get({
                url: CONFIG.SERVER.URL,
                model: Favorite,
                params: {
                    get_favourites: true,
                    userId: user.id
                },
                onSuccess: onSuccess,
                onFail: onError,
                onError: onError
            });
        };

        return Favorite;
    }
]);