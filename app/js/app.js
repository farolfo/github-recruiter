'use strict';

var myApp = angular.module('githubRecruiter', ['ui.router', 'ngResource']);

myApp.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', function ($stateProvider, $urlRouterProvider, $httpProvider) {

    $httpProvider.responseInterceptors.push('globalInterceptor');

    $urlRouterProvider.otherwise("search/organization");

    var switchTab = function (activeClassName) {
        var target = $('.' + activeClassName),
            currentActive = $('.searchContainer').find('li.active');

        currentActive.removeClass('active');
        target.addClass('active');
    };

    $stateProvider
        .state('search', {
            url: "/search",
            templateUrl: "partials/search.html",
            controller: function ($scope, resultsSharedService) {
                $scope.$on('searchInProgress', function () {
                    $scope.recruiting = true;
                });

                $scope.$on('resultsBroadcast', function () {
                    $scope.results = resultsSharedService.results;
                    $scope.recruiting = false;
                });
            }
        })
        .state('error', {
            url: "/error?time",
            templateUrl: "partials/error.forbidden.html",
            controller: function ($scope, $stateParams) {
                var timeRemain = $stateParams.time * 1000 - (new Date().getTime());
                $scope.time = new Date(timeRemain).getMinutes();
            }
        })
        .state('search.organization', {
            url: "/organization",
            templateUrl: "partials/organization.html",
            controller: function ($scope, $githubRecruiter, resultsSharedService) {
                switchTab('organizationTab');

                $scope.organization = '';

                $scope.search = function () {
                    $scope.$emit('searchInProgress');

                    var promise = $githubRecruiter.searchByOrg($scope.organization);
                    promise.then(function (results) {
                        $scope.results = results;
                        resultsSharedService.prepForBroadcast($scope.results);
                    });
                };
            }
        })
        .state('search.repository', {
            url: "/repository",
            templateUrl: "partials/repository.html",
            controller: function ($scope, $githubRecruiter, resultsSharedService) {
                switchTab('repositoryTab');

                $scope.search = function () {
                    $scope.$emit('searchInProgress');

                    var promise = $githubRecruiter.searchByRepo($scope.owner, $scope.repo);
                    promise.then(function (results) {
                        $scope.results = results;
                        resultsSharedService.prepForBroadcast($scope.results);
                    });
                };
            }
        })
        .state('about', {
            url: "/about",
            templateUrl: "partials/about.html",
            controller: function ($scope) {

            }
        })
}]);