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
            URL: "http://www.amazon.com",
            crawler: {
                maxsteps: 5,
                maxruns: 5,
                time: 2,
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
        $scope.statistics = {};

        $scope.showResult = function(result) {
            //alert(JSON.stringify(result));
            resultsService.query({ id: result._id }, function(resultFromBD) {
                //alert(JSON.stringify(resultFromBD));
                $scope.result = resultFromBD[0];
                $scope.show = true;

                computeStatistics();

                alert(JSON.stringify($scope.statistics));

            });

            function computeStatistics() {
                alert(JSON.stringify($scope.result))
                $scope.statistics.duration = $scope.result.duration;
                $scope.statistics.numberOfExecuterScenario = $scope.result.executedScenario.length;
                $scope.statistics.numberOfUnexecutedScenario = $scope.result.numberOfUnexecutedScenario;
                $scope.statistics.consoleErrors = 0;
                $scope.statistics.pageErrors = 0;
                $scope.statistics.httpErrors = 0;
                $scope.statistics.crawlerErrors = 0;
                $scope.result.executedScenario.forEach(scenario => {
                    scenario.actions.forEach(action => {
                        action.errors.forEach(error => {
                            switch (error.type) {
                                case 'console' :  $scope.statistics.consoleErrors++;
                                                    break;
                                case 'page' : $scope.statistics.pageErrors++;
                                                    break;
                                case 'http' : $scope.statistics.httpErrors++;
                                                    break;
                                case 'crawler' : $scope.statistics.crawlerErrors++;
                            } 
                        })
                    })
                })
                alert(JSON.stringify($scope.statistics));          
            }
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
