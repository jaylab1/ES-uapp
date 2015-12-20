controllers.controller('FavoriteController@favorties', [
    '$scope', '$state', '$stateParams', 'User', 'Callback', '$rootScope',
    function($scope, $state, $stateParams, User, Callback, $rootScope) {
        'use strict';

        //find user favorites 
        User.getInstance().findFavorites(new Callback(function(favorites) {
            $scope.favorites = favorites.splice(0, 4);
        }), $rootScope.onError);

        /**
         * on favorite tapped: go to favorite page with this favorite selected
         * @param  {Favorite} favorite selected favorite
         * @param  {Integer} i        index of the favorite selected
         */
        $scope.onFavoriteTapped = function(favorite, i) {
            //go the navigation to add favorite page
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
        //mode of the favorite (home - work - others)
        $scope.mode = $stateParams.mode;
        //favorite to show
        $scope.favorite = $stateParams.favorite;
        //bind the input here
        $scope.input = {};
        //event of selecting place from google places
        var googlePlaceSelectEvent = null;

        /**
         * on set this location to my favorite tapped
         * @param  {Favorite} favorite with info updated
         */
        $scope.onSetLocationTapped = function(favorite) {
            //validate the input
            var validator = new Validator();
            validator.isEmpty(favorite.name, "Please enter a valid name", "addfavorite-name");
            validator.isEmpty(favorite.address, "Please enter a valid address", "addfavorite-address");
            validator.isNull(favorite.location, "Please enter a valid location", "addfavorite-address");

            if (!validator.isPassed()) {
                $rootScope.onError.fire(validator.getError());
                return;
            }

            //save online the new favorite
            $scope.favorite.save(new Callback(function() {
                $cordovaDialogs.alert('Favorite is saved successfuly', 'Favorite')
                    .then(function() {
                        $state.go("menu.favorites");
                    });
            }), $rootScope.onError);
        };

        //wait until location is enabled
        var onLocationEnabled = new Callback(function() {
            //after leaving this view
            $scope.$on('$ionicView.leave', function() {
                //off the google places event
                if (googlePlaceSelectEvent) googlePlaceSelectEvent();
            });

            //on entering this view
            $scope.$on('$ionicView.enter', function() {
                //register google places auto complete event
                googlePlaceSelectEvent = $scope.$on("g-places-autocomplete:select", function(event, place) {
                    $scope.onAddressSelected(place);
                });
            });

            /**
             * on my location button tapped
             */
            $scope.myLocationTapped = function() {
                //get current user position and center map to it
                User.getInstance().findPosition(new Callback(function(position) {
                    mapEngine.addUserAccuracy(position.lat(), position.lng(), position.accuracy);
                    mapEngine.setCenter(position.lat(), position.lng());
                }));
            };

            //init set center the navigation marker
            mapEngine.navigationMarker(function() {});

            //find user position
            User.getInstance().findPosition(new Callback(function(position) {

                //on map drag end
                mapEngine.gMapsInstance.on("dragend", function() {
                    //change location to text address and bind it
                    var g = new Geolocation();

                    $rootScope.onProgress.fire();
                    var locationLatLng = mapEngine.getCenter();
                    g.latlngToAddress(locationLatLng, new Callback(function(address, place) {

                        if (address.toUpperCase().indexOf("UNNAMED") > -1)
                            address = "No street name";

                        $scope.favorite.address = address;
                        $scope.favorite.location = locationLatLng;
                        $scope.input.place = place; // bind to input to show on the view

                        $rootScope.onProgressDone.fire();
                        if (ionic.Platform.isAndroid()) $scope.$apply();

                    }), $rootScope.onError);
                });
            }), $rootScope.onError);
        });
        
        //on map is ready
        mapEngine.ready(function() {
            //center the map to the selected favorite location
            if ($scope.favorite.location.lat() && $scope.favorite.location.lng()) {
                mapEngine.setCenter($scope.favorite.location.lat(), $scope.favorite.location.lng());
            }
            $rootScope.ifLocationEnabled(onLocationEnabled);
        });

        /**
         * on address selected from google places
         * @param  {JSON} place from google places service
         */
        $scope.onAddressSelected = function(place) {
            if (!place || !place.geometry)
                return;
            //navigate to this place on the map
            if (place.geometry.viewport) {
                mapEngine.getMap().fitBounds(place.geometry.viewport);
            } else {
                mapEngine.getMap().setCenter(place.geometry.location);
            }
            //set map zoom to 17 to focus this place
            mapEngine.getMap().setZoom(17);

            //bind the location and address to the view
            $scope.favorite.location = place.geometry.location;
            $scope.favorite.address = place.formatted_address;
        };

        //on scope is being destroyed
        $scope.$on('$destroy', function() {
            mapEngine.gMapsInstance.off("dragend");
        });

    }
]);