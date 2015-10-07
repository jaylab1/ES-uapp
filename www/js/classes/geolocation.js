controllers.factory('Geolocation', [
    'Error', 'Util',
    function(Error, Util) {
        'use strict'
        var Geolocation = augment.defclass({

            constructor: function() {
                this.watchId = null;
            },
            latlngToAddress: function(position, onSuccess, onFail) {
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({
                    'latLng': position
                }, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results[0]) {
                            onSuccess.fire(results[0].formatted_address);
                        } else {
                            onFail.fire("No results found");
                        }
                    } else {
                        onFail.fire("Geocoder failed due to: " + status);
                    }
                });
            },
            isLocationEnabled: function(onSuccess, onFail) {
                cordova.plugins.diagnostic.isLocationEnabledSetting(function(isEnabled) {
                    onSuccess.fire(isEnabled);
                }, function(e) {
                    onFail.fire(new Error(e, true, true));
                });
            },
            openLocationSettings: function() {
                cordova.plugins.diagnostic.switchToLocationSettings();
            },
            findPosition: function(onSuccess, onError) {
                navigator.geolocation.getCurrentPosition(function(r) {
                    var position = Geolocation.ParsePosition(r.coords);

                    if (onSuccess) onSuccess.fire(position);
                }, function(e) {
                    if (onError) onError.fire(new Error("Can not initialize service no gps data! change your location!", true, true));

                }, {
                    timeout: 10000,
                    enableHighAccuracy: true
                });
            },
            watch: function(onSuccess, onError) {
                this.watchId = navigator.geolocation.watchPosition(function (r) {
                    var position = Geolocation.ParsePosition(r.coords);
                    onSuccess.fire(position);
                }, function () {
                    if (onError) onError.fire(new Error("Failed to find your position, maybe you are in a building."));
                }, {
                    enableHighAccuracy: true
                });

            },
            stopWatching: function() {
                navigator.geolocation.clearWatch(this.watchId);
            }
        });

        Geolocation.ParsePosition = function(coords) {
            var parsedCoords = null;

            if (Util.IsString(coords)) {
                var lat = coords.split(',')[0];
                var lng = coords.split(',')[1];

                parsedCoords = {
                    latitude: lat.length > 0 ? parseFloat(lat) : null,
                    longitude: lng.length > 0 ? parseFloat(lng) : null,
                    accuracy: null
                };
            } else if (Util.IsFunction(coords.lat) && Util.IsFunction(coords.lng)) {
                parsedCoords = {
                    latitude: coords.lat(),
                    longitude: coords.lng(),
                    accuracy: coords.accuracy || null
                };
            } else if (coords.latitude && coords.longitude) {
                parsedCoords = coords;
            } else {
                return null;
            }

            var position = {
                toLatLng: function() {
                    return (new google.maps.LatLng(parsedCoords.latitude, parsedCoords.longitude));                       
                },
                lat: function() {
                    return parsedCoords.latitude;
                },
                lng: function() {
                    return parsedCoords.longitude;
                },
                calculateDistance: function (pos) {
                    pos = Geolocation.ParsePosition(pos);
                    var distance = google.maps.geometry.spherical.computeDistanceBetween(this.toLatLng(), pos.toLatLng());
                    return distance;
                },
                accuracy: parsedCoords.accuracy
            };

            return position;
        };

        return Geolocation;


    }
]);