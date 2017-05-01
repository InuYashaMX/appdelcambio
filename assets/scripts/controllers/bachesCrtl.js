angular.module("myApp").controller("bachesCtrl", ['$scope', 'F', '$timeout', '$routeParams', '$location', function($scope, F, $timeout, $routeParams, $location) {

    $scope.ordered = "nivelId";
    $scope.map = $routeParams.map;

    F.db.child("markers").child($routeParams.map).limitToLast(1).on("value", function(snapshot) {
        $scope.ultimo = snapshot.val();
        $scope.baches = [];
        
        F.db.child("markers").child($routeParams.map).orderByChild("nivel").on("value", function(snap) {
            snap.forEach(function(child){
                snapshot.forEach(function(childSnapshot){
                    if (child.key !== childSnapshot.key){
                        $scope.baches.push(child.val());    
                        $timeout(function() {});
                    }
                })       
            })   
        });
        
        $timeout(function() {});
    });

    

    $scope.goLink = function(item) {

        var param = {
            lat: item.lat,
            lng: item.lng,
            zoom: 19
        }

        $location.path($routeParams.map).search(param);

    }

}]);