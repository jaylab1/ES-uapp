controllers.controller('UserController@signin', [
    '$scope', '$state', '$stateParams', '$rootScope', 'Callback', 'User',
    '$ionicHistory', '$ionicPopup', 'Validator', '$translate', 'Mode',
    function($scope, $state, $stateParams, $rootScope, Callback, User,
        $ionicHistory, $ionicPopup, Validator, $translate, Mode) {
        'use strict';

        var popupConfirmPhone = null,
            popupConfirmCode = null;

        $scope.login = {};
        /*$scope.login = {
            email: 'heshamhossam57@gmail.com',
            password: '123456'
        };*/

        Mode.FindAll();

        $scope.onLoginTapped = function(login) {
            var validator = new Validator();
            validator.isEmpty(login.email, "Please enter your email address", "login-email");
            validator.isEmpty(login.password, "Please enter your password", "login-password");

            if (!validator.isPassed()) {
                $rootScope.onError.fire(validator.getErrorBlock());
                return;
            }


            User.getInstance().email = login.email;
            User.getInstance().password = login.password;
            User.getInstance().signin(new Callback(function() {
                User.InitPushNotification();
                $ionicHistory.nextViewOptions({
                    disableBack: true
                });
                User.getInstance().store();
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

            }), new Callback(function(mobileNumber) {
                $scope.confirm = {
                    alert: true,
                    message: "YOU CAN NOT LOGIN VERIFY YOUR NUMBER FIRST!",
                    buttons: {
                        isSubmit: true
                    },
                    input: {
                        placeholder: 'YOUR MOBILE NUMBER',
                        data: mobileNumber,
                        isAllowed: true
                    }
                };
                $scope.onSubmitTapped = function(newMobile) {
                    popupConfirmPhone.close();
                    User.getInstance().mobile = newMobile;
                    User.getInstance().resendSms(new Callback(function() {
                        $scope.confirm = {
                            message: null,
                            buttons: {
                                isSubmit: true
                            },
                            input: {
                                placeholder: null,
                                data: null,
                                isAllowed: true
                            }
                        };
                        $translate(['CONFIRM_CODE_MESSAGE', 'CONFIRMATION_CODE']).then(function(translations) {
                            $scope.confirm.message = translations.CONFIRM_CODE_MESSAGE;
                            $scope.confirm.input.placeholder = translations.CONFIRMATION_CODE;
                        });
                        popupConfirmCode = $ionicPopup.confirm({
                            templateUrl: "templates/confirm.popup.html",
                            cssClass: "eserviss-confirm",
                            scope: $scope
                        });


                        $scope.onSubmitTapped = function(code) {
                            var validator = new Validator();
                            if (validator.isEmpty(code, "Please enter confirmation code you recieved via sms")) {
                                $rootScope.onError.fire(validator.getError());
                                return;
                            }
                            User.getInstance().verifyMobile(code, new Callback(function() {
                                popupConfirmCode.close();
                                User.InitPushNotification();
                                $ionicHistory.nextViewOptions({
                                    disableBack: true
                                });
                                User.getInstance().store();
                                User.getInstance().ping();
                                $state.go("menu.hailrequest");
                            }), $rootScope.onError);
                        };
                    }), $rootScope.onError);
                };
                popupConfirmPhone = $ionicPopup.confirm({
                    templateUrl: "templates/confirm.popup.html",
                    cssClass: "eserviss-confirm",
                    scope: $scope
                });
            }), $rootScope.onError);


        };

    }
]);

controllers.controller('UserController@signup', [
    '$scope', '$state', '$stateParams', '$ionicPopup', '$translate', 'Util',
    '$timeout', 'User', 'Callback', '$rootScope', 'Country', 'Validator',
    '$ionicModal', 'Mode',
    function($scope, $state, $stateParams, $ionicPopup, $translate, Util,
        $timeout, User, Callback, $rootScope, Country, Validator,
        $ionicModal, Mode) {
        'use strict';

        Mode.FindAll();

        var popupConfirmPhone = null,
            popupConfirmCode = null;
        $scope.signup = {
            country: "Lebanon",
            mobile: {
                code: "+961"
            },
            gender: {}
        };

        //deprecated
        var onMobileConfirmed = new Callback(function() {
            var validator = new Validator();
            validator.isEmpty($scope.signup.firstName, "Please enter your first name", "signup-firstName");
            validator.isEmpty($scope.signup.lastName, "Please enter your last name", "signup-lastName");
            validator.isEmpty($scope.signup.email, "Please enter your email address", "signup-email");
            validator.isEmpty($scope.signup.password, "Please enter your password", "signup-password");
            validator.isEmpty($scope.signup.country, "Please enter your country", "signup-country");
            validator.isEmpty($scope.signup.mobile.code, "Please enter your mobile country code");
            validator.isEmpty($scope.signup.mobile.number, "Please enter your mobile number", "signup-mobile");
            validator.isEmpty($scope.signup.gender.value, "Please enter your gender", "signup-gender");


            if (!validator.isPassed()) {

                $rootScope.onError.fire(validator.getErrorBlock());
                return;
            }

            User.getInstance().firstName = $scope.signup.firstName;
            User.getInstance().lastName = $scope.signup.lastName;
            User.getInstance().email = $scope.signup.email;
            User.getInstance().password = $scope.signup.password;
            User.getInstance().country = $scope.signup.country;
            User.getInstance().mobile = Util.String("{0}{1}", [$scope.signup.mobile.code, $scope.signup.mobile.number]);
            User.getInstance().gender = $scope.signup.gender.value;
            User.getInstance().signup(new Callback(function() {
                $ionicHistory.nextViewOptions({
                    disableBack: true
                });
                User.getInstance().store();
                User.getInstance().ping();
                $state.go("menu.hailrequest");
            }), $rootScope.onError);
        });

        var popupMobileConfirm = function() {

            var phoneNumber = $scope.signup.mobile && $scope.signup.mobile.code && $scope.signup.mobile.number ? Util.String("{0} {1}", [$scope.signup.mobile.code, $scope.signup.mobile.number]) : '';
            $scope.confirm = {
                message: null,
                buttons: {
                    isSubmit: false
                },
                input: {
                    data: phoneNumber,
                    isAllowed: false
                }
            };
            $translate('IS_YOUR_MOBILE').then(function(confirmCodeMessage) {
                $scope.confirm.message = confirmCodeMessage;
            });
            popupConfirmPhone = $ionicPopup.confirm({
                templateUrl: "templates/confirm.popup.html",
                cssClass: "eserviss-confirm",
                scope: $scope
            });

            $scope.onYesTapped = function() {

                popupConfirmPhone.close();

                User.getInstance().signup(new Callback(function() {

                    popupConfirmCode = $ionicPopup.confirm({
                        templateUrl: "templates/confirm.popup.html",
                        cssClass: "eserviss-confirm",
                        scope: $scope
                    });

                    $scope.confirm.buttons.isSubmit = true;
                    $scope.confirm.input.isAllowed = true;
                    $scope.confirm.input.placeholder = null;
                    $scope.confirm.input.data = null;
                    $translate(['CONFIRM_CODE_MESSAGE', 'CONFIRMATION_CODE']).then(function(translations) {
                        $scope.confirm.message = translations.CONFIRM_CODE_MESSAGE;
                        $scope.confirm.input.placeholder = translations.CONFIRMATION_CODE;
                    });

                    $scope.onSubmitTapped = function(code) {
                        var validator = new Validator();
                        if (validator.isEmpty(code, "Please enter confirmation code you recieved via sms")) {
                            $rootScope.onError.fire(validator.getError());
                            return;
                        }
                        User.getInstance().verifyMobile(code, new Callback(function() {
                            popupConfirmCode.close();
                            $state.go("menu.hailrequest");
                        }), $rootScope.onError);
                    };

                }), $rootScope.onError);


            };

            $scope.onNoTapped = function() {
                popupConfirmPhone.close();
            };
        };

        $scope.onCountryTapped = function() {
            if (typeof cordova === "undefined") {
                $scope.signup.country = "Lebanon";
                $scope.signup.mobile.code = "+961";
                return;
            }

            var countryConfig = {
                title: "Select a Country",
                items: [],
                selectedValue: "202",
                doneButtonLabel: "Done",
                cancelButtonLabel: "Cancel",
            };

            Country.FindAll(new Callback(function(countries) {

                for (var i = 0; i < countries.length; i++) {
                    countryConfig.items.push({
                        text: countries[i].name,
                        value: i
                    });
                }

                plugins.listpicker.showPicker(countryConfig, function(countryIndex) {

                    $scope.$apply(function() {
                        $scope.signup.country = countries[countryIndex].name;
                        $scope.signup.mobile.code = Util.String("{0}{1}", ["+", countries[countryIndex].phoneCode]);
                    });

                }, function() {});

            }), $rootScope.onError);
        };

        $scope.onGenderTapped = function() {
            if (typeof cordova === "undefined") {
                $scope.signup.gender = {
                    text: "Male",
                    value: "MALE"
                };
                return;
            }
            $translate(['MALE', 'FEMALE']).then(function(translations) {
                var genderConfig = {
                    title: "Select a Gender",
                    items: [{
                        text: translations.MALE,
                        value: "MALE"
                    }, {
                        text: translations.FEMALE,
                        value: "FEMALE"
                    }],
                    doneButtonLabel: "Done",
                    cancelButtonLabel: "Cancel"
                };

                plugins.listpicker.showPicker(genderConfig, function(gender) {
                    var genderItem = Util.Find(genderConfig.items, function(item) {
                        return item.value == gender;
                    });
                    $scope.$apply(function() {
                        $scope.signup.gender = genderItem;
                    });

                }, function() {});
            });

        };

        $scope.onNextTapped = function(signup) {

            var validator = new Validator();

            var validator = new Validator();
            validator.isEmpty($scope.signup.firstName, "Enter your first name", "signup-firstName");
            validator.isEmpty($scope.signup.lastName, "Enter your last name", "signup-lastName");
            validator.isEmpty($scope.signup.email, "Enter your email address", "signup-email");
            validator.isEmpty($scope.signup.password, "Enter your password", "signup-password");
            validator.isEmpty($scope.signup.country, "Enter your country", "signup-country");
            validator.isEmpty($scope.signup.mobile.code, "Enter your mobile country code", "signup-mobilecode");
            validator.isEmpty($scope.signup.mobile.number, "Enter your mobile number", "signup-mobilenumber");
            validator.isEmpty($scope.signup.gender.value, "Enter your gender", "signup-gender");

            if (!validator.isPassed()) {

                $rootScope.onError.fire(validator.getErrorBlock());
                return;
            }

            User.getInstance().firstName = $scope.signup.firstName;
            User.getInstance().lastName = $scope.signup.lastName;
            User.getInstance().email = $scope.signup.email;
            User.getInstance().password = $scope.signup.password;
            User.getInstance().country = $scope.signup.country;
            User.getInstance().mobile = Util.String("{0}{1}", [$scope.signup.mobile.code, $scope.signup.mobile.number]);
            User.getInstance().gender = $scope.signup.gender.value;

            popupMobileConfirm();
        };

        $ionicModal.fromTemplateUrl('templates/privacy.modal.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.onPrivacyTapped = function() {
                modal.show();
            };
            $scope.onHidePolicyTapped = function() {
                modal.hide();
            };

            $scope.$on('$destroy', function() {
                modal.remove();
            });
        });

        $ionicModal.fromTemplateUrl('templates/terms.modal.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.onTermsTapped = function() {
                modal.show();
            };
            $scope.onHideTermsTapped = function() {
                modal.hide();
            };

            $scope.$on('$destroy', function() {
                modal.remove();
            });
        });

    }
]);

controllers.controller('UserController@profile', [
    '$scope', '$state', '$stateParams', 'User', 'ImageManager', 'Callback', '$rootScope',
    'Settings', 'Error', 'Util', '$ionicHistory', '$cordovaDialogs', 'Validator',
    function($scope, $state, $stateParams, User, ImageManager, Callback, $rootScope,
        Settings, Error, Util, $ionicHistory, $cordovaDialogs, Validator) {
        'use strict';

        $scope.user = {
            firstName: User.getInstance().firstName.charAt(0).toUpperCase() + User.getInstance().firstName.substring(1),
            lastName: User.getInstance().lastName.charAt(0).toUpperCase() + User.getInstance().lastName.substring(1),
            gender: User.getInstance().gender,
            email: User.getInstance().email,
            mobile: User.getInstance().mobile,
            profilePicture: User.getInstance().profilePicture
        };

        var imageManager = new ImageManager();

        /**
         * Validate profile picture
         * @param  {string} imageUrl path of the image
         * @param {Callback} success validation passed
         */
        var validateProfilePicture = function(imageUrl, onSuccess) {

            var defaultError = new Error("Error happened while setting profile picture, please try again");
            if (!imageUrl) {
                $rootScope.onError.fire(defaultError);
                return;
            }

            var MAX_SIZE = 5 * 1024 * 1024; // max file size

            imageManager.fileMetadata(new Callback(function(metadata) {
                if (!metadata.isImage())
                    $rootScope.onError.fire(new Error("Please select an image type"));
                else if (metadata.size > MAX_SIZE)
                    $rootScope.onError.fire(new Error("Please select an image less than 20 MB size"));
                else {
                    onSuccess.fire();
                }

            }), $rootScope.onError);
        };

        $scope.onCameraTapped = function() {
            imageManager.locationed().fromCamera(new Callback(function(imageUrl) {
                validateProfilePicture(imageUrl, new Callback(function() {
                    $scope.user.profilePicture = imageUrl;
                    $scope.$apply();
                }));
            }));
        };

        $scope.onGalleryTapped = function() {
            imageManager.locationed().fromGallery(new Callback(function(imageUrl) {
                validateProfilePicture(imageUrl, new Callback(function() {
                    $scope.user.profilePicture = imageUrl;
                    $scope.$apply();
                }));
            }));
        };

        $scope.onEmergencyNumberTapped = function() {
            plugins.CallNumber.callNumber(function() {}, function(e) {
                $rootScope.onError.fire(new Error("Error while calling Eserviss emergency, try again later"));
            }, Settings.getInstance().e_number);
        };



        $scope.onSaveTapped = function(profile) {
            var validator = new Validator();
            validator.isEmpty(profile.firstName, "First name can't be empty", "profile-firstName");
            validator.isEmpty(profile.lastName, "Last name can't be empty", "profile-lastName");
            validator.isEmpty(profile.gender, "Gender can't be empty", "profile-gender");
            validator.isEmpty(profile.email, "Email can't be empty", "profile-email");
            validator.isEmpty(profile.mobile, "Mobile can't be empty", "profile-mobile");

            if (!validator.isPassed()) {
                $rootScope.onError.fire(validator.getErrorBlock());
                return;
            }

            $rootScope.onProgress.fire();
            User.getInstance().updateProfile(profile, imageManager, new Callback(function() {
                $rootScope.onProgressDone.fire();
                $cordovaDialogs.alert("Your profile is updated successfully", "Profile Update");
            }), $rootScope.onError);
        };

        $scope.onLogoutTapped = function() {
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            User.getInstance().logout();
            $state.go("landing");
        };




    }
]);

controllers.controller('UserController@forget', [
    '$scope', '$state', '$stateParams', 'User', '$ionicPopup',
    'Validator', 'Callback', '$rootScope', 'Error', '$cordovaDialogs',
    function($scope, $state, $stateParams, User, $ionicPopup,
        Validator, Callback, $rootScope, Error, $cordovaDialogs) {
        'use strict';

        var popupConfirmPhone = null;

        var STATE = {
            VERIFY_MOBILE: 0,
            RESET_PASSWORD: 1
        };

        $scope.STATE = STATE;

        //bind forgot inputs to the view
        $scope.forgot = {};

        //initial state
        $scope.state = STATE.VERIFY_MOBILE;

        $scope.onSmsTapped = function(forgot) {
            var mobileValidator = new Validator();
            mobileValidator.isEmpty(forgot.mobile, "Mobile can't be empty", "forgot-mobile");

            if (!mobileValidator.isPassed()) {
                $rootScope.onError.fire(mobileValidator.getError());
                return;
            }

            User.getInstance().mobile = forgot.mobile;

            User.getInstance().forgotPasswordSendSms(new Callback(function() {

                $scope.confirm = {
                    message: "Please enter confirmation code you recieved via sms!",
                    buttons: {
                        isSubmit: true
                    },
                    input: {
                        placeholder: 'CONFIRMATION CODE',
                        isAllowed: true
                    }
                };

                $scope.onSubmitTapped = function(code) {
                    popupConfirmPhone.close();
                    User.getInstance().forgotPasswordValidateMobile(code, new Callback(function () {
                        $scope.state = STATE.RESET_PASSWORD;    
                    }), $rootScope.onError)
                    
                };
                popupConfirmPhone = $ionicPopup.confirm({
                    templateUrl: "templates/confirm.popup.html",
                    cssClass: "eserviss-confirm",
                    scope: $scope
                });

            }), $rootScope.onError);


        };

        $scope.onResetTapped = function(forgot) {
            var passwordValidator = new Validator();
            passwordValidator.isEmpty(forgot.password, "Password can't be empty", "forgot-password");
            passwordValidator.isEmpty(forgot.confirmPassword, "Confirm password can't be empty", "forgot-confirm-password");

            if (forgot.password !== forgot.confirmPassword) {
                $rootScope.onError.fire(new Error("password don't match"));
                return;
            }

            if (!passwordValidator.isPassed()) {
                $rootScope.onError.fire(passwordValidator.getError());
                return;
            }

            User.getInstance().password = forgot.password;
            User.getInstance().forgotPasswordReset(new Callback(function () {
                $cordovaDialogs.alert("Your password is reseted successfully", "Password Reset")
                .then(function () {
                    $state.go("header.signin");
                });
            }), $rootScope.onError);


        };

    }
]);

controllers.controller('UserController@paymentsettings', [
    '$scope', '$state', '$stateParams', '$rootScope', 'User', 'Util',
    'Callback', 'Validator', '$cordovaDialogs',
    function($scope, $state, $stateParams, $rootScope, User, Util,
        Callback, Validator, $cordovaDialogs) {
        'use strict';

        /*$scope.card = {
            name: "Jon Doe",
            number: "4242424242424242",
            cvc: "111",
            exp_year: "17",
            exp_month: "08"
        };*/

        $scope.card = {};
        $scope.creditCards = [];

        User.getInstance().findCreditCards(new Callback(function(creditCards) {
            $scope.creditCards = creditCards;
            $scope.$apply();
        }), $rootScope.onError);

        var validateCreditInputs = function(credit) {
            var validator = new Validator();
            validator.isEmpty(credit.name, "Please enter a valid credit card name", "payment-cardname");
            validator.isEmpty(credit.number, "Please enter a valid credit card number", "payment-cardnumber");
            validator.isEmpty(credit.cvc, "Please enter a valid credit card CVC", "payment-cardcvc");
            validator.isEmpty(credit.exp_month, "Please enter a valid 2 DIGIT expiry month", "payment-exp_month");
            validator.isEmpty(credit.exp_year, "Please enter a valid 2 DIGIT expiry year", "payment-exp_year");


            if (!validator.isPassed()) {
                $rootScope.onError.fire(validator.getErrorBlock());
                return false;
            }

            return true;
        };

        $scope.onEditSaveTapped = function(credit) {
            if (validateCreditInputs(credit)) {
                $rootScope.onProgress.fire();
                User.getInstance().saveCreditCard(credit, new Callback(function(motivationMessage) {
                    $rootScope.onProgressDone.fire();
                    $cordovaDialogs.alert(motivationMessage, 'Credit Card')
                        .then(function() {
                            $state.go("menu.ridecredit");
                        });
                }), $rootScope.onError);
            }
        };

        $scope.onPrepaidSubmitTapped = function(prepaidCode) {
            var validator = new Validator();
            if (validator.isEmpty(prepaidCode, "Please enter a valid prepaid card code")) {
                $rootScope.onError.fire(validator.getError());
                return;
            }
            User.getInstance().prepaidCard(prepaidCode, new Callback(function(amount) {
                $scope.prepaid = "";
                User.getInstance().findCredit(new Callback(function(credit) {
                    console.log(credit);
                    $cordovaDialogs.alert(Util.String('your account is recharged with {0} successfully, and your balance now is {1}', [amount, credit.cash]), 'PrepaidCard');
                }), $rootScope.onError);
            }), $rootScope.onError);
        };


    }
]);

controllers.controller('UserController@ridecredit', [
    '$scope', '$state', '$stateParams', 'User', 'Callback', '$rootScope',
    'Util', '$cordovaDialogs', 'Validator', 'Error',
    function($scope, $state, $stateParams, User, Callback, $rootScope,
        Util, $cordovaDialogs, Validator, Error) {
        'use strict';

        $scope.recharge = {};
        $scope.credit = null;

        var findCredit = function() {
            User.getInstance().findCredit(new Callback(function(credit) {
                console.log(credit);
                $scope.credit = credit;
                $scope.$apply();
            }), $rootScope.onError);
        };
        findCredit();


        var validateRechargeInputs = function(recharge) {

            if (!User.getInstance().isStripeCustomerCreated()) {
                $rootScope.onError.fire(new Error("Please enter your credit card first"));
                return false;
            }

            var validator = new Validator();
            if (validator.isEmpty(recharge.amount, "Please enter a valid recharge amount")) {
                $rootScope.onError.fire(validator.getError());
                return false;
            }

            return true;
        };


        $scope.onSubmitTapped = function(recharge) {

            if (validateRechargeInputs(recharge)) {
                var amount = recharge.amount * 100; //to cents


                User.getInstance().recharge(amount, new Callback(function() {
                    findCredit();
                    $cordovaDialogs.alert(Util.String('Your account is charged successfuly with {0}$', [recharge.amount]), 'Recharge');
                }), $rootScope.onError);

            }
        };

    }
]);

controllers.controller('UserController@blacklist', [
    '$scope', '$state', '$stateParams', 'User', 'Callback', '$rootScope',
    'Util',
    function($scope, $state, $stateParams, User, Callback, $rootScope,
        Util) {
        'use strict';

        var fakeProgress = angular.element(document.getElementById("fake-progress")),
            spamProgress = angular.element(document.getElementById("spam-progress"));

        User.getInstance().findBlacklist(new Callback(function(r) {
            fakeProgress.css("width", Util.String("{0}%", [r.fake]));
            spamProgress.css("width", Util.String("{0}%", [r.spam]));
        }), $rootScope.onError);
    }
]);