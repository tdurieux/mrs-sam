(function() {
    'use strict';

    angular.module('crawlerApp', []);


    angular.module('crawlerApp').controller('crawlerController', ['$scope', '$http', crawlerControllerFactory]);

    function crawlerControllerFactory($scope, $http) {
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
            $http.post('/crawl', options).then(function successCallback(response) {
                alert(response.data);
            }, function errorCallback(response) {
            });
        }
    }



})();
