'use strict'

controllers.factory('Http', [
    'Callback', '$http', 'Error', '$ionicLoading',
    function(Callback, $http, Error, $ionicLoading) {

        var Http = augment.defclass({

            constructor: function() {
                this.isLoading = true;
                this.url = null;
                this.timeout = 10000;
            },
            service: function(serviceUrl) {
                this.url = CONFIG.SERVER.URL + serviceUrl;
                return this;
            },
            get: function(config) {
                var self = this;

                if (this.isLoading)
                    Http._showLoading();

                Http.Get({
                    url: config.url || this.url,
                    timeout: this.timeout,
                    model: config.model,
                    params: config.params,
                    onAnyResponse: new Callback(function() {
                        if (self.isLoading)
                            Http._hideLoading();
                        if (config.onAnyResponse) config.onAnyResponse.fire();
                    }),
                    onSuccess: config.onSuccess,
                    onFail: config.onFail,
                    onError: config.onError
                });

            },
            post: function(config) {
                var self = this;

                if (this.isLoading)
                    Http._showLoading();

                Http.Post({
                    url: config.url || this.url,
                    timeout: this.timeout,
                    model: config.model,
                    params: config.params,
                    onAnyResponse: new Callback(function() {
                        if (self.isLoading)
                            Http._hideLoading();
                        if (config.onAnyResponse) config.onAnyResponse.fire();
                    }),
                    onSuccess: config.onSuccess,
                    onFail: config.onFail,
                    onError: config.onError
                });

            }
        });

        
        Http._checkHttpResponse = function(data, config) {
            var parsedData = null;
            if (data.status === "SUCCESS") {
                if (config.model) {
                    if (data.result === null) {
                        parsedData = null;
                    } else if (Array.isArray(data.result)) {
                        parsedData = [];
                        for (var i = 0; i < data.result.length; i++) {
                            parsedData.push(new config.model(data.result[i]));
                        }
                    } else {
                        parsedData = new config.model(data.result);
                    }
                } else {
                    parsedData = data.result;
                }

                if (config.onSuccess) config.onSuccess.fire(parsedData, data.status, data.result, data);
            } else {
                
                if (config.onFail) config.onFail.fire(new Error(data.result || "Unkown error happened while connecting to server!", true, true), data.status, data.result, data);
            }
        };

        
        Http._onHttpError = function(config) {
            var error = new Error("Check your internet connectivity", true, true);
            if (config.onError) config.onError.fire(error);
        }

        Http._showLoading = function() {

            if (Http.IsLoading()) {
                $ionicLoading.show({
                    template: '<ion-spinner></ion-spinner>'
                });
            }
        }

        Http._hideLoading = function() {
            $ionicLoading.hide();
        }


        
        Http.Post = function(config) {

            if (!config.params) config.params = {};
            
            

            if (!config.headers) config.headers = {};
            for (var i = 0; i < Http.CommonHeaders.length; i++) {
                if (!config.headers) config.headers = {};
                config.headers[Http.CommonHeaders[i].name] = Http.CommonHeaders[i].value;
            }
            config.headers['Content-Type'] = 'application/json; charset=utf-8';

            //console.log('params posted to ' + config.url + ' are', config.params);
            $http({
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
                },
                transformRequest: function(obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                url: config.url,
                method: 'POST',
                data: config.params,
                timeout: config.timeout
            })
                .success(function(data, status, response) {
                    if (config.onAnyResponse) config.onAnyResponse.fire();
                    Http._checkHttpResponse(data, config);
                    
                    //console.log('params recevied from ' + config.url + ' are' + data);
                })
                .error(function() {
                    if (config.onAnyResponse) config.onAnyResponse.fire();
                    Http._onHttpError(config);
                    
                });
        };

        
        Http.Get = function(config) {
            
            //console.log('params get to ' + config.url + ' are', config.params);
            
            if (!config.params) config.params = {};
            

            if (!config.headers) config.headers = {};
            for (var i = 0; i < Http.CommonHeaders.length; i++) {
                if (!config.headers) config.headers = {};
                config.headers[Http.CommonHeaders[i].name] = Http.CommonHeaders[i].value;
            }
            config.headers['Content-Type'] = 'application/json; charset=utf-8';
            
            $http({
                headers: config.headers,
                url: config.url,
                method: 'GET',
                params: config.params,
                timeout: config.timeout
            })
                .success(function(data, status, response) {
                    //console.log('data recevied from ' + config.url + ' are' + JSON.stringify(data));
                    if (config.onAnyResponse) config.onAnyResponse.fire();
                    Http._checkHttpResponse(data, config);
                    

                })
                .error(function(e, s, h) {
                    
                    if (config.onAnyResponse) config.onAnyResponse.fire();
                    Http._onHttpError(config);
                    
                });
        };

        
        Http.Ping = function(onSuccess, onFail, domain) {
            var pingUrl = CONFIG.SERVER.URL;
            Http.Get({
                url: pingUrl,
                onSuccess: onSuccess,
                onError: onFail
            });
        }

        Http.CommonHeaders = [];

        Http.AddCommonHeader = function (name, value) {
            Http.CommonHeaders.push({name: name, value: value});
        };

        Http.Loading = true;
        Http.IsLoading = function(isLoading) {

            if (typeof isLoading !== "undefined")
                Http.Loading = isLoading;

            return Http.Loading;
        }

        return Http;


    }
]);