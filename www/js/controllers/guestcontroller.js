controllers.controller('GuestController@share', [
    '$scope', '$state', '$stateParams', 'User', 'Callback', '$rootScope',
    'Util',
    function($scope, $state, $stateParams, User, Callback, $rootScope,
        Util) {
        'use strict';

        //link to be refered per user
        var POST_MESSAGE = "Get Eserviss app at http://eserviss.com/app";
        var POST_TITLE = "Eserviss";

        User.getInstance().findShare(new Callback(function (share) {
            $scope.share = share;
            POST_MESSAGE = Util.String("Get Eserviss app at http://eserviss.com/app, Referal code is {0}", [share.code]);
        }), $rootScope.onError);

        /**
         * on copy (icon) referal link tapped
         */
        $scope.onCopyReferalLink = function() {
            //check if cordova isn't defined (browser testing)
            if (typeof(cordova) === "undefined") return;
            //copy the message to clipboard
            cordova.plugins.clipboard.copy(POST_MESSAGE);
            //user feedback that message is copied using toast message
            $cordovaToast.showLongBottom('Your referal link copied')
                .then(function(success) { }, function(error) { });
        };

        var shareActionsheet = function (message, title) {
            if (!message) message = POST_MESSAGE;
            if (!title) title = POST_TITLE;

            plugins.socialsharing.share(message, title);
        };

        $scope.onSmsTapped = function () {
            plugins.socialsharing.shareViaSMS({message: POST_MESSAGE}, null, null, shareActionsheet);
        };


        $scope.onFacebookTapped = function () {
            plugins.socialsharing.shareViaFacebookWithPasteMessageHint(POST_MESSAGE, null, null, "Your referal post is copied, paste it if you like", null, shareActionsheet);
        };

        $scope.onGoogleTapped = function () {
            if (ionic.Platform.isAndroid()) {
                plugins.socialsharing.shareVia('com.google.android.apps.plus', POST_MESSAGE, POST_TITLE, null, null, null, shareActionsheet);
            } else {
                shareActionsheet();
            }
        };

        $scope.onTwitterTapped = function () {
            plugins.socialsharing.shareViaTwitter(POST_MESSAGE, null, null, null, shareActionsheet);
        };

        $scope.onWhatsappTapped = function () {
            plugins.socialsharing.shareViaWhatsApp(POST_MESSAGE, null, null, null, shareActionsheet);
        };


    }
]);