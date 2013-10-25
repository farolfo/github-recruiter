'use strict';

var myApp = angular.module('githubRecruiter', ['ui.router']);

myApp.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise("/organization");

    $stateProvider
        .state('organization', {
            url: "/organization",
            templateUrl: "partials/organization.html",
            controller: function($scope) {
                switchTab('organizationTab');

                $scope.query = '';

                $scope.search = function() {
                    console.log($scope.query);
                };
            }
        })
        .state('repository', {
            url: "/repository",
            templateUrl: "partials/repository.html",
            controller: function($scope) {
                switchTab('repositoryTab');

                $scope.query = '';

                $scope.search = function() {
                    console.log($scope.query);
                };
            }
        })
}]);

var switchTab = function(activeClassName) {
    var target = $('.' + activeClassName),
        currentActive = $('.searchContainer').find('li.active');

    currentActive.removeClass('active');
    target.addClass('active');
};