angular.module("myApp").controller("resumenCtrl", ['$scope', 'F', '$timeout', '$routeParams', '$location', 'moment', function($scope, F, $timeout, $routeParams, $location, moment) {


    $scope.map = $routeParams.map;
    $scope.doughnut = {};
    $scope.lines = {};
    $scope.lines.series = [];
    $scope.F = F;
    $scope.lines.options = {
        legend: {
            display: true,
            position: 'bottom'
        }
    };

    $scope.setDiario = function() {

        moment.locale('es');
        $scope.titulo = "Diario";
        $scope.lines.labels = [];
        $scope.lines.data = [];
        $scope.lines.labels.push("Hace 3 dias");
        $scope.lines.labels.push("Antier");
        $scope.lines.labels.push("Ayer");
        $scope.lines.labels.push("Hoy");
        var current = moment().format("D") - 3;

        F.db.child("reportes").child(moment().format("YYYY")).child("diario").child(moment().format("M")).once("value", function(snapshot) {
            for (var i = 0; i < $scope.categorias.length; i++) {
                var key = $scope.categorias[i].id;
                var data = [];

                for (var m = current; m <= moment().format("D"); m++) {
                    var datos = snapshot.val()[m];
                    if (typeof datos !== "undefined") {
                        if (typeof datos[key] !== "undefined") {
                            data.push(datos[key]);
                        }
                        else {
                            data.push(0);
                        }
                    }
                    else {
                        data.push(0);
                    }
                };
                $scope.lines.data.push(data);
            }
            $timeout(function() {});
        });
    }

    $scope.setSemanal = function() {

        moment.locale('es');
        $scope.titulo = "Semanal";
        $scope.lines.labels = [];
        $scope.lines.data = [];
        $scope.lines.labels.push("Hace 3 Semanas");
        $scope.lines.labels.push("Hace 2 Semanas");
        $scope.lines.labels.push("Hace 1 Semana");
        $scope.lines.labels.push("Actual");
        var current = moment().format("W") - 3;

        F.db.child("reportes").child(moment().format("YYYY")).child("semanal").once("value", function(snapshot) {
            for (var i = 0; i < $scope.categorias.length; i++) {
                var key = $scope.categorias[i].id;
                var data = [];

                for (var m = current; m <= moment().format("W"); m++) {
                    var datos = snapshot.val()[m];
                    if (typeof datos !== "undefined") {
                        if (typeof datos[key] !== "undefined") {
                            data.push(datos[key]);
                        }
                        else {
                            data.push(0);
                        }
                    }
                    else {
                        data.push(0);
                    }
                };
                $scope.lines.data.push(data);
            }
            $timeout(function() {});
        });
    }

    $scope.setMensual = function() {

        $scope.titulo = "Mensual";
        moment.locale('es');
        $scope.lines.labels = [];
        $scope.lines.data = [];
        $scope.lines.labels.push(moment().subtract(3, 'months').format("MMMM"));
        $scope.lines.labels.push(moment().subtract(2, 'months').format("MMMM"));
        $scope.lines.labels.push(moment().subtract(1, 'months').format("MMMM"));
        $scope.lines.labels.push(moment().format("MMMM"));

        var current = moment().format("M") - 3;

        F.db.child("reportes").child(moment().format("YYYY")).child("mensual").once("value", function(snapshot) {
            for (var i = 0; i < $scope.categorias.length; i++) {
                var key = $scope.categorias[i].id;
                var data = [];

                for (var m = current; m <= moment().format("M"); m++) {
                    var datos = snapshot.val()[m];
                    if (typeof datos !== "undefined") {
                        if (typeof datos[key] !== "undefined") {
                            data.push(datos[key]);
                        }
                        else {
                            data.push(0);
                        }
                    }
                    else {
                        data.push(0);
                    }
                };
                $scope.lines.data.push(data);
            }
            $timeout(function() {});
        });
    }

    F.db.child("reportes").child("totales").on("value", function(snapshot) {

        $scope.doughnut.labels = ["Reparados", "Pendientes"];
        $scope.pendientesNum = snapshot.val().pendientes;
        $scope.reparadosNum = snapshot.val().reparados;
        $scope.doughnut.data = [$scope.reparadosNum, $scope.pendientesNum];
        $scope.doughnut.colors = ["#6DB640", "#FFFFFF"];
        $scope.doughnut.options = {
            lineWidth: 0
        }
        $scope.doughnut.override = {
            lineWidth: 0,
            borderColor: ['#7FC8BA', '#7FC8BA']
        };
        $timeout(function() {});

        F.db.child("categorias").on("value", function(snapshot) {
            $scope.categorias = [];

            snapshot.forEach(function(child) {
                $scope.lines.series.push(child.val().descripcion);
                $scope.categorias.push({
                    id: child.key,
                    value: child.val().descripcion
                });
            });

            $scope.setDiario();

        });

    });



    F.db.child("markers").child($routeParams.map).on("value", function(snapshot) {
        $scope.reportados = [];
        $scope.reparados = [];
        $scope.reparacion = [];
        snapshot.forEach(function(child) {
            if (child.val().status === "Sin atender") {
                $scope.reportados.push(child.val());
            }

            if (child.val().status === "En proceso de reparacion") {
                $scope.reparacion.push(child.val());
            }

            if (child.val().status === "Reparado") {
                $scope.reparados.push(child.val());
            }
            $timeout(function() {});
        });

    });

}]);