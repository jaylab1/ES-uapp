controllers.controller('HailRequestController@request', [
    '$scope', '$state', '$stateParams', 'mapEngine', '$rootScope', 'Callback', 'User',
    'Geolocation', '$timeout', '$ionicPopup', 'HailRequest', 'Mode', 'Util', '$ionicLoading',
    '$ionicPopover', '$ionicHistory', 'Validator', '$ionicSideMenuDelegate', '$cordovaDialogs',
    'Http', 'Settings',
    function($scope, $state, $stateParams, mapEngine, $rootScope, Callback, User,
        Geolocation, $timeout, $ionicPopup, HailRequest, Mode, Util, $ionicLoading,
        $ionicPopover, $ionicHistory, Validator, $ionicSideMenuDelegate, $cordovaDialogs,
        Http, Settings) {
        'use strict';

        var REQUEST_STATE = {
            INIT: 0,
            HAIL: 1,
            REQUEST_CAB: 1.5,
            FARE_ESTIMATION: 1.75,
            PICKUP: 2,
            DROPOFF: 3,
            MEETING_POINT: 3.5,
            CONFIRM_MEETING_POINT: 3.75,
            FARE: 4
        };
        $scope.REQUEST_STATE = REQUEST_STATE;


        var fareConfirm = null,
            commentConfirm = null,
            meetingPointConfirm = null,
            dragDealer = null,
            pickmenuBorder = angular.element(document.getElementById("pickmenuBorder")),
            navBtn = null,
            adsPopup = null;

        $scope.requestState = REQUEST_STATE.INIT;

        $scope.request = new HailRequest();


        $scope.input = {};

        var openCommentPopup = function() {
            $scope.onSubmitTapped = function(comment) {
                var loadingUpdateTimeout = null;
                $scope.request.comment = comment;
                commentConfirm.close();

                $ionicLoading.show({
                    template: 'Matching you with a driver now...'
                });

                loadingUpdateTimeout = $timeout(function() {
                    $ionicLoading.show({
                        template: 'Search for more cars...'
                    });
                }, 30000);

                $scope.request.make(User.getInstance(), new Callback(function(driver) {
                    if (loadingUpdateTimeout) {
                        console.log("loadingUpdateTimeout", loadingUpdateTimeout);
                        $timeout.cancel(loadingUpdateTimeout);
                        loadingUpdateTimeout = null;
                    }
                    $ionicLoading.hide();
                    $ionicHistory.nextViewOptions({
                        disableBack: true
                    });
                    $ionicHistory.clearCache();
                    $state.go("menu.requestconfirmed", {
                        request: $scope.request
                    });

                }), new Callback(function(e) {

                    if (loadingUpdateTimeout) {
                        $timeout.cancel(loadingUpdateTimeout);
                        loadingUpdateTimeout = null;
                    }
                    $ionicLoading.hide();

                    $rootScope.onError.fire(e);
                }));
            };

            $scope.onCloseTapped = function() {
                if ($scope.request.mode.isTaxi())
                    $scope.requestState = REQUEST_STATE.FARE_ESTIMATION;
                else
                    $scope.requestState = REQUEST_STATE.REQUEST_CAB;
                updateView();
                commentConfirm.close();
            };

            $scope.confirm = {
                message: "Send a Note About Your Location So Driver Can Find You Quicker",
                buttons: {
                    isSubmit: true,
                    submit: "CONFIRM HAIL"
                },
                input: {
                    data: $scope.request.comment,
                    placeholder: "I am next to beirut municipality entrance",
                    isAllowed: true
                }
            };

            $timeout(function() {
                commentConfirm = $ionicPopup.alert({
                    templateUrl: "templates/confirm.popup.html",
                    cssClass: "eserviss-confirm text-center",
                    scope: $scope
                });
            }, 500);
        };

        var initAds = function() {

            if (!CONFIG.IS_ADS_SHOWN) {
                CONFIG.IS_ADS_SHOWN = true;

                var http = new Http();
                http.isLoading = false;
                http.get({
                    url: CONFIG.SERVER.URL,
                    params: {
                        ads: true
                    },
                    onSuccess: new Callback(function(r) {
                        var ad = r[0];
                        $scope.onCloseTapped = function() {
                            adsPopup.close();
                        };

                        var cssClass = "eserviss-alert eserviss-ads text-center";
                        cssClass = ad.image.length > 0 ? (cssClass + " has-img") : cssClass;

                        $scope.ad = ad;
                        adsPopup = $ionicPopup.confirm({
                            templateUrl: "templates/ads.popup.html",
                            cssClass: cssClass,
                            scope: $scope
                        });
                    })
                });
            }
        };

        var updateView = function() {
            var navBack = function() {
                navBtn = angular.element(document.getElementById("navBtn"));
                navBtn.removeClass("ion-navicon");
                navBtn.addClass("ion-arrow-left-c");
            };

            var navMenu = function() {
                navBtn = angular.element(document.getElementById("navBtn"));
                navBtn.removeClass("ion-arrow-left-c");
                navBtn.addClass("ion-navicon");
            };

            if (dragDealer) {
                if ($scope.request.mode) {
                    dragDealer.setStep($scope.request.mode.getDragDealerStep());
                    var modeActiveIconElem = angular.element(document.getElementById("mode-active-icon"));
                    modeActiveIconElem.attr("src", $scope.request.mode.icon);
                } else {
                    console.log("no request");
                    dragDealer.setStep(Mode.All.length);
                }


            }


            if (mapEngine.navigationInfoWindow && dragDealer) {

                if (Settings.getInstance().nearby_thread.toUpperCase() === "NO" && Settings.getInstance().nearby_pin) {
                    mapEngine.navigationInfoWindowLeftText(Settings.getInstance().nearby_pin);
                }

                if ($scope.requestState === REQUEST_STATE.INIT) {
                    if (Settings.getInstance().nearby_pin) {
                        mapEngine.navigationInfoWindowLeftText(Settings.getInstance().nearby_pin);
                    } else {
                        mapEngine.navigationInfoWindowLeftText("img/icons/info-hail.png");
                    }
                    mapEngine.navigationInfoWindowRightText("HAIL");
                    navMenu();
                    dragDealer.enable();
                } else if ($scope.requestState === REQUEST_STATE.HAIL) {
                    mapEngine.navigationInfoWindowRightText("SET PICKUP");
                    mapEngine.navigationInfoWindowLeftText("img/icons/info-pickup.png");
                    navBack();
                    dragDealer.disable();
                } else if ($scope.requestState === REQUEST_STATE.PICKUP) {
                    mapEngine.navigationInfoWindowRightText("CONFIRM PICKUP");

                    mapEngine.navigationInfoWindowLeftText("img/icons/info-pickup.png");
                    pickmenuBorder.css("height", "50%");
                    navBack();
                    dragDealer.disable();
                } else if ($scope.requestState === REQUEST_STATE.REQUEST_CAB) {
                    mapEngine.navigationInfoWindowRightText("REQUEST CAB");
                    navBack();
                    dragDealer.disable();
                } else if ($scope.requestState === REQUEST_STATE.MEETING_POINT) {
                    mapEngine.navigationInfoWindowRightText("MEETING POINT");
                    mapEngine.navigationInfoWindowLeftText(null, $scope.request.nearestPoint.distance);
                    
                } else if ($scope.requestState === REQUEST_STATE.CONFIRM_MEETING_POINT) {
                    mapEngine.navigationInfoWindowRightText("CONFIRM");
                    mapEngine.navigationInfoWindowLeftText("img/icons/info-dropoff.png");
                } else if ($scope.requestState === REQUEST_STATE.DROPOFF) {
                    mapEngine.navigationInfoWindowRightText("CONFIRM DROPOFF");
                    mapEngine.navigationInfoWindowLeftText("img/icons/info-dropoff.png");
                    navBack();
                    pickmenuBorder.css("height", "75%");
                    dragDealer.disable();
                } else if ($scope.requestState === REQUEST_STATE.FARE) {
                    mapEngine.navigationInfoWindowRightText("WAIT");
                    navBack();
                    dragDealer.disable();
                }

                
            }

            if (ionic.Platform.isAndroid()) $scope.$apply();
        };


        Mode.FindAll(new Callback(function(modes) {
            $scope.request.setMode(modes[0]);
            updateView();
            $scope.modes = modes;
        }));




        var rebuildSyncedRequest = function() {
            if ($stateParams.request !== null) {
                $scope.request = $stateParams.request;

                if ($scope.request.mode === null) {
                    // $scope.request.setMode(Mode.FindById(Mode.ID.SERVISS));
                    Mode.FindAll(new Callback(function(modes) {
                        $scope.request.setMode(modes[0]);
                    }));
                }

                if ($scope.request.pickupLocation !== null) {
                    $scope.input.pickup = $scope.request.pickupPlace;
                    mapEngine.setCenter($scope.request.pickupLocation.lat(), $scope.request.pickupLocation.lng());

                    if ($scope.request.mode.isTaxi() || $scope.request.mode.isFree())
                        $scope.requestState = REQUEST_STATE.REQUEST_CAB;
                    else
                        $scope.requestState = REQUEST_STATE.PICKUP;
                } else if ($scope.request.dropoffLocation !== null)
                    $scope.requestState = REQUEST_STATE.DROPOFF;

                console.log($scope.requestState);

                $timeout(updateView, 100);

                
            }
        };

        var resetRequest = function() {
            if ($scope.request.nearestPointWatch) {

                $scope.request.nearestPointWatch.stopWatching();
            }
            mapEngine.gMapsInstance.removePolylines();
            $scope.requestState = REQUEST_STATE.INIT;
            $scope.request = new HailRequest();
            $scope.request.setMode(Mode.FindById(Mode.ID.TAXI));
            // dragDealer.setStep(3);
            mapEngine.getMap().setZoom(14);
            updateView();
        };

        $scope.onResetTapped = resetRequest;
        $scope.onNavTapped = function() {
            if ($scope.requestState <= REQUEST_STATE.HAIL)
                $ionicSideMenuDelegate.toggleLeft();
            else {
                resetRequest();
            }
        };

        var onNearbyCarsFound = new Callback(function(nearByCars) {
            if (!mapEngine.isReady) return;

            mapEngine.gMapsInstance.removeMarkers();

            if (!nearByCars || nearByCars.length === 0) {
                if (Settings.getInstance().nearby_pin) {
                    mapEngine.navigationInfoWindowLeftText(Settings.getInstance().nearby_pin);
                }
                return;
            }

            for (var i = 0; i < nearByCars.length; i++) {
                if (nearByCars[i].car_location) {
                    var position = Geolocation.ParsePosition(nearByCars[i].car_location);
                    mapEngine.addMarker(position.lat(), position.lng(), nearByCars[i].image);
                }
            }
            if (nearByCars.length > 0)
                mapEngine.navigationInfoWindowLeftText(null, nearByCars[0].time + "min");
        });
        User.getInstance().onNearbyCarsFound = onNearbyCarsFound;

        var initModeSelect = function() {
            console.log("initModeSelect");
            // $scope.step = 1;
            dragDealer = new Dragdealer('mode-select', {
                steps: $scope.modes.length,
                loose: true,
                tapping: true,
                callback: function(x, y) {
                    $scope.step = dragDealer.getStep()[0];
                    $scope.request.setMode(Mode.FromDragDealer($scope.step));
                    User.getInstance().nearbyMode = $scope.request.mode;
                    
                    var modeActiveIconElem = angular.element(document.getElementById("mode-active-icon"));
                    modeActiveIconElem.attr("src", $scope.request.mode.icon);
                    if (ionic.Platform.isAndroid()) $scope.$apply();
                }
            });
            $timeout(function() {
                dragDealer.reflow();
                var modeActiveIconElem = angular.element(document.getElementById("mode-active-icon"));
                modeActiveIconElem.attr("src", $scope.request.mode.icon);
            }, 1000);


            Mode.FindAll(new Callback(function(modes) {
                dragDealer.setStep($scope.request.mode.getDragDealerStep());
                var modeActiveIconElem = angular.element(document.getElementById("mode-active-icon"));
                modeActiveIconElem.attr("src", $scope.request.mode.icon);
                console.log(modeActiveIconElem);
                User.getInstance().findNearbyCars($scope.request.mode, null, onNearbyCarsFound);
            }));

        };

        var validateDropoffLocation = function(dropoffLocation) {
            if (dropoffLocation === null)
                $rootScope.onError.fire(new Error("You can't set a dropoff location more than 10 KM"));
        };

        var onPlaceChanged = function(place) {
            //if has no geomtry do nothing
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
        //user for new google places component
        var googlePlaceSelectEvent = null;

        $scope.onPickupLocationSelected = function(place) {

            if (!place.geometry) {
                $scope.request.pickupAddress = "";
            } else {
                onPlaceChanged(place);
                $scope.request.pickupLocation = place.geometry.location;
                $scope.request.pickupAddress = place.formatted_address;
            }
            if (ionic.Platform.isAndroid()) $scope.$apply();
        };

        $scope.onDropoffLocationSelected = function(place) {


            if (!place.geometry) {
                $scope.request.dropoffAddress = "";
            } else {
                onPlaceChanged(place);
                $scope.request.dropoffLocation = place.geometry.location;
                $scope.request.dropoffAddress = place.formatted_address;
                validateDropoffLocation($scope.request.dropoffLocation);
            }
            if (ionic.Platform.isAndroid()) $scope.$apply();
        };

        $scope.$on('$ionicView.leave', function() {
            if (googlePlaceSelectEvent) googlePlaceSelectEvent();
        });

        $scope.$on('$ionicView.enter', function() {
            googlePlaceSelectEvent = $scope.$on("g-places-autocomplete:select", function(event, place) {
                if ($scope.requestState === REQUEST_STATE.PICKUP)
                    $scope.onPickupLocationSelected(place);
                else if ($scope.requestState === REQUEST_STATE.DROPOFF)
                    $scope.onDropoffLocationSelected(place);
            });
        });

        var initModesPopovers = function() {
            $ionicPopover.fromTemplateUrl('mode.popover.html', {
                scope: $scope
            }).then(function(popover) {
                $scope.openPopover = function(event, step) {
                    if (!step) step = $scope.step;
                    popover.show(event);
                };

                $scope.$on('$destroy', function() {
                    popover.remove();
                });
            });


        };

        initModeSelect();
        initModesPopovers();

        $scope.onRequestPlusTapped = function() {
            if ($scope.request.passengers < $scope.request.mode.maxPassengers)
                $scope.request.passengers++;
        };

        $scope.onRequestMinusTapped = function() {
            if ($scope.request.passengers > 1)
                $scope.request.passengers--;
        };

        $scope.onPickupTapped = function() {
            $state.go("menu.pickuplocations", {
                request: $scope.request
            });
        };

        mapEngine.ready(function() {

            var onDestinationLocationChange = new Callback(function() {
                var g = new Geolocation();

                $rootScope.onProgress.fire();
                var locationLatLng = mapEngine.getCenter();
                g.latlngToAddress(locationLatLng, new Callback(function(address, place) {
                    if (address.toUpperCase().indexOf("UNNAMED") > -1)
                        address = "No street name";

                    if ($scope.requestState === REQUEST_STATE.HAIL || $scope.requestState === REQUEST_STATE.PICKUP || $scope.requestState === REQUEST_STATE.REQUEST_CAB || $scope.requestState === REQUEST_STATE.FARE_ESTIMATION) { 
                        $scope.request.pickupLocation = locationLatLng;
                        $scope.request.pickupAddress = address;
                        $scope.input.pickup = place;

                    } else if ($scope.requestState === REQUEST_STATE.DROPOFF) { 
                        $scope.request.dropoffAddress = address;
                        $scope.request.dropoffLocation = locationLatLng;
                        $scope.input.dropoff = place;
                        validateDropoffLocation($scope.request.dropoffLocation);
                    }

                    $rootScope.onProgressDone.fire();
                    if (ionic.Platform.isAndroid()) $scope.$apply();

                }), $rootScope.onError);
            });

            //if not comming from pickup locations
            if (!($stateParams.request && $stateParams.request.pickupPlace) && $scope.requestState == REQUEST_STATE.REQUEST_CAB)
                onDestinationLocationChange.fire();

            mapEngine.gMapsInstance.on("dragend", function() {
                if ($scope.request.mode) {
                    if (Settings.getInstance().drag_thread.toUpperCase() === "YES")
                        User.getInstance().findNearbyCars($scope.request.mode, mapEngine.getCenter(), onNearbyCarsFound);
                    // mapEngine.navigationInfoWindowLeftText(null, $scope.request.mode.etaTime + "min");
                }

                if ($scope.requestState === REQUEST_STATE.PICKUP || $scope.requestState === REQUEST_STATE.DROPOFF || $scope.requestState === REQUEST_STATE.REQUEST_CAB)
                    onDestinationLocationChange.fire();
            });

            var onHailRequestPickedup = new Callback(function() {
                mapEngine.drawRoute({
                    origin: [$scope.request.pickupLocation.lat(), $scope.request.pickupLocation.lng()],
                    destination: [$scope.request.dropoffLocation.lat(), $scope.request.dropoffLocation.lng()],
                    travelMode: "driving",
                    strokeColor: "#7EBBFE",
                    strokeWeight: 7
                });
                $scope.requestState = REQUEST_STATE.FARE;
                updateView();

                $scope.request.estimateCost(new Callback(function(cost) {

                    $scope.confirm = {
                        title: 'FARE ESTIMATION',
                        message: Util.String("{0} USD for {1}", [cost, $scope.request.mode.name]),
                        buttons: {
                            isSubmit: false,
                            yes: "CONFIRM",
                            no: "CANCEL",
                            promotePositive: true
                        }
                    };

                    $scope.onNoTapped = function() {
                        fareConfirm.close();
                        resetRequest();
                    };
                    $scope.onYesTapped = function() {
                        fareConfirm.close();

                        $scope.onSubmitTapped = function(comment) {
                            $scope.request.comment = comment;
                            commentConfirm.close();
                            $ionicLoading.show({
                                template: 'Matching you with a Driver now!'
                            });
                            $scope.request.make(User.getInstance(), new Callback(function(driver) {
                                mapEngine.gMapsInstance.off("dragend");
                                $ionicLoading.hide();
                                $ionicHistory.clearCache();
                                $state.go("menu.requestconfirmed", {
                                    request: $scope.request
                                });

                            }), new Callback(function(e) {
                                $rootScope.onError.fire(e);
                                
                                resetRequest();
                            }));
                        };

                        $scope.confirm = {
                            message: "Send a Note About Your Location So Driver Can Find You Quicker",
                            buttons: {
                                isSubmit: true
                            },
                            input: {
                                data: $scope.request.comment,
                                placeholder: "I am next to beirut municipality entrance",
                                isAllowed: true
                            }
                        };

                        $timeout(function() {
                            commentConfirm = $ionicPopup.confirm({
                                templateUrl: "templates/confirm.popup.html",
                                cssClass: "eserviss-confirm text-center",
                                scope: $scope
                            });
                        }, 500);


                    };

                    fareConfirm = $ionicPopup.confirm({
                        templateUrl: "templates/confirm.popup.html",
                        cssClass: "eserviss-confirm text-center",
                        scope: $scope
                    });

                }), new Callback(function(e) {
                    $rootScope.onError.fire(e);
                    $scope.requestState = REQUEST_STATE.DROPOFF;
                    updateView();
                }));
            });

            var onLocationEnabled = new Callback(function() {

                initAds();

                $scope.myLocationTapped = function() {
                    User.getInstance().findPosition(new Callback(function(position) {
                        mapEngine.addUserAccuracy(position.lat(), position.lng(), position.accuracy);
                        mapEngine.setCenter(position.lat(), position.lng());
                        if ($scope.requestState === REQUEST_STATE.PICKUP || $scope.requestState === REQUEST_STATE.DROPOFF || $scope.requestState === REQUEST_STATE.REQUEST_CAB)
                            onDestinationLocationChange.fire();
                    }));
                };

                var g = new Geolocation();
                User.getInstance().findPosition(new Callback(function(position) {
                    mapEngine.addUserAccuracy(position.lat(), position.lng(), position.accuracy);
                    mapEngine.setCenter(position.lat(), position.lng());
                    rebuildSyncedRequest();
                }), $rootScope.onError);

                mapEngine.navigationMarker(function() {
                    
                });
                mapEngine.navigationInfo(function() {

                    if ($scope.requestState === REQUEST_STATE.INIT) {
                        $scope.request.inService(new Callback(function() {
                            onDestinationLocationChange.fire();
                            if ($scope.request.mode.isTaxi() || $scope.request.mode.isFree()) {
                                
                                $scope.requestState = REQUEST_STATE.REQUEST_CAB;
                            } else {
                                $scope.requestState = REQUEST_STATE.PICKUP; //due to ux will compress the hail step to pickup
                            }
                            updateView();

                        }), $rootScope.onError);
                    } else if ($scope.requestState === REQUEST_STATE.PICKUP) {
                        $scope.request.inService(new Callback(function() {

                            $scope.requestState = REQUEST_STATE.DROPOFF;
                            updateView();

                        }), $rootScope.onError);
                    } else if ($scope.requestState === REQUEST_STATE.REQUEST_CAB) {
                        $scope.request.inService(new Callback(function() {
                            onDestinationLocationChange.fire();
                            $scope.requestState = REQUEST_STATE.FARE_ESTIMATION;
                            openCommentPopup();
                            updateView();
                            

                        }), $rootScope.onError);
                    } else if ($scope.requestState === REQUEST_STATE.FARE_ESTIMATION) {
                        $scope.request.inService(new Callback(function() {
                            onDestinationLocationChange.fire();
                            openCommentPopup();
                            updateView();
                        }), $rootScope.onError);
                    } else if ($scope.requestState === REQUEST_STATE.DROPOFF) {

                        var validator = new Validator();
                        if (validator.isNull($scope.request.dropoffLocation, "Please enter dropoff location first")) {
                            $rootScope.onError.fire(validator.getError());
                            return;
                        }

                        $scope.request.inService(new Callback(function() {
                            if ($scope.request.mode.id === Mode.ID.SERVISS) {

                                $scope.request.validateServicePickup(new Callback(function(isNear) {

                                    if (isNear) {
                                        onHailRequestPickedup.fire();
                                        return;
                                    }

                                    $scope.confirm = {
                                        title: 'MEETING POINT',
                                        message: $scope.request.nearestPoint.message,
                                        buttons: {
                                            isSubmit: false,
                                            yes: "ACCEPT",
                                            no: "CHOOSE TAXI",
                                        }
                                    };

                                    $scope.onNoTapped = function() {
                                        meetingPointConfirm.close();
                                        resetRequest();
                                    };

                                    $scope.onYesTapped = function() {
                                        var nearestPointImg = angular.element(document.getElementById("meetingpointImg"));
                                        meetingPointConfirm.close();
                                        $scope.requestState = REQUEST_STATE.MEETING_POINT;
                                        updateView();
                                        $scope.request.nearestPoint.header.line[0] = " START WALKING TOWARDS MEETING POINT NOW";
                                        nearestPointImg.css("vertical-align", "middle");
                                        $scope.request.watchToMeetingPoint(new Callback(function(userPosition) {
                                            mapEngine.drawRoute({
                                                origin: [userPosition.lat(), userPosition.lng()],
                                                destination: [$scope.request.nearestPoint.location.lat(), $scope.request.nearestPoint.location.lng()],
                                                travelMode: "walking",
                                                strokeColor: "#7EBBFE",
                                                strokeWeight: 7
                                            });
                                            mapEngine.setCenter($scope.request.nearestPoint.location.lat(), $scope.request.nearestPoint.location.lng());
                                        }), new Callback(function() {
                                            $scope.request.nearestPoint.header.line[0] = "YOU HAVE REACHED YOUR MEETING POINT!";
                                            $scope.request.nearestPoint.header.line[1] = "PLEASE CONFIRM YOUR RIDE REQUEST";

                                            nearestPointImg.css("vertical-align", "top");
                                            $scope.requestState = REQUEST_STATE.CONFIRM_MEETING_POINT;
                                            updateView();
                                        }), new Callback(function() {
                                            $scope.request.nearestPoint.header.line[0] = "YOU ARE CLOSE TO MEETING POINT";
                                            nearestPointImg.css("vertical-align", "middle");
                                        }, 1), $rootScope.onError);
                                    };

                                    meetingPointConfirm = $ionicPopup.confirm({
                                        templateUrl: "templates/confirm.popup.html",
                                        cssClass: "eserviss-confirm text-center",
                                        scope: $scope
                                    });



                                }), $rootScope.onError);

                            } else {
                                onHailRequestPickedup.fire();
                            }

                        }), $rootScope.onError);
                    } else if ($scope.requestState === REQUEST_STATE.MEETING_POINT) {
                        $cordovaDialogs.alert("Eserviss is wathcing your position until you reach the meeting point", 'Meeting Point');
                    } else if ($scope.requestState === REQUEST_STATE.CONFIRM_MEETING_POINT) {
                        mapEngine.gMapsInstance.removePolylines();
                        $scope.request.pickupLocation = $scope.request.nearestPoint.location.toLatLng();
                        var g = new Geolocation();
                        g.latlngToAddress($scope.request.pickupLocation, new Callback(function(address) {
                            $scope.request.pickupAddress = address;
                            if (ionic.Platform.isAndroid()) $scope.$apply();
                        }));
                        onHailRequestPickedup.fire();
                    }

                    if (ionic.Platform.isAndroid()) $scope.$apply();
                });

                updateView();


            });

            $rootScope.ifLocationEnabled(onLocationEnabled);
        });

        $scope.$on('$destroy', function() {
            
        });

    }
]);

controllers.controller('HailRequestController@confirmed', [
    '$scope', '$state', '$stateParams', 'mapEngine', 'User', '$rootScope', 'Callback',
    'Util', 'Geolocation', '$cordovaDialogs', '$ionicHistory', '$timeout', 'HailRequest',
    function($scope, $state, $stateParams, mapEngine, User, $rootScope, Callback,
        Util, Geolocation, $cordovaDialogs, $ionicHistory, $timeout, HailRequest) {
        'use strict';

        var confirmedScrollElem = angular.element(document.getElementById("confirmedScroll")),
            infoElem = angular.element(document.getElementById("info")),
            geolocation = new Geolocation();

        var MARKER_ID = {
            USER: 1,
            MODE: 2
        };

        $scope.request = $stateParams.request;
        $scope.infoState = 1;

        //unlock app
        localStorage.removeItem(HailRequest.HAIL_LOCK);

        

        $scope.onCloseTapped = function() {
            if ($scope.infoState === 1) { //if driver info shown
                confirmedScrollElem.removeClass('slideOutDown');
                confirmedScrollElem.removeClass('slideInDown');
                confirmedScrollElem.addClass('slideOutDown');
                infoElem.css("height", "auto");
                $scope.infoState = 0;
            } else if ($scope.infoState === 0) { //if driver info hidden
                confirmedScrollElem.removeClass('slideOutDown');
                confirmedScrollElem.removeClass('slideInDown');
                confirmedScrollElem.addClass('slideInDown');
                infoElem.css("height", "50%");
                $scope.infoState = 1;
            }
        };

        $scope.onContactTapped = function() {

            plugins.listpicker.showPicker({
                title: "Contact Driver",
                items: [{
                    text: "Send a Message",
                    value: "MESSAGE"
                }, {
                    text: "Call Driver",
                    value: "CALL"
                }]
            }, function(action) {
                if (action === 'MESSAGE') {
                    plugins.socialsharing.shareViaSMS({
                        message: ''
                    }, $scope.request.driver.DriverPhone, null, function() {});
                } else if (action === 'CALL') {
                    plugins.CallNumber.callNumber(function() {}, function(e) {
                        $rootScope.onError.fire(new Error(e, true, true));
                    }, $scope.request.driver.DriverPhone);
                }

            }, function() {});
        };

        $scope.onShareEtaTapped = function() {
            var POST_MESSAGE = Util.String("Get Eserviss app at http://eserviss.com/app");
            var POST_TITLE = "Eserviss";

            plugins.socialsharing.share(POST_MESSAGE, POST_TITLE);
        };

        var initSync = function() {
            $scope.request.onEtaArrival = new Callback(function(etaArrival) {
                var PADDING_BOTTOM = 0.02;

                if ($scope.request.stage === HailRequest.STAGE.RESPONSE) {

                    var carLocation = etaArrival.car_location ? Geolocation.ParsePosition(etaArrival.car_location) : null;
                    if (!carLocation) {
                        mapEngine.addMarker(User.getInstance().position.lat(), User.getInstance().position.lng(), etaArrival.user_pin, MARKER_ID.USER);
                        mapEngine.setCenter(User.getInstance().position.lat(), User.getInstance().position.lng() + PADDING_BOTTOM);
                    } else {
                        mapEngine.infoBubble(carLocation.lat(), carLocation.lng(), etaArrival.display);
                        mapEngine.addMarker(User.getInstance().position.lat(), User.getInstance().position.lng() + PADDING_BOTTOM, etaArrival.user_pin, MARKER_ID.USER);
                        mapEngine.setCenter(carLocation.lat(), carLocation.lng() + PADDING_BOTTOM);

                        if (User.getInstance().position.calculateDistance(carLocation) <= 100) {
                            mapEngine.setZoom(15);
                        } else {
                            mapEngine.fitMap(carLocation, User.getInstance().position);
                        }

                    }
                } else {
                    mapEngine.removeInfoBubble();
                    mapEngine.setCenter(User.getInstance().position.lat(), User.getInstance().position.lng());
                }
                // mapEngine.addUserAccuracy(User.getInstance().position.lat(), User.getInstance().position.lng(), User.getInstance().position.accuracy, others);

            });

            $scope.request.sync(User.getInstance(), new Callback(function() {
                if ($scope.request.stage === HailRequest.STAGE.PICKUP && $scope.request.getDropoffLocation()) {
                    mapEngine.addMarker($scope.request.getDropoffLocation().lat(), $scope.request.getDropoffLocation().lng(), $scope.request.mode.icon, MARKER_ID.MODE);
                }

                if (ionic.Platform.isAndroid()) $scope.$apply();

            }), $rootScope.onError);


            $scope.request.onPickedup = new Callback(function() {
                mapEngine.addMarker($scope.request.getDropoffLocation().lat(), $scope.request.getDropoffLocation().lng(), $scope.request.getDropoffLocation());
            });

            $scope.request.onDroppedoff = new Callback(function() {
                geolocation.stopWatching();
                if ($scope.request.mode.isFree()) {
                    $state.go("menu.freereceipt", {
                        request: $scope.request
                    });
                } else {
                    $state.go("menu.receipt", {
                        request: $scope.request
                    });
                }


            });

            $scope.request.onDriverCanceled = new Callback(function() {

                $cordovaDialogs.alert("Driver didn't find you, the ride has been canceled", 'Ride Canceled')
                    .then(function() {
                        $ionicHistory.nextViewOptions({
                            disableBack: true
                        });
                        $ionicHistory.clearCache();
                        mapEngine.resetMap();
                        $timeout(function() {
                            $state.go("menu.hailrequest");
                        }, 50);
                    });
            });
        };
        initSync();

        var onLocationEnabled = new Callback(function() {
            User.getInstance().findPosition(new Callback(function(position) {
                mapEngine.addUserAccuracy(position.lat(), position.lng(), position.accuracy);
                mapEngine.setCenter(position.lat(), position.lng());
            }), $rootScope.onError);

            if ($scope.request.dropoffLocation && $scope.request.dropoffLocation.lat() && $scope.request.dropoffLocation.lng()) {
                mapEngine.drawRoute({
                    origin: [$scope.request.pickupLocation.lat(), $scope.request.pickupLocation.lng()],
                    destination: [$scope.request.dropoffLocation.lat(), $scope.request.dropoffLocation.lng()],
                    travelMode: "driving",
                    strokeColor: "#7EBBFE",
                    strokeWeight: 7
                });
            }


            geolocation.watch(new Callback(function(position) {
                User.getInstance().position = position;
                mapEngine.addUserAccuracy(position.lat(), position.lng(), position.accuracy);
            }));
        });



        $scope.$on('$ionicView.leave', function() {
            geolocation.stopWatching();
            $scope.request.isSyncable = false;
            
            mapEngine.resetMap();
            User.getInstance().onNearbyCarsFound = null;
        });

        $scope.$on('$ionicView.enter', function() {
            mapEngine.ready(function() {
                // onLocationEnabled.fire();
                $rootScope.ifLocationEnabled(onLocationEnabled);
            });
        });

    }
]);

controllers.controller('HailRequestController@receipt', [
    '$scope', '$state', '$stateParams', 'Validator', '$rootScope', 'Callback',
    '$ionicHistory', 'User', '$cordovaDialogs', '$timeout',
    function($scope, $state, $stateParams, Validator, $rootScope, Callback,
        $ionicHistory, User, $cordovaDialogs, $timeout) {
        'use strict';

        $ionicHistory.nextViewOptions({
            disableBack: true
        });

        var today = new Date();
        $scope.date = {
            day: today.getDate(),
            month: today.toDateString().split(' ')[1],
            year: today.getFullYear()
        };

        $scope.request = $stateParams.request;
        $scope.receipt = {};

        

        var consumeCost = function() {
            $scope.request.consumeCost(User.getInstance(), new Callback(function() {
                $cordovaDialogs.alert("Your trip cost has been charged from your balance", 'Trip Cost');
            }), $rootScope.onError);
        };

        $scope.request.findFare(User.getInstance(), new Callback(function() {
            console.log("fare is", $scope.request.fare);
            User.getInstance().findCredit(new Callback(function(userBalance) {
                var toCharge = Math.ceil($scope.request.fare - userBalance.cash);
                if (toCharge > 0) {
                    User.getInstance().recharge(toCharge, new Callback(consumeCost), new Callback(function (e) {
                        $rootScope.onError.fire(e);
                        consumeCost();
                    }));
                } else {
                    consumeCost();
                }
            }), new Callback(consumeCost));
        }), new Callback(consumeCost));




        $scope.onSubmitTapped = function(receipt) {

            var validator = new Validator();
            if (validator.isEmpty(receipt.rating, "Please insert rating first in your feedback") ||
                validator.isEmpty(receipt.comment, "Please insert comment first in your feedback")) {
                $rootScope.onError.fire(validator.getError());
                return;
            }

            $scope.request.feedback(User.getInstance(), $scope.receipt.rating, $scope.receipt.comment, new Callback(function() {
                $ionicHistory.clearCache();
                $timeout(function() {
                    $state.go("menu.hailrequest", {}, {
                        reload: true
                    });
                    
                }, 50);
            }), $rootScope.onError);

        };


    }
]);

controllers.controller('HailRequestController@freereceipt', [
    '$scope', '$state', '$stateParams', 'Validator', '$rootScope', 'Callback',
    '$ionicHistory', 'User', '$cordovaDialogs', '$timeout', 'HailRequest', 'Geolocation',
    '$cordovaInAppBrowser',
    function($scope, $state, $stateParams, Validator, $rootScope, Callback,
        $ionicHistory, User, $cordovaDialogs, $timeout, HailRequest, Geolocation,
        $cordovaInAppBrowser) {
        'use strict';

        $ionicHistory.nextViewOptions({
            disableBack: true
        });

        var today = new Date();
        $scope.date = {
            day: today.getDate(),
            month: today.toDateString().split(' ')[1],
            year: today.getFullYear()
        };
        $scope.request = $stateParams.request;

        var g = new Geolocation();
        g.findPosition(new Callback(function(dropoffLocation) {
            HailRequest.EstimateCost(1, $scope.request.pickupLocation, dropoffLocation, new Callback(function(totalCost) {
                $scope.totalCost = totalCost;
            }));
        }));

        $scope.onCancelTapped = function() {
            $ionicHistory.clearCache();
            $timeout(function() {
                $state.go("menu.hailrequest", {}, {
                    reload: true
                });
                
            }, 50);
        };

        $scope.onReviewTapped = function() {
            var options = {
                location: 'yes',
                clearcache: 'yes',
                toolbar: 'no'
            };

            var url = "http://leb.cab";
            if (ionic.Platform.isIOS())
                url = "https://itunes.apple.com/us/app/eserviss-taxi.-service-bus/id1024534126?ls=1&mt=8";

            $cordovaInAppBrowser.open(url, '_blank', options)
                .then(function(event) {

                    $ionicHistory.clearCache();
                    $timeout(function() {
                        $state.go("menu.hailrequest", {}, {
                            reload: true
                        });
                    }, 50);
                });


        };


    }
]);

controllers.controller('HailRequestController@pickuplocations', [
    '$scope', '$state', '$stateParams', '$ionicHistory', '$timeout', 'User', 'Callback', '$rootScope',
    'Util',
    function($scope, $state, $stateParams, $ionicHistory, $timeout, User, Callback, $rootScope,
        Util) {
        'use strict';

        $scope.request = $stateParams.request;
        var googlePlaceSelectEvent = null;

        $ionicHistory.nextViewOptions({
            disableBack: true
        });

        $scope.onLocationSelected = function(place) {
            var location = place.geometry.location;
            $scope.request.pickupLocation = location;
            $scope.request.pickupPlace = place;
        };

        

        User.getInstance().findFavorites(new Callback(function(favorites) {
            favorites = favorites.splice(0, 4);

            var homeFavorite = favorites[0];

            var workFavorite = favorites[1];

            $scope.onAddHomeTapped = function() {
                if (homeFavorite && homeFavorite.location.lat() && homeFavorite.location.lng()) {
                    $scope.request.pickupLocation = homeFavorite.location;
                    $scope.onDoneTapped();
                } else {
                    $rootScope.onError.fire(new Error("You don't have a home favorite added"));
                }
            };

            $scope.onAddWorkTapped = function() {
                if (workFavorite && workFavorite.location.lat() && workFavorite.location.lng()) {
                    $scope.request.pickupLocation = workFavorite.location;
                    $scope.onDoneTapped();
                } else {
                    $rootScope.onError.fire(new Error("You don't have a work favorite added"));
                }
            };
        }), $rootScope.onError);

        $scope.$on('$ionicView.leave', function() {
            if (googlePlaceSelectEvent) googlePlaceSelectEvent();
        });

        $scope.$on('$ionicView.enter', function() {
            googlePlaceSelectEvent = $scope.$on("g-places-autocomplete:select", function(event, place) {
                $scope.onLocationSelected(place);
                $scope.request.pickupAddress = place.formatted_address;
            });
        });


        $scope.onDoneTapped = function() {
            if ($ionicHistory.backView().stateName === "menu.hailrequest") {
                $ionicHistory.clearCache();
                $timeout(function() {
                    $ionicHistory.backView().stateParams.request = $scope.request;
                    $ionicHistory.goBack();
                }, 50);
            } else {
                $ionicHistory.goBack();
            }
        };
    }
]);

controllers.controller('HailRequestController@estimationfee', [
    '$scope', '$state', '$stateParams', '$ionicHistory', '$timeout',
    'Callback', '$rootScope',
    function($scope, $state, $stateParams, $ionicHistory, $timeout,
        Callback, $rootScope) {
        'use strict';

        var googlePlaceSelectEvent = null;

        $scope.request = $stateParams.request;

        $ionicHistory.nextViewOptions({
            disableBack: true
        });

        $scope.onLocationSelected = function(place) {
            var location = place.geometry.location;
            $scope.request.dropoffLocation = location;
            $scope.request.estimateCost(null, $rootScope.onError);
        };

        $scope.onDoneTapped = function() {
            if ($ionicHistory.backView().stateName === "menu.hailrequest") {
                $ionicHistory.clearCache();
                $timeout(function() {
                    $ionicHistory.backView().stateParams.request = $scope.request;
                    $ionicHistory.goBack();
                }, 50);
            } else {
                $ionicHistory.goBack();
            }
        };

        $scope.$on('$ionicView.leave', function() {
            if (googlePlaceSelectEvent) googlePlaceSelectEvent();
        });

        $scope.$on('$ionicView.enter', function() {
            googlePlaceSelectEvent = $scope.$on("g-places-autocomplete:select", function(event, place) {
                $scope.request.dropoffAddress = place.formatted_address;
                $scope.onLocationSelected(place);
            });
        });
    }
]);

controllers.controller('HailRequestController@sendnote', [
    '$scope', '$state', '$stateParams', '$ionicHistory', '$timeout',
    'Callback', '$rootScope', 'User', '$ionicLoading', 'HailRequest',
    'Mode',
    function($scope, $state, $stateParams, $ionicHistory, $timeout,
        Callback, $rootScope, User, $ionicLoading, HailRequest,
        Mode) {
        'use strict';

        $scope.request = $stateParams.request;
        var loadingUpdateTimeout = null;

        $ionicHistory.nextViewOptions({
            disableBack: true
        });

        $scope.onConfirmTapped = function() {
            $ionicLoading.show({
                template: 'Matching you with a driver now...'
            });

            loadingUpdateTimeout = $timeout(function() {
                $ionicLoading.show({
                    template: 'Search for more cars...'
                });
            }, 30000);

            $scope.request.make(User.getInstance(), new Callback(function(driver) {
                if (loadingUpdateTimeout) {
                    console.log("loadingUpdateTimeout", loadingUpdateTimeout);
                    $timeout.cancel(loadingUpdateTimeout);
                    loadingUpdateTimeout = null;
                }
                $ionicLoading.hide();
                $ionicHistory.clearCache();
                $state.go("menu.requestconfirmed", {
                    request: $scope.request
                });

            }), new Callback(function(e) {
                if (loadingUpdateTimeout) {
                    $timeout.cancel(loadingUpdateTimeout);
                    loadingUpdateTimeout = null;
                }
                $ionicLoading.hide();

                $rootScope.onError.fire(e, new Callback(function() {

                    $scope.request = new HailRequest();
                    $scope.request.setMode(Mode.FindById(Mode.ID.TAXI));
                    $ionicHistory.clearCache();
                    $timeout(function() {
                        $state.go("menu.hailrequest", {
                            request: $scope.request
                        });
                    }, 50);

                }));
            }));
        };
    }
]);

controllers.controller('HailRequestController@cancelride', [
    '$scope', '$state', '$stateParams', 'Callback', '$rootScope',
    'Validator', '$timeout', '$ionicHistory',
    function($scope, $state, $stateParams, Callback, $rootScope,
        Validator, $timeout, $ionicHistory) {
        'use strict';
        $scope.request = $stateParams.request;
        $scope.cancel = {};

        $ionicHistory.nextViewOptions({
            disableBack: true
        });

        $scope.onCancelTapped = function() {
            var validator = new Validator();
            validator.isNull($scope.cancel.reason, "Please enter a valid reason first");
            if (!validator.isPassed()) {
                $rootScope.onError.fire(validator.getError());
                return;
            }


            $scope.request.cancelRide($scope.cancel.reason, new Callback(function() {
                $ionicHistory.clearCache();
                $timeout(function() {
                    $state.go("menu.hailrequest");
                }, 50);
            }), $rootScope.onError);
        };




    }
]);
