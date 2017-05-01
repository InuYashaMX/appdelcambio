angular.module("myApp").controller("profileCtrl", ['$scope', 'F', '$timeout', '$routeParams', function($scope, F, $timeout, $routeParams) {

    var userRef = F.db.child("users").child($routeParams.key);
    $scope.reputacion = 0;

    $scope.labels = [];
    $scope.data = [];
    $scope.colors = [];

    $scope.calcular = function(key) {
        var num = $scope.profile.estadisticas[key];
        if ((num == 0) || ($scope.total == 0)) {
            return 0;
        }
        else {
            var promedio = (num / $scope.total) * 100;
            return parseInt(promedio);
        }
    }

    userRef.on("value", function(snapshot) {
        var profile = snapshot.val();
        $scope.profile = profile;
        $scope.profile.reputacion = F.calcularReputacion(profile);

        profile.total = 0;

        for (var k in profile.estadisticas) {
            profile.total += profile.estadisticas[k];
        }

        F.db.child("categorias").on("value", function(snap) {
            $scope.total = 0;
            $scope.categorias = snap.val();
            snap.forEach(function(child) {
                $scope.labels.push(child.val().descripcion);
                $scope.data.push(profile.estadisticas[child.key]);
                $scope.total += profile.estadisticas[child.key];
                $scope.colors.push(child.val().color);
                $timeout(function() {});
            });

        });
    });

}]);