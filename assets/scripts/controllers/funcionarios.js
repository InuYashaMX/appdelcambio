angular.module("myApp").controller("funcionariosCtrl", ['$scope', 'F', '$timeout', '$routeParams', '$location', 'sweet', function($scope, F, $timeout, $routeParams, $location, sweet) {

    $scope.map = $routeParams.map;

    F.db.child("users").orderByChild("team").equalTo("FuncionarioPendiente").on("value", function(snapshot) {
        $scope.funcionarios = snapshot.val();
        $timeout(function() {});
    });

    $scope.changeTeam = function(team, key) {
        F.db.child("users").child(key).child("team").set(team);
        sweet.show({
            title: 'Operacion completada!',
            text: 'Ha cambiado el status a' + team + 'de este usuario',
            type: 'success',
        });
        $timeout(function() {});
    }

}]);