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
        $scope.show = false;
        $scope.result = {};

        $scope.showResult = function(result) {
            //alert(JSON.stringify(result));
            resultsService.query({id:result._id}, function (resultFromBD) {
                alert(JSON.stringify(resultFromBD));
                $scope.result = resultFromBD[0];
                $scope.show = true;
            });
        }
    }

    angular.module('resultsApp').directive('result', resultFactory);

    function resultFactory() {
        return {
            restrict: 'E',
            templateUrl: 'template/result.html'
        };
    };


})();
