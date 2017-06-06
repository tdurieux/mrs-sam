(function() {
    'use strict';

    angular.module('mrsSamApp', ['ngResource']);

    angular.module('mrsSamApp').factory('testService', ['$resource', testServiceFactory]);

    function testServiceFactory($resource) {
        return $resource('./test/:id', {}, {
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



    angular.module('mrsSamApp').controller('testFormController', ['$scope', '$http', testFormControllerFactory]);

    function testFormControllerFactory($scope, $http) {
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
            },
            map: {
                active: false
            }
        };

        $scope.crawl = function(options) {
            $http.post('/test', options).then(function successCallback(response) {
                alert(response.data);
            }, function errorCallback(response) {});
        }
    }


    angular.module('mrsSamApp').controller('testsViewController', ['$scope', 'testService', testsViewControllerFactory]);

    function testsViewControllerFactory($scope, testService) {
        $scope.tests = testService.get();
        $scope.show = false;
        $scope.test = {};
        $scope.statistics = {};

        $scope.showTest = function(test) {
            $scope.test = test;
            testService.query({ id: test._id }, function(resultFromBD) {
                $scope.executedScenario = resultFromBD;
                $scope.show = true;
                
                computeStatistics();


            });

            function computeStatistics() {

                $scope.statistics.duration = $scope.test.duration;
                $scope.statistics.numberOfExecuterScenario = $scope.executedScenario.length;
                $scope.statistics.consoleErrors = 0;
                $scope.statistics.pageErrors = 0;
                $scope.statistics.httpErrors = 0;
                $scope.statistics.crawlerErrors = 0;

                $scope.executedScenario.forEach(scenario => {
                    scenario.actions.forEach(action => {
                        action.errors.forEach(error => {
                            switch (error.type) {
                                case 'console':
                                    $scope.statistics.consoleErrors++;
                                    break;
                                case 'page':
                                    $scope.statistics.pageErrors++;
                                    break;
                                case 'http':
                                    $scope.statistics.httpErrors++;
                                    break;
                                case 'crawler':
                                    $scope.statistics.crawlerErrors++;
                            }
                        })
                    })
                })
            }
        }
    }

    angular.module('mrsSamApp').directive('test', resultFactory);

    function resultFactory() {
        return {
            restrict: 'E',
            templateUrl: 'template/testView.html'
        };
    };


})();
