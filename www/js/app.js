'use strict';

var application = angular.module('application', ['ionic', 'application.controllers', 'ngCordova', 'pascalprecht.translate', 'ngFx', 'ngAnimate', 'LocalStorageModule', 'ionic.rating', 'credit-cards', 'google.places']);
var controllers = angular.module('application.controllers', []);

application.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
});

application.config(function($stateProvider, $urlRouterProvider, $translateProvider, localStorageServiceProvider, $ionicConfigProvider) {

    $translateProvider
        .translations('en', {
            LOGIN: 'LOGIN',
            USERNAME: 'USERNAME',
            EMAIL: 'EMAIL',
            PASSWORD: 'PASSWORD',
            LANGUAGE_SETTINGS: 'LANGUAGE SETTINGS',
            WALK_THROUGH: 'WALK THROUGH THE APP',
            NEW_USER: 'REGISTER NOW',
            REGISTRATION: 'REGISTRATION',
            FIRST_NAME: 'FIRST NAME',
            LAST_NAME: 'LAST NAME',
            COUNTRY: 'COUNTRY',
            PHONE_NUMBER: 'PHONE NUMBER',
            GENDER: 'GENDER',
            NEXT: 'NEXT',
            CONFIRMATION_CODE: 'CONFIRMATION CODE',
            CONFIRM_CODE_MESSAGE: 'PLEASE ENTER CONFIRMATION RECEIVED VIA MESSAGE',
            SUBMIT: 'SUBMIT',
            YES: 'YES',
            NO: 'NO',
            IS_YOUR_MOBILE: 'IS THIS YOUR MOBILE NUMBER ?',
            MALE: 'MALE',
            FEMALE: 'FEMALE',
            MY_PROFILE: 'MY PROFILE',
            HAIL_RIDE: 'HAIL RIDE',
            PAYMENT_SETTINGS: 'PAYMENT SETTINGS',
            MANAGE_CREDIT: 'Manage Your Credit/Debit Card',
            RIDE_CREDIT: 'RIDE CREDIT',
            CHECK_BALANCE: 'Check Current Balance',
            PROMOTIONS: 'PROMOTIONS',
            ANNOUNCEMENTS_COUPON: 'Announcements and Coupon Number',
            SHARE: 'SHARE',
            INVITE_EARN: 'Invite Friend and Earn Free Rides',
            HELP_TOUR: 'HELP/TOUR',
            TAKE_TOUR: 'Take a Quick Tour',
            FAVORITES: 'FAVORITES',
            MANAGE_FAVORITES: 'Manage Your Favorite Locations',
            BLACKLIST_STATUS: 'BLACKLIST STATUS',
            FREE_RIDES: 'FREE RIDES',
            SEE_FREE_RIDES: 'See # of Free Rides Earned',
            CUSTOMER_CARE: 'CUSTOMER CARE',
            CALL_SUPPORT: 'Call Our Support Team',
            JUST_ME: 'JUST ME',
            TWO_OF_US: 'TWO OF US',
            THREE_WILL_RIDE: 'THREE WILL RIDE',
            PARTY_OF_FOUR: 'A PARTY OF FOUR'
        })
        .translations('ar', {
            LOGIN: 'تسجيل الدخول',
            USERNAME: 'كلمة المستخدم',
            EMAIL: 'البريد الإلتكترونى',
            PASSWORD: 'كلمة المرور',
            LANGUAGE_SETTINGS: 'إعدادات اللغة',
            WALK_THROUGH: 'سير من خلال التطبيق',
            NEW_USER: 'مستخدم جديد, سجل الأن',
            REGISTRATION: 'تسجيل الدخول',
            FIRST_NAME: 'الأسم الأول',
            LAST_NAME: 'أسم العائلى',
            COUNTRY: 'الدولة',
            PHONE_NUMBER: 'رقم الموبايل',
            GENDER: 'الجنس',
            NEXT: 'التالى',
            CONFIRMATION_CODE: 'كود التفعيل',
            CONFIRM_CODE_MESSAGE: 'من فضلك أدخل كود التأكيد المرسل عن طريق الرسائل',
            SUBMIT: 'سجل',
            YES: 'نعم',
            NO: 'لآ',
            IS_YOUR_MOBILE: 'هل هذا هو رقم الموبايل ؟',
            MALE: 'مذكر',
            FEMALE: 'مؤنث',
            MY_PROFILE: 'الصفحة الشخصية',
            HAIL_RIDE: 'أطلب رحلة',
            PAYMENT_SETTINGS: 'طريقة الدفع',
            MANAGE_CREDIT: 'إدارة بطاقاتك الإئتمانية',
            RIDE_CREDIT: 'نقاط الرحلات',
            CHECK_BALANCE: 'تفحص المبلغ الحالى',
            PROMOTIONS: 'العروض',
            ANNOUNCEMENTS_COUPON: 'ألإعلانات ورقم الفسيمة',
            SHARE: 'مشاركة',
            INVITE_EARN: 'أدعو اصدقائك واكسب رحلات مجانية',
            HELP_TOUR: 'مساعدة/جولة',
            TAKE_TOUR: 'خد جولة سريعة',
            FAVORITES: 'المفضلات',
            MANAGE_FAVORITES: 'تحديد الموقع المفضل لديك',
            BLACKLIST_STATUS: 'القائمة السوداء',
            FREE_RIDES: 'رحلات مجانية',
            SEE_FREE_RIDES: 'تفحص عدد الرحلات المجانيه المكتسبة',
            CUSTOMER_CARE: 'خدمات المشتركين',
            CALL_SUPPORT: 'الاتصال بفريق خدمة المشتركين',
            JUST_ME: 'أنا بس',
            TWO_OF_US: 'أتنين مننا',
            THREE_WILL_RIDE: 'تلاته هيركبوا سوا',
            PARTY_OF_FOUR: 'حفلة من أربعة'
        })
        .preferredLanguage('en');

    localStorageServiceProvider.setPrefix('EservissUser');

    document.body.classList.remove('platform-ios');
    document.body.classList.remove('platform-android');
    document.body.classList.add('platform-ios');

    //disable back
    $ionicConfigProvider.views.swipeBackEnabled(false);

    $stateProvider
        .state('splash', {
            url: '/splash',
            templateUrl: "templates/splash.html",
            controller: 'HomeController@splash'
        })
        .state('landing', {
            url: '/landing',
            templateUrl: "templates/landing.html",
            controller: 'HomeController@landing'
        })
        .state('authenticate', {
            url: '/authenticate',
            templateUrl: "templates/authenticate.html",
        })
        .state('header', {
            abstract: true,
            url: '/header',
            templateUrl: 'templates/header.html'
        })
        .state('header.signin', {
            url: '/signin',
            templateUrl: "templates/header.signin.html",
            controller: 'UserController@signin'
        })
        .state('header.signup', {
            url: '/signup',
            templateUrl: "templates/header.signup.html",
            controller: 'UserController@signup'
        })
        .state('header.forget', {
            url: '/forget',
            templateUrl: "templates/header.forget.html",
            controller: 'UserController@forget'
        })
        .state('menu', {
            abstract: true,
            url: '/menu',
            templateUrl: 'templates/menu.html',
            controller: 'HomeController@sidemenu'
        })
        .state('menu.profile', {
            url: '/profile',
            templateUrl: "templates/menu.profile.html",
            controller: "UserController@profile"
        })
        .state('menu.hailrequest', {
            url: '/hailrequest',
            params: {
                request: null,
            },
            templateUrl: "templates/menu.hailrequest.html",
            controller: "HailRequestController@request"
        })
        .state('menu.requestconfirmed', {
            url: '/confirmed',
            params: {
                request: null
            },
            templateUrl: "templates/menu.requestconfirmed.html",
            controller: "HailRequestController@confirmed"
        })
        .state('menu.receipt', {
            url: '/receipt',
            params: {
                request: null
            },
            templateUrl: "templates/menu.receipt.html",
            controller: "HailRequestController@receipt"
        })
        .state('menu.freereceipt', {
            url: '/freereceipt',
            params: {
                request: null
            },
            templateUrl: "templates/menu.freereceipt.html",
            controller: "HailRequestController@freereceipt"
        })
        .state('menu.favorites', {
            url: '/favorites',
            templateUrl: "templates/menu.favorites.html",
            controller: "FavoriteController@favorties"
        })
        .state('menu.addfavorite', {
            url: '/addfavorite',
            params: {
                mode: null,
                favorite: null
            },
            templateUrl: "templates/menu.addfavorite.html",
            controller: "FavoriteController@addfavorite"
        })
        .state('menu.help', {
            url: '/help',
            templateUrl: "templates/menu.help.html"
        })
        .state('menu.helpcenter', {
            url: '/helpcenter',
            templateUrl: "templates/menu.helpcenter.html"
        })
        .state('menu.privacy', {
            url: '/privacy',
            templateUrl: "templates/menu.privacy.html"
        })
        .state('menu.terms', {
            url: '/terms',
            templateUrl: "templates/menu.terms.html"
        })
        .state('menu.promotions', {
            url: '/promotions',
            templateUrl: "templates/menu.promotions.html",
            controller: "PromoController@promotions"
        })
        .state('menu.paymentsettings', {
            url: '/paymentsettings',
            templateUrl: "templates/menu.paymentsettings.html",
            controller: "UserController@paymentsettings"
        })
        .state('menu.ridecredit', {
            url: '/ridecredit',
            templateUrl: "templates/menu.ridecredit.html",
            controller: "UserController@ridecredit"
        })
        .state('menu.share', {
            url: '/share',
            templateUrl: "templates/menu.share.html",
            controller: "GuestController@share"
        })
        .state('menu.blacklist', {
            url: '/blacklist',
            templateUrl: "templates/menu.blacklist.html",
            controller: "UserController@blacklist"
        })
        .state('menu.pickuplocations', {
            url: '/pickuplocations',
            templateUrl: "templates/menu.pickuplocations.html",
            controller: "HailRequestController@pickuplocations",
            params: {
                request: null
            }
        })
        .state('menu.estimationfee', {
            url: '/estimationfee',
            templateUrl: "templates/menu.estimationfee.html",
            controller: "HailRequestController@estimationfee",
            params: {
                request: null
            }
        })
        .state('menu.sendnote', {
            url: '/sendnote',
            templateUrl: "templates/menu.sendnote.html",
            controller: "HailRequestController@sendnote",
            params: {
                request: null
            }
        })
        .state('menu.cancelride', {
            url: '/cancelride',
            templateUrl: "templates/menu.cancelride.html",
            controller: "HailRequestController@cancelride",
            params: {
                request: null
            }
        })
        .state('tour', {
            url: '/tour',
            templateUrl: "templates/tour.html",
        });


    // $urlRouterProvider.otherwise('/landing');
    $urlRouterProvider.otherwise('/splash');
    
});

//this workaround to fix ios 9 infinite callstack issue
application.run(function ($ionicHistory, $timeout, $state) {

    Function.prototype.clone = function() {
        var that = this;
        var temp = function temporary() { return that.apply(this, arguments); };
        for(var key in this) {
            if (this.hasOwnProperty(key)) {
                temp[key] = this[key];
            }
        }
        return temp;
    };

    var _ionicHistoryGoBack = $ionicHistory.goBack.clone();

    $ionicHistory.goBack = function (backCount) {
        if (ionic.Platform.isIOS()) {
            $ionicHistory.nextViewOptions({
                disableBack: true
            });

            if ($ionicHistory.backView().stateName === "menu.hailrequest") {
                $ionicHistory.clearCache();
                $timeout(function () {
                    $state.go("menu.hailrequest");
                }, 50);
            } else {
                $state.go("menu.hailrequest");
            }
        } else {
            _ionicHistoryGoBack(backCount);
        }
    };
});