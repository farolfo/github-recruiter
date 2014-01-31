'use strict';

var myApp = angular.module('githubRecruiter', ['ui.router', 'ngResource']);

myApp.factory('resultsSharedService', ['$rootScope', function ($rootScope) {
    var sharedService = {};

    sharedService.results = [];

    sharedService.prepForBroadcast = function (results) {
        this.results = results;
        this.broadcastItem();
    };

    sharedService.broadcastItem = function () {
        $rootScope.$broadcast('resultsBroadcast');
    };

    return sharedService;
}]);

var githubUrl = "https://api.github.com";

myApp.factory('TokenHandler', function() {
    var tokenHandler = {};
    var token = "ae0da3e43e7d1c6f68e150e38269f22c38c5e006";

    tokenHandler.set = function( newToken ) {
        token = newToken;
    };

    tokenHandler.get = function() {
        return token;
    };

    // wrap given actions of a resource to send auth token with every
    // request
    tokenHandler.wrapActions = function( resource, actions ) {
        // copy original resource
        var wrappedResource = resource;
        for (var i=0; i < actions.length; i++) {
            tokenWrapper( wrappedResource, actions[i] );
        };
        // return modified copy of resource
        return wrappedResource;
    };

    // wraps resource action to send request with auth token
    var tokenWrapper = function( resource, action ) {
        // copy original action
        resource['_' + action]  = resource[action];
        // create new action wrapping the original and sending token
        resource[action] = function( data, success, error){
            return resource['_' + action](
                angular.extend({}, data || {}, {access_token: tokenHandler.get()}),
                success,
                error
            );
        };
    };

    return tokenHandler;
});

myApp.factory('$users', ['$resource', 'TokenHandler', function($resource, tokenHandler) {
    var resource = $resource(githubUrl + '/users/:user', {user: '@user'});
    resource = tokenHandler.wrapActions( resource, ["query", "get"] );
    return resource;
}]);

myApp.factory('$collaborators', ['$resource', 'TokenHandler', function($resource, tokenHandler) {
    var resource = $resource(githubUrl + '/repos/:owner/:repo/collaborators', {owner: '@owner', repo: '@repo'});
    resource = tokenHandler.wrapActions( resource, ["query", "get"] );
    return resource;
}]);

myApp.factory('$stargazers', ['$resource', 'TokenHandler', function($resource, tokenHandler) {
    var resource = $resource(githubUrl + '/repos/:owner/:repo/stargazers', {owner: '@owner', repo: '@repo'});
    resource = tokenHandler.wrapActions( resource, ["query", "get"] );
    return resource;
}]);


myApp.factory('$githubRecruiter', ['$users', '$collaborators', '$stargazers', function($users, $collaborators, $stargazers) {
    return {
        searchByRepo: function(owner, repo, callback) {
            $collaborators.query({repo: repo, owner: owner}, function(collaborators) {
                var users = [];
                collaborators.forEach(function(collaborator) {
                    $users.get({user: collaborator.login}, function(user) {
                        users.push(user);
                    });
                });
                callback(users);
            });
        }
    };
}]);



myApp.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', function($stateProvider, $urlRouterProvider, $httpProvider) {

    $urlRouterProvider.otherwise("/organization");

    $stateProvider
        .state('organization', {
            url: "/organization",
            templateUrl: "partials/organization.html",
            controller: function($scope, resultsSharedService) {
                switchTab('organizationTab');

                $scope.query = '';

                $scope.search = function() {
                };
            }
        })
        .state('repository', {
            url: "/repository",
            templateUrl: "partials/repository.html",
            controller: function($scope, $githubRecruiter, resultsSharedService) {
                switchTab('repositoryTab');

                $scope.search = function() {
                    $githubRecruiter.searchByRepo($scope.owner, $scope.repo, function(results) {
                        $scope.results = results;
                        resultsSharedService.prepForBroadcast($scope.results);
                    });
                };
            }
        })
}]);

myApp.directive('searchResult', function () {
    return {
        restrict: 'E',

        scope: {
            result: '='
        },

        templateUrl: './partials/directives/searchResult.html'
    };
});

myApp.directive('searchInLinkedin', function () {
    return {
        restrict: 'E',

        scope: {
            name: '='
        },

        templateUrl: './partials/directives/searchInLinkedin.html',

        link: function(scope) {
            var linkedinUrl = "http://www.linkedin.com/vsearch/f?type=all&keywords=",
                keywords = scope.name.replace(" ","+");

            scope.searchUrl = linkedinUrl + keywords;
        }
    };
});

myApp.controller('githubRecruiterCtrl', ['$scope', 'resultsSharedService', function($scope, resultsSharedService) {
    $scope.$on('resultsBroadcast', function () {
        $scope.results = resultsSharedService.results;
    });
}]);

var switchTab = function(activeClassName) {
    var target = $('.' + activeClassName),
        currentActive = $('.searchContainer').find('li.active');

    currentActive.removeClass('active');
    target.addClass('active');
};