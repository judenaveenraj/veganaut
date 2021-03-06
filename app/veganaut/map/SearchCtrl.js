(function (module) {
    'use strict';

    module.controller('SearchCtrl', ['$scope', '$location', '$timeout', 'leafletData',
        'playerService', 'backendService', 'geocodeService',
        function ($scope, $location, $timeout, leafletData,
                  playerService, backendService, geocodeService) {
            // Geocoding search string model and results
            $scope.geocoding = {
                search: '',
                results: []
            };

            // Get a reference the the leaflet map object
            var mapPromise = leafletData.getMap();

            /**
             * Selects the given geocode result as the coordinates
             * for the new location
             * @param {GeocodeResult} result
             */
            $scope.setGeocodeResult = function (result) {
                // Set coordinates
                $scope.setNewLocationCoordinates(
                    result.lat,
                    result.lng
                );

                // Fit to the bounds of the result
                if (angular.isArray(result.bounds)) {
                    mapPromise.then(function (map) {
                        map.fitBounds(result.bounds);
                    });
                }
            };

            // Watch the geocoding search string
            $scope.$watch('geocoding.search', function (search) {
                // TODO: move constants somewhere else
                if (!angular.isString(search) || search.length < 4) {
                    return;
                }


                $scope.geocoding.results = [];

                // Lookup the search string
                geocodeService.search($scope.geocoding.search)
                    .then(function (data) {
                        $scope.geocoding.results = data;
                    })
                ;
            });

        }
    ]);
})(window.veganaut.mapModule);
