application.factory('Settings', [
    'Model', 'Http', 'Callback',
    function(Model, Http, Callback) {
        'use strict';

        var Settings = augment(Model, function(parent) {
            /**
             * Settings Constructor
             * @param  {row} resulted row from select statement
             */
            this.constructor = function(row) {
                this._fields = ["provider_timeout", "server_rate", "server_mode", "server_email", "e_number", "e_email"];
                this._tableName = "Settings";
                this._modelType = Settings;
                parent.constructor.call(this, row);
            }
        });

        Settings.SharedInstance = null;

        Settings.getInstance = function() {
            if (Settings.SharedInstance === null)
                Settings.SharedInstance = new Settings();

            return Settings.SharedInstance;
        }

        Settings.Download = function(onSuccess) {

            var onSettingsNotFound = new Callback(function () {
                Settings.SharedInstance = new Settings({server_rate: 10000});
                onSuccess.fire(Settings.SharedInstance);
            });

            var http = new Http();
            /*http.isLoading = false;*/
            http.get({
                url: CONFIG.SERVER.URL,
                model: Settings,
                params: {
                    start: true
                },
                onSuccess: new Callback(function(settings) {
                    Settings.SharedInstance = settings;
                    onSuccess.fire(settings);
                }),
                onFail: onSettingsNotFound,
                onError: onSettingsNotFound
            });
        };

        return Settings;
    }
]);