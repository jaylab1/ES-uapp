controllers.controller('GuestController@share', [
    '$scope', '$state', '$stateParams', 'User', 'Callback', '$rootScope',
    'Util', 'Error',
    function($scope, $state, $stateParams, User, Callback, $rootScope,
        Util, Error) {
        'use strict';

        //link to be refered per user
        var POST_MESSAGE = "Get Eserviss app at http://leb.cab";
        var POST_TITLE = "ESERVISS app install";

        //check if client is android or ios whether to use link email or app email
        $scope.isAndroid = ionic.Platform.isAndroid();
        $scope.isIos = ionic.Platform.isIOS();

        //find share referal code
        User.getInstance().findShare(new Callback(function(share) {
            //update message with the referal code
            $scope.share = share;
            POST_MESSAGE = Util.String("Get Eserviss app at http://leb.cab, Referal code is {0}", [share.code]);

            $scope.title = POST_TITLE;
            $scope.message = POST_MESSAGE;
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
                .then(function(success) {}, function(error) {});
        };

        /**
         * open share action sheet
         * @param  {String} message to share
         * @param  {String} title   of the shared message
         */
        var shareActionsheet = function(message, title) {
            if (!message) message = POST_MESSAGE;
            if (!title) title = POST_TITLE;

            plugins.socialsharing.share(message, title);
        };

        /**
         * on sms button tapped
         */
        $scope.onSmsTapped = function() {
            plugins.socialsharing.shareViaSMS({
                message: POST_MESSAGE
            }, null, null, shareActionsheet);
        };

        /**
         * on facebook button tapped
         */
        $scope.onFacebookTapped = function() {
            plugins.socialsharing.shareViaFacebookWithPasteMessageHint(POST_MESSAGE, null, null, "Your referal post is copied, paste it if you like", null, shareActionsheet);
        };

        /**
         * on google plus button tapped
         */
        $scope.onGoogleTapped = function() {
            if (ionic.Platform.isAndroid()) {
                plugins.socialsharing.shareVia('com.google.android.apps.plus', POST_MESSAGE, POST_TITLE, null, null, null, shareActionsheet);
            } else {
                shareActionsheet();
            }
        };

        /**
         * on twitter button tapped
         */
        $scope.onTwitterTapped = function() {
            plugins.socialsharing.shareViaTwitter(POST_MESSAGE, null, null, null, shareActionsheet);
        };

        /**
         * on whatsapp button tapped
         */
        $scope.onWhatsappTapped = function() {
            plugins.socialsharing.shareViaWhatsApp(POST_MESSAGE, null, null, null, shareActionsheet);
        };

        /**
         * on email button tapped
         */
        $scope.onEmailTapped = function() {
            plugins.socialsharing.shareViaEmail(POST_MESSAGE, POST_TITLE, [], [], [], null, function () {
                alert("email succeeded");
            }, shareActionsheet);
        };


    }
]);
