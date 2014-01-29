'use strict';

var myApp = angular.module('githubRecruiter', ['ui.router']);

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

                    $scope.results = [
                        {
                            "login": "farolfo",
                            "id": 1851436,
                            "avatar_url": "https://gravatar.com/avatar/89a6ff37b19102deccfc22a64bfffbfe?d=https%3A%2F%2Fidenticons.github.com%2F99308d7f3a7157a105b189a89f3b2942.png&r=x",
                            "gravatar_id": "89a6ff37b19102deccfc22a64bfffbfe",
                            "url": "https://api.github.com/users/farolfo",
                            "html_url": "https://github.com/farolfo",
                            "followers_url": "https://api.github.com/users/farolfo/followers",
                            "following_url": "https://api.github.com/users/farolfo/following{/other_user}",
                            "gists_url": "https://api.github.com/users/farolfo/gists{/gist_id}",
                            "starred_url": "https://api.github.com/users/farolfo/starred{/owner}{/repo}",
                            "subscriptions_url": "https://api.github.com/users/farolfo/subscriptions",
                            "organizations_url": "https://api.github.com/users/farolfo/orgs",
                            "repos_url": "https://api.github.com/users/farolfo/repos",
                            "events_url": "https://api.github.com/users/farolfo/events{/privacy}",
                            "received_events_url": "https://api.github.com/users/farolfo/received_events",
                            "type": "User",
                            "site_admin": false,
                            "name": "Franco Arolfo",
                            "company": null,
                            "blog": null,
                            "location": null,
                            "email": "francoarolfo@hotmail.com",
                            "hireable": false,
                            "bio": null,
                            "public_repos": 18,
                            "public_gists": 0,
                            "followers": 8,
                            "following": 19,
                            "created_at": "2012-06-14T18:48:07Z",
                            "updated_at": "2014-01-29T01:02:59Z"
                        },
                        {
                            "login": "tgriesser",
                            "id": 154748,
                            "avatar_url": "https://gravatar.com/avatar/fb5d018725ccbe7c4359e29edddb201d?d=https%3A%2F%2Fidenticons.github.com%2F2d6b98b1665c939f8acce7bef72c2d13.png&r=x",
                            "gravatar_id": "fb5d018725ccbe7c4359e29edddb201d",
                            "url": "https://api.github.com/users/tgriesser",
                            "html_url": "https://github.com/tgriesser",
                            "followers_url": "https://api.github.com/users/tgriesser/followers",
                            "following_url": "https://api.github.com/users/tgriesser/following{/other_user}",
                            "gists_url": "https://api.github.com/users/tgriesser/gists{/gist_id}",
                            "starred_url": "https://api.github.com/users/tgriesser/starred{/owner}{/repo}",
                            "subscriptions_url": "https://api.github.com/users/tgriesser/subscriptions",
                            "organizations_url": "https://api.github.com/users/tgriesser/orgs",
                            "repos_url": "https://api.github.com/users/tgriesser/repos",
                            "events_url": "https://api.github.com/users/tgriesser/events{/privacy}",
                            "received_events_url": "https://api.github.com/users/tgriesser/received_events",
                            "type": "User",
                            "site_admin": false,
                            "name": "Tim Griesser",
                            "company": "",
                            "blog": "",
                            "location": "Cambridge, MA",
                            "email": "tgriesser@gmail.com",
                            "hireable": false,
                            "bio": null,
                            "public_repos": 22,
                            "public_gists": 27,
                            "followers": 98,
                            "following": 0,
                            "created_at": "2009-11-18T09:21:13Z",
                            "updated_at": "2014-01-28T23:28:33Z"
                        }
                    ];

                    resultsSharedService.prepForBroadcast($scope.results);

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

myApp.directive('searchResult', function () {
    return {
        restrict: 'E',

        scope: {
            result: '='
        },

        templateUrl: './partials/directives/searchResult.html',

        link: function(scope) {

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