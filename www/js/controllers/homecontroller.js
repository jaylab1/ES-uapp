controllers.controller('HomeController@splash', [
    '$scope', '$state', '$stateParams', '$ionicHistory', '$ionicPlatform', '$cordovaDialogs',
    '$rootScope', 'Callback', 'Geolocation', '$ionicModal', '$timeout', 'Settings', '$ionicLoading',
    function($scope, $state, $stateParams, $ionicHistory, $ionicPlatform, $cordovaDialogs,
        $rootScope, Callback, Geolocation, $ionicModal, $timeout, Settings, $ionicLoading) {
        'use strict';

    }
]);

controllers.controller('HomeController@landing', [
    '$scope', '$state', '$stateParams', '$translate', '$ionicPlatform', '$cordovaDialogs',
    '$rootScope', 'Callback', 'Geolocation', '$ionicModal', '$timeout', 'Settings', '$ionicLoading',
    'User', '$ionicHistory', 'Mode',
    function($scope, $state, $stateParams, $translate, $ionicPlatform, $cordovaDialogs,
        $rootScope, Callback, Geolocation, $ionicModal, $timeout, Settings, $ionicLoading,
        User, $ionicHistory, Mode) {
        'use strict';

        $rootScope.onError = new Callback(function(e) {
            $cordovaDialogs.alert(e.message, 'Note');
        });

        $rootScope.onProgress = new Callback(function() {
            $ionicLoading.show({
                template: '<ion-spinner></ion-spinner>'
            });
        });

        $rootScope.onProgressDone = new Callback(function() {
            $ionicLoading.hide();
        });

        $rootScope.ifLocationEnabled = function(onEnabled, onNotEnabled) {
            var locationoffModal = null;

            /*onEnabled.fire();
            return;*/

            var g = new Geolocation();
            g.isLocationEnabled(new Callback(function(isEnabled) {
                if (isEnabled)
                    onEnabled.fire();
                else {

                    if (locationoffModal !== null) {
                        locationoffModal.show();
                        return;
                    }

                    $ionicModal
                        .fromTemplateUrl("templates/locationoff.modal.html", {
                            scope: $scope,
                            animation: 'slide-in-up'
                        })
                        .then(function(modal) {
                            locationoffModal = modal;

                            modal.show();
                            $scope.onTurnOnLocationTapped = function() {
                                modal.hide();
                                g.openLocationSettings();
                                if (onNotEnabled) onNotEnabled.fire();
                                //reset last action in 7 secs
                                $timeout(function() {
                                    $rootScope.ifLocationEnabled(onEnabled, onNotEnabled);
                                }, 7000);
                            };
                        });
                }

            }), $rootScope.onError);
        };

        $rootScope.$on('$cordovaPush:notificationReceived', function(event, notification) {
            if (ionic.Platform.isAndroid()) {
                switch (notification.event) {
                    case 'registered':
                        if (notification.regid.length > 0) {
                            User.getInstance().registerPushNotification(notification.regid);
                        }
                        break;

                    case 'message':
                        // this is the actual push notification. its format depends on the data model from the push server
                        $cordovaDialogs.alert(notification.message, 'Message!');
                        break;

                    case 'error':
                        //alert('GCM error = ' + notification.msg);
                        break;

                    default:
                        //alert('An unknown GCM event has occurred');
                        break;
                }

            } else if (ionic.Platform.isIOS()) {
                if (notification.alert) {
                    $cordovaDialogs.alert(notification.alert, 'Message!');
                }
            }
        });

        /*$state.go("menu.requestconfirmed");
        return;*/

        Settings.Download(new Callback(function() {
            $rootScope.onContactUs = function() {
                $cordovaDialogs.confirm("Need Help? Don't hesitate to call us now", 'Customer Support', ['Call', 'Cancel'])
                    .then(function(buttonIndex) {
                        var btnIndex = buttonIndex;
                        if (btnIndex === 1) {
                            plugins.CallNumber.callNumber(function() {}, function(e) {
                                $rootScope.onError.fire(new Error("Error while contacting customer support, try again later", true, true));
                            }, Settings.getInstance().e_number);
                        }
                    });
            };
        }));

        if (User.IsStored()) {

            $ionicHistory.nextViewOptions({
                disableBack: true
            });

            Mode.FindAll(new Callback(function() {
                User.getInstance().signin(new Callback(function() {
                    User.getInstance().store();
                    User.InitPushNotification();
                    User.getInstance().ping();
                    User.getInstance().sync(new Callback(function(request) { //on progress
                        $state.go('menu.hailrequest', {
                            request: request
                        });
                    }), new Callback(function(request) { // on confirmed
                        $state.go('menu.requestconfirmed', {
                            request: request
                        });
                    }), new Callback(function() { //no old synced data
                        $state.go('menu.hailrequest');
                    }), $rootScope.onError);

                }), null, $rootScope.onError);
            }), $rootScope.onError)

        }

        var languageConfig = {
            title: "Select a Language",
            items: [{
                text: "English",
                value: "en"
            }, {
                text: "Arabic",
                value: "ar"
            }],
            doneButtonLabel: "Done",
            cancelButtonLabel: "Cancel"
        };





        $scope.onLanguageTapped = function() {
            if (typeof cordova === 'undefined') {
                $translate.use('en');
                $state.go("authenticate");
                return;
            }

            plugins.listpicker.showPicker(languageConfig, function(lang) {
                if (lang === 'en')
                    $scope.language = 'ENGLISH';
                else if (lang === 'ar')
                    $scope.language = 'العربية';

                $translate.use(lang);

                $state.go("authenticate");
            }, function() {});
        };

    }
]);

controllers.controller('HomeController@sidemenu', [
    '$scope', '$state', '$stateParams', '$ionicHistory', '$timeout', '$cordovaDialogs',
    'Settings', '$rootScope', 'Error',
    function($scope, $state, $stateParams, $ionicHistory, $timeout, $cordovaDialogs,
        Settings, $rootScope, Error) {
        'use strict';

        /*console.log($ionicViewSwitcher);
        $ionicViewSwitcher.nextTransition('none');*/
        $scope.menuWidth = window.innerWidth;

        /*$scope.goTo = function(stateName) {
            $ionicHistory.nextViewOptions({
                disableAnimate: true
            });
            $state.go(stateName);
        };*/

        $scope.onBackTapped = function() {
            if ($ionicHistory.backView().stateName === "menu.hailrequest") {
                $ionicHistory.clearCache();
                $timeout($ionicHistory.goBack, 50);
            } else {
                $ionicHistory.goBack();
            }
        };

        /*$scope.onCustomerSupportTapped = function() {
            $cordovaDialogs.confirm("Need Help? Don't hesitate to call us now", 'Customer Support', ['Call', 'Cancel'])
                .then(function(buttonIndex) {
                    var btnIndex = buttonIndex;
                    if (btnIndex === 1) {
                        plugins.CallNumber.callNumber(function() {}, function(e) {
                            $rootScope.onError.fire(new Error("Error while contacting customer support, try again later", true, true));
                        }, Settings.getInstance().e_number);
                    }
                });
        };*/
    }
]);