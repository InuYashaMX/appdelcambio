angular.module("myApp").controller("mapsCtrl", ['$scope', 'F', '$timeout', '$mdDialog', '$location', function($scope, F, $timeout, $mdDialog, $location) {

    var param = {
        lat: 21.1606163,
        lng: -86.8413519
    }

    $location.path("/cancun").search(param);

    var listRef = F.db.child("list");

    listRef.on("value", function(snapshot) {
        $scope.maps = Object.keys(snapshot.val()).map(function(key) {
            return snapshot.val()[key];
        });
        $timeout(function() {});
    });

    $scope.NewMap = function() {
        if (!F.user) {
            F.getUser();
        }
        else {
            $location.path("/new");
        }
    }
}]);