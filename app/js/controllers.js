'use strict';

var myApp = angular.module('githubRecruiter', []);

var placeholder = function(tabName) {
    var placeholder = '';
    if ( tabName === 'Organization' ) {
        placeholder = "Enter your organization's name. i.e.: Mulesoft";
    } else if ( tabName === 'Repository' ) {
        placeholder = "Enter a repository's name. i.e.: mule";
    }
    return placeholder;
};

myApp.controller('searchController', ['$scope', function($scope){

    $scope.query = '';
    $scope.searchBy = 'Organization';

    $scope.queryInput = $('#query');

    $scope.search = function() {
        console.log($scope.query);
    };

    $scope.switchTab = function(e) {
        var target = $(e.currentTarget),
            currentActive = $('.searchContainer').find('li.active');

        $scope.searchBy = target.find('a').text();

        currentActive.removeClass('active');
        target.addClass('active');

        $scope.queryInput.attr('placeholder', placeholder($scope.searchBy));
    };
}]);