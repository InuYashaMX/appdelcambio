angular.module("myApp").controller("rankingCtrl", ['$scope', 'F', '$timeout', '$routeParams', '$location', function($scope, F, $timeout, $routeParams, $location) {

    $scope.map = $routeParams.map;

    function rankingFuncionarios(a, b) {
        if (a.total < b.total)
            return 1;
        if (a.total > b.total)
            return -1;
        return 0;
    }

    function rankingCiudadanos(a, b) {
        if (a.reputacion < b.reputacion)
            return 1;
        if (a.reputacion > b.reputacion)
            return -1;
        return 0;
    }
    
    $scope.goProfile = function(userId){
        $location.path("/profile/"+userId);
    }

    F.db.child("users").on("value", function(snapshot) {
        
        $scope.ciudadanos = [];
        $scope.funcionarios = [];

        snapshot.forEach(function(child) {
            
            var profile = child.val();
            profile.key = child.key;
            profile.reputacion = F.calcularReputacion(profile);
            profile.total=0;
            
            for (var k in profile.estadisticas){
                profile.total +=   profile.estadisticas[k];  
            }
            
            if (profile.team === "Ciudadano") {
                $scope.ciudadanos.push(profile);
            }
            else {
                $scope.funcionarios.push(profile);
            }
            
            $timeout(function() {});
        });

        $scope.ciudadanos.sort(rankingCiudadanos);
        $scope.funcionarios.sort(rankingFuncionarios);

    });

}]);