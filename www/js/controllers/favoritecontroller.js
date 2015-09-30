controllers.controller('FavoriteController@favorties', [
    '$scope', '$state', '$stateParams', 'User', 'Callback', '$rootScope',
    function($scope, $state, $stateParams, User, Callback, $rootScope) {
        'use strict';

        User.getInstance().findFavorites(new Callback(function(favorites) {
            $scope.favorites = favorites.splice(0, 4);
        }), $rootScope.onError);

        $scope.onFavoriteTapped = function(favorite, i) {
            console.log(favorite, i);
            $state.go("menu.addfavorite", {
                mode: i,
                favorite: favorite
            });
        };

    }
]);

controllers.controller('FavoriteController@addfavorite', [
    '$scope', '$state', '$stateParams', 'Favorite', 'Validator', 'mapEngine',
    'Callback', 'User', '$rootScope', 'Geolocation', '$cordovaDialogs',
    function($scope, $state, $stateParams, Favorite, Validator, mapEngine,
        Callback, User, $rootScope, Geolocation, $cordovaDialogs) {
        'use strict';

        $scope.mode = $stateParams.mode;
        $scope.favorite = $stateParams.favorite;

        $scope.onSetLocationTapped = function(favorite) {
            var validator = new Validator();
            validator.isEmpty(favorite.name, "Please enter a valid name", "addfavorite-name");
            validator.isEmpty(favorite.address, "Please enter a valid address", "addfavorite-address");
            validator.isNull(favorite.location, "Please enter a valid location", "addfavorite-address");

            if (!validator.isPassed()) {
                $rootScope.onError.fire(validator.getError());
                return;
            }

            $scope.favorite.save(new Callback(function() {
                $cordovaDialogs.alert('Favorite is saved successfuly', 'Favorite')
                    .then(function() {
                        $state.go("menu.favorites");
                    });
            }), $rootScope.onError);
        };

        var onLocationEnabled = new Callback(function() {

            $scope.myLocationTapped = function() {
                User.getInstance().findPosition(new Callback(function(position) {
                    mapEngine.addUserAccuracy(position.lat(), position.lng(), position.accuracy);
                    mapEngine.setCenter(position.lat(), position.lng());
                }));
            };

            mapEngine.navigationMarker(function() {});

            User.getInstance().findPosition(new Callback(function(position) {
                mapEngine.addUserAccuracy(position.lat(), position.lng(), position.accuracy);
                mapEngine.setCenter(position.lat(), position.lng());

                mapEngine.gMapsInstance.on("dragend", function() {

                    var g = new Geolocation();

                    $rootScope.onProgress.fire();
                    var locationLatLng = mapEngine.getCenter();
                    g.latlngToAddress(locationLatLng, new Callback(function(address) {

                        if (address.toUpperCase().indexOf("UNNAMED") > -1)
                            address = "No street name";

                        $scope.favorite.address = address;
                        $scope.favorite.location = locationLatLng;

                        $rootScope.onProgressDone.fire();
                        $scope.$apply();

                    }), $rootScope.onError);
                });
            }), $rootScope.onError);
        });

        mapEngine.ready(function() {
            if ($scope.favorite.location.lat() && $scope.favorite.location.lng()) {
                mapEngine.setCenter($scope.favorite.location.lat(), $scope.favorite.location.lng());
            }
            $rootScope.ifLocationEnabled(onLocationEnabled);
        });

        $scope.onAddressSelected = function(place) {
            if (!place || !place.geometry)
                return;
            //navigate to this place
            if (place.geometry.viewport) {
                mapEngine.getMap().fitBounds(place.geometry.viewport);
            } else {
                mapEngine.getMap().setCenter(place.geometry.location);
            }
            mapEngine.getMap().setZoom(17);
        };

        $scope.$on('$destroy', function() {
            mapEngine.gMapsInstance.off("dragend");
        });

    }
]);