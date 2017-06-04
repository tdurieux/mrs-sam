(function() {
    'use strict';

    angular.module('mrsSamApp', ['ngResource']);

    angular.module('mrsSamApp').factory('resultsService', ['$resource', resultsServiceFactory]);

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



    angular.module('mrsSamApp').controller('testController', ['$scope', '$http', testControllerFactory]);

    function testControllerFactory($scope, $http) {
        $scope.options = {
            URL: "http://localhost:8080",
            crawler: {
                maxsteps: 10,
                maxruns: 5,
                time: 20,
                wait: 1000
            },
            scenario: {
                click: { active: true },
                scroll: { active: false },
                form: { active: true },
                back: { active: true },
                mouseover: { active: false },
                wait: { active: false }
            }
        };

        $scope.crawl = function(options) {
            $http.post('/test', options).then(function successCallback(response) {
                alert(response.data);
            }, function errorCallback(response) {});
        }
    }
    

    angular.module('mrsSamApp').controller('resultsController', ['$scope', 'resultsService', resultControllerFactory]);

    function resultControllerFactory($scope, resultsService) {
        $scope.results = resultsService.get();
        $scope.show = false;
        $scope.result = {};

        $scope.showResult = function(result) {
            //alert(JSON.stringify(result));
            resultsService.query({ id: result._id }, function(resultFromBD) {
                //alert(JSON.stringify(resultFromBD));
                $scope.result = resultFromBD[0];
                $scope.show = true;
            });
        }
    }

    angular.module('mrsSamApp').directive('result', resultFactory);

    function resultFactory() {
        return {
            restrict: 'E',
            templateUrl: 'template/result.html'
        };
    };


})();
