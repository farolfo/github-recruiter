'use strict';

var myApp = angular.module('githubRecruiter');

myApp.directive('searchResult', function () {
    return {
        restrict: 'E',

        scope: {
            result: '='
        },

        templateUrl: './partials/directives/searchResult.html',

        replace: true,

        link: function(scope, elem, attrs) {
            var container = angular.element(elem);
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
