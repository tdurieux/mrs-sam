(function() {
    'use strict';

    angular.module('resultsApp', ['ngResource']);

    angular.module('resultsApp').factory('resultsService', ['$resource', resultsServiceFactory]);

    function resultsServiceFactory($resource) {
        return $resource('./results/:id', {}, {
            query: {
                method: 'GET',
                isArray: true,
                cache: false
            },
            get: {
                method: 'GET',
                isArray: true,
                cache: false
            }
        });
    }


    angular.module('resultsApp').controller('resultsController', ['$scope', 'resultsService', resultControllerFactory]);

    function resultControllerFactory($scope, resultsService) {
        $scope.results = resultsService.get(); 

    }



})();
