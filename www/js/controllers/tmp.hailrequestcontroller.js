controllers.controller('HailRequestController@request', [
    '$scope', '$state', '$stateParams', 'mapEngine', '$rootScope', 'Callback', 'User',
    'Geolocation', '$timeout', '$ionicPopup', 'HailRequest', 'Mode', 'Util', '$ionicLoading',
    '$ionicPopover', '$ionicHistory', 'Validator', '$ionicSideMenuDelegate', '$cordovaDialogs',
    function($scope, $state, $stateParams, mapEngine, $rootScope, Callback, User,
        Geolocation, $timeout, $ionicPopup, HailRequest, Mode, Util, $ionicLoading,
        $ionicPopover, $ionicHistory, Validator, $ionicSideMenuDelegate, $cordovaDialogs) {
        'use strict';

        var REQUEST_STATE = {
            INIT: 0,
            HAIL: 1,
            PICKUP: 2,
            MEETING_POINT: 2.5,
            CONFIRM_MEETING_POINT: 2.75,
            DROPOFF: 3,
            FAIR: 4
        };
        $scope.REQUEST_STATE = REQUEST_STATE;


        var fareConfirm = null,
            commentConfirm = null,
            meetingPointConfirm = null,
            dragDealer = null,
            pickmenuBorder = angular.element(document.getElementById("pickmenuBorder")),
            navBtn = null;

        $scope.requestState = REQUEST_STATE.INIT;
        $scope.request = new HailRequest();
        $scope.request.setMode(Mode.Find(Mode.ID.TAXI));

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

            if ($scope.requestState === REQUEST_STATE.INIT) {
                mapEngine.navigationInfoWindowLeftText("img/icons/info-hail.png");
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
            } else if ($scope.requestState === REQUEST_STATE.MEETING_POINT) {
                mapEngine.navigationInfoWindowRightText("MEETING POINT");
                mapEngine.navigationInfoWindowLeftText(null, $scope.request.nearestPoint.distance);
                /*mapEngine.getMap().setZoom(16);*/
            } else if ($scope.requestState === REQUEST_STATE.CONFIRM_MEETING_POINT) {
                mapEngine.navigationInfoWindowRightText("CONFIRM");
                mapEngine.navigationInfoWindowLeftText("img/icons/info-dropoff.png");
            } else if ($scope.requestState === REQUEST_STATE.DROPOFF) {
                mapEngine.navigationInfoWindowRightText("CONFIRM DROPOFF");
                mapEngine.navigationInfoWindowLeftText("img/icons/info-dropoff.png");
                navBack();
                pickmenuBorder.css("height", "75%");
                dragDealer.disable();
            } else if ($scope.requestState === REQUEST_STATE.FAIR) {
                mapEngine.navigationInfoWindowRightText("WAIT");
                navBack();
                dragDealer.disable();
            }

            $scope.$apply();
        };

        var rebuildSyncedRequest = function() {
            if ($stateParams.request !== null) {
                $scope.request = $stateParams.request;

                if ($scope.request.mode !== null) {

                    if ($scope.request.mode.id === Mode.ID.SERVISS)
                        dragDealer.setStep(1);
                    else if ($scope.request.mode.id === Mode.ID.SERVISS_PLUS)
                        dragDealer.setStep(2);
                    else if ($scope.request.mode.id === Mode.ID.TAXI)
                        dragDealer.setStep(3);
                } else {
                    $scope.request.setMode(Mode.Find(Mode.ID.SERVISS));
                }

                if ($scope.request.pickupLocation !== null)
                    $scope.requestState = REQUEST_STATE.PICKUP;
                else if ($scope.request.dropoffLocation !== null)
                    $scope.requestState = REQUEST_STATE.DROPOFF;



                updateView();
            }
        };

        var resetRequest = function() {
            if ($scope.request.nearestPointWatch) {
                console.log("nearestPointWatch", $scope.request.nearestPointWatch);
                $scope.request.nearestPointWatch.stopWatching();
            }
            mapEngine.gMapsInstance.removePolylines();
            $scope.requestState = REQUEST_STATE.INIT;
            $scope.request = new HailRequest();
            $scope.request.setMode(Mode.Find(Mode.ID.TAXI));
            dragDealer.setStep(3);
            mapEngine.getMap().setZoom(14);
            updateView();
        };

        $scope.onResetTapped = resetRequest;
        $scope.onNavTapped = function() {
            if ($scope.requestState === REQUEST_STATE.INIT)
                $ionicSideMenuDelegate.toggleLeft();
            else {
                resetRequest();
            }
        };

        var onNearbyCarsFound = new Callback(function(nearByCars) {
            if (!mapEngine.isReady) return;

            mapEngine.gMapsInstance.removeMarkers();
            for (var i = 0; i < nearByCars.length; i++) {
                var position = Geolocation.ParsePosition(nearByCars[i].car_location);
                mapEngine.addMarker(position.lat(), position.lng(), nearByCars[i].image);
            }
        });

        var initModeSelect = function() {
            $scope.step = 1;
            dragDealer = new Dragdealer('mode-select', {
                steps: 3,
                loose: true,
                tapping: true,
                callback: function(x, y) {
                    $scope.step = dragDealer.getStep()[0];
                    $scope.request.setMode(Mode.FromDragDealer($scope.step));
                    User.getInstance().findNearbyCars($scope.request.mode, onNearbyCarsFound);
                    $scope.$apply();
                }
            });
            dragDealer.reflow();
            dragDealer.setStep(3);

            User.getInstance().findNearbyCars($scope.request.mode, onNearbyCarsFound);
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

        $scope.onPickupLocationSelected = function(place) {

            if (!place.geometry) {
                $scope.request.pickupAddress = "";
            } else {
                onPlaceChanged(place);
                $scope.request.pickupLocation = place.geometry.location;
            }
            $scope.$apply();
        };

        $scope.onDropoffLocationSelected = function(place) {


            if (!place.geometry) {
                $scope.request.dropoffAddress = "";
            } else {
                onPlaceChanged(place);
                $scope.request.dropoffLocation = place.geometry.location;
                validateDropoffLocation($scope.request.dropoffLocation);
            }
            $scope.$apply();
        };

        //deprecated
        var initAutoCompleteServices = function() {
            var options = {
                componentRestrictions: {
                    country: "LB"
                }
            };
            var pickupInput = document.getElementById("pickup");
            var dropoffInput = document.getElementById("dropoff");
            var pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
            var dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInput, options);
            pickupAutocomplete.bindTo('bounds', mapEngine.getMap());
            dropoffAutocomplete.bindTo('bounds', mapEngine.getMap());
            var onPlaceChanged = function(place) {
                //if has no geomtry do nothing
                if (!place || !place.geometry)
                    return;
                //navigate to this place
                if (place.geometry.viewport) {
                    mapEngine.getMap().fitBounds(place.geometry.viewport);
                } else {
                    mapEngine.getMap().setCenter(place.geometry.location);
                    mapEngine.getMap().setZoom(17);
                }
            };
            //add listeners to place change event
            google.maps.event.addListener(pickupAutocomplete, 'place_changed', function() {
                var place = pickupAutocomplete.getPlace();
                if (!place.geometry) {
                    $scope.request.pickupAddress = "";
                } else {
                    onPlaceChanged(place);
                    $scope.request.pickupLocation = place.geometry.location;
                }
                $scope.$apply();
            });
            //add listeners to place change event
            google.maps.event.addListener(dropoffAutocomplete, 'place_changed', function() {
                var place = dropoffAutocomplete.getPlace();
                if (!place.geometry) {
                    $scope.request.dropoffAddress = "";
                } else {
                    onPlaceChanged(place);
                    $scope.request.dropoffLocation = place.geometry.location;
                    validateDropoffLocation($scope.request.dropoffLocation);
                }
                $scope.$apply();
            });
        };

        var initModesPopovers = function() {
            $ionicPopover.fromTemplateUrl('mode.popover.html', {
                scope: $scope
            }).then(function(popover) {
                $scope.openPopover = function(event, step) {
                    if (!step) step = $scope.step;

                    if (step === 1) {
                        $scope.passengers = 4;
                        $scope.fare = "1.66";
                    } else if (step === 2) {
                        $scope.passengers = 3;
                        $scope.fare = "2.66";
                    } else if (step === 3) {
                        $scope.passengers = 5;
                        $scope.fare = "4";
                    }

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

        mapEngine.ready(function() {
            /*window.addEventListener('native.keyboardhide', function () {
                mapEngine.gMapsInstance.refresh();
                dragDealer.setStep($scope.request.mode.getDragDealerStep());
                dragDealer.reflow();
            });*/
            /*initAutoCompleteServices();*/

            var onDestinationLocationChange = new Callback(function() {
                var g = new Geolocation();

                $rootScope.onProgress.fire();
                var locationLatLng = mapEngine.getCenter();
                g.latlngToAddress(locationLatLng, new Callback(function(address) {
                    console.log(address);
                    if (address.toUpperCase().indexOf("UNNAMED") > -1)
                        address = "No street name";

                    if ($scope.requestState === REQUEST_STATE.HAIL || $scope.requestState === REQUEST_STATE.PICKUP) { /*!$scope.request.pickupAddress || $scope.request.pickupAddress.trim().length === 0*/
                        $scope.request.pickupLocation = locationLatLng;
                        $scope.request.pickupAddress = address;
                        console.log($scope.request.pickupAddress);
                    } else if ($scope.requestState === REQUEST_STATE.DROPOFF) { /*!$scope.request.dropoffAddress || $scope.request.dropoffAddress.trim().length === 0*/
                        $scope.request.dropoffAddress = address;
                        $scope.request.dropoffLocation = locationLatLng;
                        validateDropoffLocation($scope.request.dropoffLocation);
                    }

                    $rootScope.onProgressDone.fire();
                    $scope.$apply();

                }), $rootScope.onError);
            });

            mapEngine.gMapsInstance.on("dragend", function() {
                if ($scope.requestState === REQUEST_STATE.PICKUP || $scope.requestState === REQUEST_STATE.DROPOFF)
                    onDestinationLocationChange.fire();
            });

            var onHailRequestPickedup = new Callback(function() {
                updateView();

                $scope.request.estimateCost(new Callback(function(cost) {

                    $scope.confirm = {
                        title: 'FAIRE ESTIMATION',
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
                                $scope.requestState = REQUEST_STATE.DROPOFF;
                                updateView();
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

                $scope.myLocationTapped = function() {
                    User.getInstance().findPosition(new Callback(function(position) {
                        mapEngine.addUserAccuracy(position.lat(), position.lng(), position.accuracy);
                        mapEngine.setCenter(position.lat(), position.lng());
                    }));
                };

                var g = new Geolocation();
                User.getInstance().findPosition(new Callback(function(position) {
                    mapEngine.addUserAccuracy(position.lat(), position.lng(), position.accuracy);
                    mapEngine.setCenter(position.lat(), position.lng());
                }), $rootScope.onError);

                mapEngine.navigationMarker(function() {
                    /*mapEngine.addCenterMarker();*/
                });
                mapEngine.navigationInfo(function() {

                    if ($scope.requestState === REQUEST_STATE.INIT) {
                        $scope.request.inService(new Callback(function() {
                            onDestinationLocationChange.fire();
                            $scope.requestState = REQUEST_STATE.PICKUP; //due to ux will compress the hail step to pickup
                            updateView();
                        }), $rootScope.onError);
                    } else if ($scope.requestState === REQUEST_STATE.HAIL) { //deprecated state
                        $scope.request.inService(new Callback(function() {
                            onDestinationLocationChange.fire();
                            $scope.requestState = REQUEST_STATE.PICKUP;
                            updateView();
                        }), $rootScope.onError);
                    } else if ($scope.requestState === REQUEST_STATE.PICKUP) {
                        $scope.request.inService(new Callback(function() {
                            if ($scope.request.mode.id === Mode.ID.SERVISS) {

                                $scope.request.validateServicePickup(new Callback(function(isNear) {

                                    if (isNear) {
                                        $scope.requestState = REQUEST_STATE.DROPOFF;
                                        updateView();
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
                                            console.log("wathcing meeting point", userPosition);
                                            mapEngine.setCenter(userPosition.lat(), userPosition.lng());
                                            mapEngine.drawRoute({
                                                origin: [userPosition.lat(), userPosition.lng()],
                                                destination: [$scope.request.nearestPoint.location.lat(), $scope.request.nearestPoint.location.lng()],
                                                travelMode: "driving",
                                                strokeColor: "#7EBBFE",
                                                strokeWeight: 7
                                            });
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
                                $scope.requestState = REQUEST_STATE.DROPOFF;
                                updateView();
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
                            $scope.$apply();
                        }));
                        $scope.requestState = REQUEST_STATE.DROPOFF;
                        updateView();
                    } else if ($scope.requestState === REQUEST_STATE.DROPOFF) {

                        var validator = new Validator();
                        if (validator.isNull($scope.request.dropoffLocation, "Please enter dropoff location first")) {
                            $rootScope.onError.fire(validator.getError());
                            return;
                        }

                        $scope.request.inService(new Callback(function() {
                            mapEngine.drawRoute({
                                origin: [$scope.request.pickupLocation.lat(), $scope.request.pickupLocation.lng()],
                                destination: [$scope.request.dropoffLocation.lat(), $scope.request.dropoffLocation.lng()],
                                travelMode: "driving",
                                strokeColor: "#7EBBFE",
                                strokeWeight: 7
                            });
                            /*mapEngine.getMap().setZoom(16);*/
                            $scope.requestState = REQUEST_STATE.FAIR;
                            onHailRequestPickedup.fire();
                            updateView();
                        }), $rootScope.onError);
                    }

                    $scope.$apply();
                });

                updateView();
                rebuildSyncedRequest();

            });

            $rootScope.ifLocationEnabled(onLocationEnabled);
        });

        $scope.$on('$destroy', function() {
            /*window.addEventListener('native.keyboardhide', function() {});*/
        });

    }
]);

controllers.controller('HailRequestController@confirmed', [
    '$scope', '$state', '$stateParams', 'mapEngine', 'User', '$rootScope', 'Callback',
    'Util', 'Geolocation',
    function($scope, $state, $stateParams, mapEngine, User, $rootScope, Callback,
        Util, Geolocation) {
        'use strict';

        var confirmedScrollElem = angular.element(document.getElementById("confirmedScroll")),
            infoElem = angular.element(document.getElementById("info")),
            geolocation = new Geolocation();

        $scope.request = $stateParams.request;
        $scope.infoState = 1;

        /*$scope.request.driver.findRating(new Callback(function (rating) {
            $scope.$apply();
        }), $rootScope.onError);*/

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
                    }, $scope.driver.DriverPhone, null, function() {});
                } else if (action === 'CALL') {
                    plugins.CallNumber.callNumber(function() {}, function(e) {
                        $rootScope.onError.fire(new Error(e, true, true));
                    }, $scope.driver.DriverPhone);
                }

            }, function() {});
        };

        $scope.onShareEtaTapped = function() {
            var POST_MESSAGE = Util.String("Get Eserviss app at http://eserviss.com/app");
            var POST_TITLE = "Eserviss";

            plugins.socialsharing.share(POST_MESSAGE, POST_TITLE);
        };

        var initSync = function() {
            $scope.request.sync(User.getInstance(), new Callback(function() {
                $scope.$apply();
            }), $rootScope.onError);

            $scope.request.onDroppedoff = new Callback(function() {
                $scope.request.consumeCost(User.getInstance(), new Callback(function() {
                    $state.go("menu.receipt", {
                        request: $scope.request
                    });
                }), $rootScope.onError);

            });
        };
        initSync();

        var onLocationEnabled = new Callback(function() {
            User.getInstance().findPosition(new Callback(function(position) {
                //mapEngine.addMarker(position.lat(), position.lng() - 0.005, "img/icons/pin-car.png");
                mapEngine.addUserAccuracy(position.lat(), position.lng(), position.accuracy
                    /*, {
                    info: '1:05<br>AM'
                }*/
                );
                mapEngine.setCenter(position.lat(), position.lng());
            }), $rootScope.onError);

            mapEngine.drawRoute({
                origin: [$scope.request.pickupLocation.lat(), $scope.request.pickupLocation.lng()],
                destination: [$scope.request.dropoffLocation.lat(), $scope.request.dropoffLocation.lng()],
                travelMode: "driving",
                strokeColor: "#7EBBFE",
                strokeWeight: 7
            });


            geolocation.watch(new Callback(function(position) {
                mapEngine.addUserAccuracy(position.lat(), position.lng(), position.accuracy);
                mapEngine.setCenter(position.lat(), position.lng());
            }));
        });

        mapEngine.ready(function() {
            $rootScope.ifLocationEnabled(onLocationEnabled);
        });

        $scope.$on('$destroy', function() {
            geolocation.stopWatching();
        });

    }
]);

controllers.controller('HailRequestController@receipt', [
    '$scope', '$state', '$stateParams', 'Validator', '$rootScope', 'Callback',
    '$ionicHistory', 'User', '$cordovaDialogs',
    function($scope, $state, $stateParams, Validator, $rootScope, Callback,
        $ionicHistory, User, $cordovaDialogs) {
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

        User.getInstance().findCredit(new Callback(function(credit) {
            if (credit.cash < $scope.request.totalCost) {
                $cordovaDialogs.alert("Please pay the trip cost to the driver", 'Trip Cost');
            } else {
                User.getInstance().subtractCredit($scope.request.totalCost, new Callback(function() {
                    $cordovaDialogs.alert("Your trip cost has been charged from your balance", 'Trip Cost');
                }), $rootScope.onError);
            }

        }), $rootScope.onError);

        $scope.onSubmitTapped = function(receipt) {

            var validator = new Validator();
            if (validator.isEmpty(receipt.rating, "Please insert rating first in your feedback") ||
                validator.isEmpty(receipt.comment, "Please insert comment first in your feedback")) {
                $rootScope.onError.fire(validator.getError());
                return;
            }

            $scope.request.feedback(User.getInstance(), $scope.receipt.rating, $scope.receipt.comment, new Callback(function() {
                $state.go("menu.hailrequest");
            }), $rootScope.onError);

        };


    }
]);