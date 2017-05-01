angular.module("myApp").directive('starRating', function () {
    return {
        restrict: 'A',
        template: '<ul class="rating">' +
            '<li ng-repeat="star in stars" ng-class="star">' +
            '\u2605' +
            '</li>' +
            '</ul>',
        scope: {
            ratingValue: '=',
            max: '='
        },
        link: function (scope, elem, attrs) {
            scope.$watch('ratingValue', function() {
                 scope.stars = [];
               for (var i = 0; i < scope.max; i++) {
                scope.stars.push({
                    filled: i < parseInt(scope.ratingValue)
                });
            }
            });
            
            
        }
    }
});