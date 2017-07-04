(function() {
    'use strict';

    angular.module('mrsSamApp', ['ngResource']);

    angular.module('mrsSamApp').factory('siteService', ['$resource', siteServiceFactory]);

    function siteServiceFactory($resource) {
        return $resource('./site/:id', {}, {
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



    angular.module('mrsSamApp').controller('siteFormController', ['$scope', '$http', siteFormControllerFactory]);

    function siteFormControllerFactory($scope, $http) {
        $scope.options = {
            url : "http://www.labri.fr",
            numberOfSlave : 1
        };

        $scope.crawl = function(options) {
            $http.post('/site', options).then(function successCallback(response) {
                alert(response.data);
            }, function errorCallback(response) {});
        }
    }


    angular.module('mrsSamApp').controller('sitesViewController', ['$scope', 'siteService', sitesViewControllerFactory]);

    function sitesViewControllerFactory($scope, siteService) {
        $scope.sites = siteService.get();
    }

})();
