'use strict';

var myApp = angular.module('githubRecruiter', ['ui.router', 'githubRecruiter.services']);

myApp.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', function($stateProvider, $urlRouterProvider, $httpProvider) {

    $urlRouterProvider.otherwise("/organization");

    $stateProvider
        .state('organization', {
            url: "/organization",
            templateUrl: "partials/organization.html",
            controller: function($scope, githubOAuthService) {
                switchTab('organizationTab');

                $scope.query = '';

                $scope.search = function() {
                    console.log('[LOG] Searching for ' + $scope.query + 'in organizations');

                    githubOAuthService.then(function(greeting) {
                        alert('Success: ' + greeting);
                    }, function(reason) {
                        alert('Failed: ' + reason);
                    }, function(update) {
                        alert('Got notification: ' + update);
                    });
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

myModule.factory('githubOAuthService', function($http, $q) {
    var deferred = $q.defer();

    $http({
        method: 'GET',
        url: 'https://github.com/login/oauth/authorize?client_id=3700abd732183bf30cf6'
    }).
        success(function(data, status, headers, config) {
            debugger
            $http({
                method: 'POST',
                https: 'https://github.com/login/oauth/access_token?client_id=&client_secret=&code='
            }).
                success(function(data, status, headers, config) {

                }).
                error(function(data, status, headers, config) {
                    deferred.reject('Error message');
                });
        }).
        error(function(data, status, headers, config) {
            deferred.reject('Error message');
        });
    return deferred.promise;
});

var switchTab = function(activeClassName) {
    var target = $('.' + activeClassName),
        currentActive = $('.searchContainer').find('li.active');

    currentActive.removeClass('active');
    target.addClass('active');
};