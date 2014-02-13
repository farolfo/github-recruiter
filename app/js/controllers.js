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


myApp.factory('$githubRecruiter', ['$users', '$collaborators', '$repositories', '$stargazers', '$q', '$organizations', function($users, $collaborators, $repositories, $stargazers, $q, $organizations) {
    var searchByRepo = function(owner, repo, knownCollaborators) {
            var deferred = $q.defer();

            knownCollaborators = ( knownCollaborators === undefined ? {} : knownCollaborators );

            $collaborators.query({repo: repo, owner: owner}, function(collaborators) {
                var users = [],
                    collaboratorsPending = collaborators.length,
                    checkIfFinished = function() {
                        collaboratorsPending--;
                        if ( collaboratorsPending === 0 ) {
                            console.log('resolved repo ' + repo);
                            deferred.resolve(users);
                        }
                    };

                collaborators.forEach(function(collaborator) {
                    var userPromise;

                    if ( ! isAKnownCollaborator(collaborator, knownCollaborators) ) {
                        userPromise = getUser(collaborator);
                        markCollaboratorAsKnown(collaborator, knownCollaborators);
                    } else {
                        checkIfFinished();
                    }

                    if ( userPromise !== undefined ) {
                        userPromise.then(
                        function(user) {
                            users.push(user);
                            checkIfFinished();
                        }, checkIfFinished);
                    }
                });
            });

            return deferred.promise;
        },
        isAKnownCollaborator = function(collaborator, knownCollaborators) {
            return knownCollaborators[collaborator.login];
        },
        markCollaboratorAsKnown = function(collaborator, knownCollaborators) {
            knownCollaborators[collaborator.login] = true;
        },
        getUser = function(collaborator) {
            var deferred = $q.defer();
            $users.get({user: collaborator.login}, function(user) {
                if ( user.name || user.email ) {
                    console.log('resolving user ' + user.name);
                    $organizations.query({user: user.login}, function(orgs) {
                        user.organizations = orgs;
                        deferred.resolve(user);
                    });
                } else {
                    deferred.reject();
                }
            });
            return deferred.promise;
        };

    return {
        searchByRepo: searchByRepo,

        searchByOrg: function(organization) {
            var deferred = $q.defer(),
                users = [],
                knownCollaborators = {};

            $repositories.query({org: organization}, function(repositories) {
                var repositoriesPending = repositories.length,
                    checkIfFinished = function() {
                        console.log("repository " + repositoriesPending);
                        repositoriesPending--;
                        if ( repositoriesPending === 0 ) {
                            console.log("resolved organization");
                            deferred.resolve(users);
                        }
                    };

                repositories.forEach(function(repo) {
                    var repoPromise = searchByRepo(repo.owner.login, repo.name, knownCollaborators);

                    repoPromise.then(
                        function(newUsers) {
                            users = users.concat(newUsers);
                            checkIfFinished();
                        },
                        checkIfFinished
                    );
                });
            });

            return deferred.promise;
        }
    };
}]);



myApp.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', function($stateProvider, $urlRouterProvider, $httpProvider) {

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

/*
myApp.filter('collaborator', function() {
    return function(input, enabled) {
        if( ! enabled ) {
            return input;
        }

        var out = [];
        input.forEach(function(item) {
            if ( item.collaborator ) {
                out.push(item);
            }
        });

        return out;
    }
});

myApp.filter('watcher', function() {
    return function(input, enabled) {
        if( ! enabled ) {
            return input;
        }

        var out = [];
        input.forEach(function(item) {
            if ( item.collaborator ) {
                out.push(item);
            }
        });

        return out;
    }
});

myApp.filter('stargazer', function() {
    return function(input, enabled) {
        if( ! enabled ) {
            return input;
        }

        var out = [];
        input.forEach(function(item) {
            if ( item.collaborator ) {
                out.push(item);
            }
        });

        return out;
    }
});  */