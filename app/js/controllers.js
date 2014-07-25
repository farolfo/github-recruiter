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
    var token = "d588acf155c56cef36ea7142e258d934f1909258";

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

myApp.factory('$watchers', ['$resource', 'TokenHandler', function($resource, tokenHandler) {
    var resource = $resource(githubUrl + '/repos/:owner/:repo/subscribers', {owner: '@owner', repo: '@repo'});
    resource = tokenHandler.wrapActions( resource, ["query", "get"] );
    return resource;
}]);

myApp.factory('$organizations', ['$resource', 'TokenHandler', function($resource, tokenHandler) {
    var resource = $resource(githubUrl + '/users/:user/orgs', {user: '@user'});
    resource = tokenHandler.wrapActions( resource, ["query", "get"] );
    return resource;
}]);

myApp.factory('$repositories', ['$resource', 'TokenHandler', function($resource, tokenHandler) {
    var resource = $resource(githubUrl + '/orgs/:org/repos', {org: '@org'});
    resource = tokenHandler.wrapActions( resource, ["query", "get"] );
    return resource;
}]);

var PromiseChain = function(callback) {
    var promisesLeft = 0;

    return {
        addPromise: function(promise) {
            promisesLeft++;

            var decPromise = function() {
                promisesLeft--;
                if ( promisesLeft === 0 ) {
                    callback();
                }
            };

            promise.then(decPromise, decPromise);
        }
    };
};

myApp.factory('$githubRecruiter', ['$users', '$collaborators', '$repositories', '$stargazers', '$q', '$organizations', '$watchers', function($users, $collaborators, $repositories, $stargazers, $q, $organizations, $watchers) {

    var searchByRepo = function(owner, repo, knownLogins) {
        var mainDeferred = $q.defer(),
            mainUsers = [];

        knownLogins = (knownLogins === undefined ? {} : knownLogins);

        var markLoginAsKnown = function(login) {
            console.log("---- Marking " + login + " as known");
            knownLogins[login] = true;
        };

        var populateUsersData = function(users, deferred, userType) {
            var promiseChain = new PromiseChain(function() {
                deferred.resolve();
            });

            users.forEach(function(user) {
                var p = populateUserData(user, userType);
                promiseChain.addPromise(p);
            });
        };

        var populateUserData = function(user, userType) {
            var localDeferred = $q.defer();
            $users.get({user: user.login}, function(u) {
                $organizations.query({user: user.login}, function(orgs) {
                    u.organizations = orgs;
                    u.userType = userType;
                    mainUsers.push(u);
                    localDeferred.resolve();
                });
            });
            return localDeferred.promise;
        };

        var isAKnownUser = function(user) {
            if ( knownLogins[user.login] ) {
                return true;
            }
            return false;
        };

        var filterUsed = function(users) {
            console.log("--> Filtering "+ users.length +" users. KnownLogins are " + Object.keys(knownLogins).length);
            var newUsers = [];
            users.forEach(function(user) {
                if ( ! isAKnownUser(user) ) {
                    newUsers.push(user);
                    markLoginAsKnown(user.login);
                }
            });
            console.log("--> Filtered " + (users.length - newUsers.length) + " users. Now knownLogins are " + Object.keys(knownLogins).length);
            return newUsers;
        };

        var analizeUsers = function(users, deferred, userType) {
            console.log("analazing " + users.length + " " + userType + "s");
            users = filterUsed(users);
            if ( users.length === 0 ) {
                deferred.resolve();
            }
            populateUsersData(users, deferred, userType);
        };

        var fetchCollaborators = function() {
            var deferred  = $q.defer();
            $collaborators.query({repo: repo, owner: owner}, function(users) {
                analizeUsers(users, deferred, 'collaborator');
            });
            return deferred.promise;
        };

        var fetchWatchers = function() {
            var deferred  = $q.defer();
            $watchers.query({repo: repo, owner: owner}, function(users) {
                analizeUsers(users, deferred, 'watcher');
            });
            return deferred.promise;
        };

        var fetchStargazers = function() {
            var deferred  = $q.defer();
            $stargazers.query({repo: repo, owner: owner}, function(users) {
                analizeUsers(users, deferred, 'stargazer');
            });
            return deferred.promise;
        };

        var collaboratorsPromise = fetchCollaborators(),
            watchersPromise = fetchWatchers(),
            stargazersPromise = fetchStargazers();

        var promiseChain = new PromiseChain(function() {
            console.log("main deferred resolved with " + mainUsers.length + " users");
            mainDeferred.resolve(mainUsers);
        });

        promiseChain.addPromise(collaboratorsPromise);
        promiseChain.addPromise(watchersPromise);
        promiseChain.addPromise(stargazersPromise);

        return mainDeferred.promise;
    };

    var searchByOrg = function(organization) {
        var def = $q.defer(),
            users = [],
            reposLeft = 0,
            knownLogins = {};

        $repositories.query({org: organization}, function(repos) {
            console.log("Got " + repos.length + " repos");

            reposLeft = repos.length;

            var analizeRepo = function(repo) {
                console.log("searching for repo "+ repo.name);

                var promise = searchByRepo(repo.owner.login, repo.name, knownLogins);

                promise.then(function(u) {
                    console.log("Added users from repo " + repo.name + " ( " + u.length + " - " + Object.keys(knownLogins).length + "known logins )");
                    users = users.concat(u);
                    reposLeft--;
                    if ( reposLeft === 0 ) {
                        def.resolve(users);
                    }
                });
            };

            repos.forEach(analizeRepo);
        });

        return def.promise;
    };

    return {
        searchByRepo: searchByRepo,
        searchByOrg: searchByOrg
    }

}]);

myApp.factory('globalInterceptor', ['$q', '$injector', function($q, $injector){
    return function(promise){

        return promise.then(function(response){
            return response;
        }, function(response){
            if ( response.status === 403 ) {
                var headers = response.headers();
                $injector.get('$state').go('error', {time: headers['x-ratelimit-reset']});
            }
            return $q.reject(response);
        });
    }
}]);

myApp.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', function($stateProvider, $urlRouterProvider, $httpProvider) {

    $httpProvider.responseInterceptors.push('globalInterceptor');

    $urlRouterProvider.otherwise("search/organization");

    $stateProvider
        .state('search', {
            url: "/search",
            templateUrl: "partials/search.html",
            controller: function($scope, resultsSharedService) {
                $scope.$on('searchInProgress', function() {
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
            controller: function($scope, $stateParams) {
                var timeRemain = $stateParams.time * 1000 - (new Date().getTime());
                $scope.time = new Date(timeRemain).getMinutes();
            }
        })
        .state('search.organization', {
            url: "/organization",
            templateUrl: "partials/organization.html",
            controller: function($scope, $githubRecruiter, resultsSharedService) {
                switchTab('organizationTab');

                $scope.organization = '';

                $scope.search = function() {
                    $scope.$emit('searchInProgress');

                    var promise = $githubRecruiter.searchByOrg($scope.organization);
                    promise.then(function(results) {
                        $scope.results = results;
                        resultsSharedService.prepForBroadcast($scope.results);
                    });
                };
            }
        })
        .state('search.repository', {
            url: "/repository",
            templateUrl: "partials/repository.html",
            controller: function($scope, $githubRecruiter, resultsSharedService) {
                switchTab('repositoryTab');

                $scope.search = function() {
                    $scope.$emit('searchInProgress');

                    var promise = $githubRecruiter.searchByRepo($scope.owner, $scope.repo);
                    promise.then(function(results) {
                        $scope.results = results;
                        resultsSharedService.prepForBroadcast($scope.results);
                    });
                };
            }
        })
        .state('about', {
            url: "/about",
            templateUrl: "partials/about.html",
            controller: function($scope) {

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

        link: function(scope, elem, attrs) {
            var container = angular.element(elem).find('.search-result');

            container.css('background','url(' + scope.result.avatar_url + ') center center no-repeat');
        }
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
                keywords = scope.name ? scope.name.replace(" ","+") : scope.email;

            scope.searchUrl = linkedinUrl + keywords;
        }
    };
});

var switchTab = function(activeClassName) {
    var target = $('.' + activeClassName),
        currentActive = $('.searchContainer').find('li.active');

    currentActive.removeClass('active');
    target.addClass('active');
};

myApp.filter('notInOrganization', function() {
    return function(users, organization, enabled) {
        if( ! enabled || ! users || ! organization) {
            return users;
        }

        var out = [];
        users.forEach(function(user) {
            if ( user.organizations ) {
                var isInOrganization = false;
                user.organizations.forEach(function(org) {
                    if ( org.login.toLowerCase() === organization.toLowerCase() ) {
                        isInOrganization = true;
                        console.log('User ' + user.name + ' is in org ' + org.login);
                    }
                });
                if ( ! isInOrganization ) {
                    console.log('User ' + user.name + ' is not in org ' + organization);
                    out.push(user);
                }
            } else {
                console.log('User ' + user.name + ' is not in any org');
                out.push(user);
            }
        });

        return out;
    }
});