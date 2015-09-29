controllers.controller('PromoController@promotions', [
    '$scope', '$state', '$stateParams', 'Promotion', 'User', '$rootScope', 'Callback',
    function($scope, $state, $stateParams, Promotion, User, $rootScope, Callback) {
    	'use strict';

    	Promotion.FindAll(User.getInstance(), new Callback(function (promotions) {
    		$scope.promotions = promotions;
    	}), $rootScope.onError);
    	
    }
]);