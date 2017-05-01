angular.module("myApp").controller("mapCtrl", ['$scope', 'F', 'NgMap', '$timeout', '$mdDialog', '$mdMedia', '$routeParams', '$rootScope', '$mdToast', '$location', 'sweet', 'moment', function($scope, F, NgMap, $timeout, $mdDialog, $mdMedia, $routeParams, $rootScope, $mdToast, $location, sweet, moment) {

    var mapRef = F.db.child("maps").child($routeParams.map);
    var mapDataRef = F.db.child("list").child($routeParams.map);
    var chatRef = F.db.child('chats').child($routeParams.map);
    var markersRef = F.db.child('markers').child($routeParams.map);
    var suscriptionsRef = mapRef.child("users").child("suscriptions");

    F.suscriptionsRef = suscriptionsRef;
    F.admin = false;

    $scope.F = F;
    $scope.vm = {};
    $scope.timer = [];
    $scope.uploadme = {};
    $scope.uploadme.src = "";
    $scope.city = $routeParams.map;
    $scope.showNests = true;
    $scope.editingComments = false;
    $scope.uploading = false;
    $scope.mapPrivileges = true;
    $scope.markerType = false;
    $scope.setNewMarker = false;
    $scope.niveles = ['Chico', 'Mediano', 'Grande'];
    $scope.statusList = ['Sin atender', 'En proceso de reparacion', 'Reparado'];

    NgMap.getMap({
        id: 'mainMap'
    }).then(function(response) {
        $scope.vm.map = response;
    });

    suscriptionsRef.on("value", function(snapshot) {
        $scope.suscriptions = snapshot.numChildren();
        $timeout(function() {});
    });

    F.db.child("categorias").on("value", function(snapshot) {

        $scope.categorias = [];

        snapshot.forEach(function(child) {
            $scope.categorias.push({
                id: child.key,
                value: child.val().descripcion
            });
        });
        $timeout(function() {});
    });

    mapDataRef.on("value", function(snapshot) {
        if (snapshot.exists()) {
            F.mapData = snapshot.val();
        }
        else {
            $location.path("/");
        }
        $timeout(function() {});
    });

    markersRef.on("value", function(snapshot) {
        $scope.markers = snapshot.val();
        snapshot.forEach(function(child) {
            $scope.markers[child.key].imagen = {
                url: child.val().photo,
                scaledSize: [40, 40],
                origin: [0, 0],
                anchor: [0, 32]
            };
        });
        $timeout(function() {});
    });

    $scope.go_admin = function() {
        $location.path($routeParams.map + "/admin");
    };

    $scope.go_logs = function() {
        $location.path($routeParams.map + "/admin/logs");
    };

    $scope.go_list = function() {
        $location.path($routeParams.map + "/baches");
    };

    $scope.go_resumen = function() {
        $location.path($routeParams.map + "/resumen");
    };

    $scope.getDataTime = function() {
        var obj = {};
        obj.week = moment().format('W');
        obj.year = moment().format('YYYY');
        obj.month = moment().format('M');
        obj.day = moment().format('D');
        return obj;
    }

    $scope.saveStatus = function(key, item) {

        if (item.status === "Reparado") {

            markersRef.child(key).child("timeReparado").set(firebase.database.ServerValue.TIMESTAMP);
            var date = $scope.getDataTime();

            F.db.child("reportes").child(date.year).child("mensual").child(date.month).child(item.type).once("value", function(snapshot) {
                var contador = 1;
                if (snapshot.exists()) {
                    contador = snapshot.val() + 1;
                }
                F.db.child("reportes").child(date.year).child("mensual").child(date.month).child(item.type).set(contador);
            });

            F.db.child("reportes").child(date.year).child("diario").child(date.month).child(date.day).child(item.type).once("value", function(snapshot) {
                var contador = 1;
                if (snapshot.exists()) {
                    contador = snapshot.val() + 1;
                }
                F.db.child("reportes").child(date.year).child("diario").child(date.month).child(date.day).child(item.type).set(contador);
            });

            F.db.child("reportes").child(date.year).child("semanal").child(date.week).child(item.type).once("value", function(snapshot) {
                var contador = 1;
                if (snapshot.exists()) {
                    contador = snapshot.val() + 1;
                }
                F.db.child("reportes").child(date.year).child("semanal").child(date.week).child(item.type).set(contador);
            });

            F.db.child("reportes").child("totales").child("reparados").once("value", function(snapshot) {
                var contador = 1;
                if (snapshot.exists()) {
                    contador = snapshot.val() + 1;
                }
                F.db.child("reportes").child("totales").child("reparados").set(contador);
            });

            F.db.child("users").child(F.user.key).child("estadisticas").child(item.type).once("value", function(snapshot) {
                var contador = 1;
                if (snapshot.exists()) {
                    contador = snapshot.val() + 1;
                }
                F.db.child("users").child(F.user.key).child("estadisticas").child(item.type).set(contador);
            });
        }

        markersRef.child(key).child("status").set(item.status);
    }

    $scope.InfoWindow = function(evt, marker) {
        $scope.Info = marker;
        $scope.Info.pokemonLocation = marker.lat + ',' + marker.lng;
        $scope.Info.mediaUrl = $scope.createUrlShare(marker.lat + ',' + marker.lng, marker.photo, 16);
        $scope.Info.shareUrl = 'https://appdelcambio.com/#/' + $scope.city + '?lat=' + marker.lat + '&lng=' + marker.lng + '&zoom=19';
        $scope.Info.shareText = "Existe un bache aqui!";
        $scope.vm.map.showInfoWindow('InfoWindow', this);
    };

    $scope.voteUp = function(marker) {
        var ref = markersRef.child(marker.key);
        if (typeof F.user.key !== "undefined") {
            if (marker.userId !== F.user.key) {
                ref.child('voters').child(F.user.key).once("value", function(snapshot) {
                    if (!snapshot.exists()) {
                        ref.child('voteUp').set(parseInt(marker.voteUp) + 1);
                        $scope.voters(ref);
                        $scope.userVoteUp(marker);
                        F.showSimpleToast('Tu voto de grabo correctamente!');
                    }
                    else {
                        F.showSimpleToast('Ya has votado!');
                    }
                });
            }
            else {
                F.showSimpleToast("No puedes votar por ti mismo.");
            }
        }
        else {
            F.getUser();
        }
    };

    $scope.voteDown = function(marker) {
        var ref = markersRef.child(marker.key);
        if (typeof F.user.key !== "undefined") {
            if (marker.userId !== F.user.key) {
                ref.child('voters').child(F.user.key).once("value", function(snapshot) {
                    if (!snapshot.exists()) {
                        ref.child('voteDown').set(parseInt(marker.voteDown) + 1);
                        $scope.voters(ref);
                        $scope.userVoteDown(marker);
                        F.showSimpleToast('Tu voto se grabo correctamente!');
                    }
                    else {
                        F.showSimpleToast('Ya has votado!');
                    }
                });
            }
            else {
                F.showSimpleToast("No puedes votar por ti mismo");
            }
        }
        else {
            F.getUser();
        }
    };

    $scope.voters = function(ref) {
        ref.child('voters').child(F.user.key).set(true);
    };

    $scope.userVoteUp = function(marker) {
        var currentUserVotesUp;
        F.db.child("users").child(marker.userId).child("likes").once("value", function(snapshot) {
            currentUserVotesUp = snapshot.val();
            F.db.child("users").child(marker.userId).child("likes").set(currentUserVotesUp + 1);
        });
    };

    $scope.userVoteDown = function(marker) {
        F.db.child("users").child(marker.userId).child("dislikes").once("value", function(snapshot) {
            $scope.currentUserVotesDown = snapshot.val();
            F.db.child("users").child(marker.userId).child("dislikes").set(parseInt($scope.currentUserVotesDown) + 1);
        });
    };

    $scope.setMarkerType = function(mrkType) {
        F.showSimpleToast('Selecciona la locación dando click en el mapa.');
        if (mrkType == $scope.markerType) {
            $scope.markerType = false;
        }
        else {
            $scope.markerType = mrkType;
        }
        if (mrkType == 'nest') {
            if ($scope.nestDraggable == true) {
                $scope.nestDraggable = false;
            }
            else {
                $scope.nestDraggable = true;
                $scope.pokestopDraggable = false;
                $scope.gymDraggable = false;
            }
        }
    };

    var DialogController = function($mdDialog) {
        $scope.closeDialog = function() {
            $mdDialog.hide();
        }
    }

    $scope.renderForm = function(marker) {
        $scope.marker = marker;
        $mdDialog.show({
            templateUrl: './views/form.html',
            parent: angular.element(document.body),
            scope: $scope.$new(),
            preserveScope: true,
            clickOutsideToClose: true,
            controller: DialogController
        });
    }

    $scope.addMarker = function(e) {
        if (typeof F.user.key !== "undefined") {
            if ($scope.markerType !== false) {
                var marker = {
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng(),
                    user: F.user.trainer,
                    team: F.user.team,
                    userId: F.user.key,
                    type: $scope.markerType,
                    autorizado: false,
                    photoReparado: false,
                    nivelId: 0,
                    voteUp: 0,
                    voteDown: 0,
                    status: "Sin atender"
                };
                $scope.renderForm(marker);
            }
        }
        else {
            F.getUser();
        }

    }

    $scope.updtMarkerLocation = function(e, mrk, mrkType) {
        var lat = e.latLng.lat();
        var lng = e.latLng.lng();
        markersRef.child(mrkType).child(mrk).child("lat").set(lat);
        markersRef.child(mrkType).child(mrk).child("lng").set(lng);
    };

    $scope.removeMarker = function(mrk) {
        markersRef.child(mrk.key).remove();
        $scope.saveMsg('He quitado un bache <img src="img/icons/game/bache.jpg" style="height:20px; width:20px;"><a href="#/' + $scope.city + '?lat=' + mrk.lat + '&lng=' + mrk.lng + '&zoom=19">Ver Bache</a>');
    };

    $scope.editComments = function() {
        $scope.editingComments = true;
    };

    $scope.autorizar = function(marker) {
        markersRef.child(marker.markerType).child(marker.markerKey).update({
            autorizado: marker.autorizado
        });
    }

    $scope.saveRepared = function(marker) {
        var storageRef = firebase.storage().ref();
        var uploadTask = storageRef.child("/" + marker.file.name).put(marker.file);
        uploadTask.on('state_changed', function(snapshot) {}, function(error) {}, function() {
            $scope.saveMsg('hemos reparado un bache <a href="#/' + $scope.city + '?lat=' + marker.lat + '&lng=' + marker.lng + '&zoom=19">Ver Bache</a>');
            markersRef.child(marker.key).update({
                photoReparado: uploadTask.snapshot.downloadURL
            }, function() {
                sweet.show({
                    title: 'Muchas Gracias!',
                    text: 'Has hecho un cambio muy grande',
                    type: 'success',
                });
                $scope.editingComments = false;
            });

        });
    };

    $scope.save = function(marker) {

        if (typeof F.user.key !== "undefined") {

            switch (marker.nivel) {
                case 'Chico':
                    marker.nivelId = 1;
                    break;
                case 'Mediano':
                    marker.nivelId = 2;
                    break;
                case 'Grande':
                    marker.nivelId = 3;
                    break;
            };

            if (typeof marker.file !== "undefined") {
                var storageRef = firebase.storage().ref();
                var uploadTask = storageRef.child("/" + marker.file.name).put(marker.file);

                uploadTask.on('state_changed', function(snapshot) {
                    $scope.uploading = true;
                }, function(error) {
                    $scope.uploading = false;
                }, function() {
                    var key;

                    $scope.saveMsg('He modificado informacion del bache <a href="#/' + $scope.city + '?lat=' + marker.lat + '&lng=' + marker.lng + '&zoom=19">Ver Bache</a>');

                    if (typeof marker.key === "undefined") {

                        key = markersRef.child(marker.type).push().key;
                        $scope.saveMsg('He agregado un nuevo bache <img src="img/icons/game/bache.jpg" style="height:20px; width:20px;"><a href="#/' + $scope.city + '?lat=' + marker.lat + '&lng=' + marker.lng + '&zoom=19">Ver Bache</a>');

                        sweet.show({
                            title: 'Muchas Gracias!',
                            text: 'Ahora eres parte del cambio y de un mundo mejor',
                            type: 'success',
                        });

                        F.db.child("users").child(F.user.key).child(marker.type).once("value", function(snapshot) {
                            var baches = snapshot.val();
                            baches++;
                            F.db.child("users").child(F.user.key).child("baches").set(baches);
                            F.db.child("maps").child($routeParams.map).child("users").child("suscriptions").child(F.user.key).child("baches").set(baches);
                        });

                        F.db.child("users").child(F.user.key).child("estadisticas").child(marker.type).once("value", function(snapshot) {
                            var contador = 1;
                            if (snapshot.exists()) {
                                contador = snapshot.val() + 1;
                            }
                            F.db.child("users").child(F.user.key).child("estadisticas").child(marker.type).set(contador);
                        });

                        F.db.child("reportes").child("totales").child("pendientes").once("value", function(snapshot) {
                            var contador = 1;
                            if (snapshot.exists()) {
                                contador = snapshot.val() + 1;
                            }
                            F.db.child("reportes").child("totales").child("pendientes").set(contador);
                        });


                    }
                    else {
                        key = marker.key;
                    }

                    markersRef.child(key).update(marker);

                    markersRef.child(key).update({
                        key: key,
                        photo: uploadTask.snapshot.downloadURL
                    });

                    $scope.uploading = false;
                    $scope.editingComments = false;
                    $scope.closeDialog();
                });

            }
            else {
                if (typeof marker.key !== "undefined") {
                    markersRef.child(marker.key).update(marker);
                    $scope.editingComments = false;
                    $scope.closeDialog();
                }
                else {
                    sweet.show({
                        title: 'Falta imagen!',
                        text: 'Debes subir una imagen',
                        type: 'error',
                    });
                }
            }
        }
        else {
            F.getUser();
        }

    };

    $scope.saveMsg = function(msg) {
        if (F.user) {
            if ((msg !== '') && (typeof msg !== 'undefined')) {
                chatRef.child('General').push({
                    user: F.user.trainer,
                    user_id: F.user.key,
                    team: F.user.team,
                    msg: msg,
                    time: firebase.database.ServerValue.TIMESTAMP,
                    user_photo: angular.isDefined(F.user.photoURL) ? F.user.photoURL : null
                });
            }
        }
        else {
            F.getUser();
        }
    };

    $scope.createUrlShare = function(location, icon, zoom) {
        return "http://maps.googleapis.com/maps/api/staticmap?center=" + location + "&zoom=" + zoom + "&scale=1&size=600x300&maptype=roadmap&format=jpg&visual_refresh=true&markers=icon:http://appdelcambio.com/img/favicon/android-icon-48x48.png%7Cshadow:true%7C" + location + "&key=AIzaSyDvhJ1afQl92WuP2bKn4zlXg8Akxix86F8";
    }

    $scope.suscribeMe = function() {
        F.suscribeMe(F.mapData, F.user);
    }

    $scope.unSuscribe = function() {
        F.unSuscribe(F.mapData, F.user);
    }

    $scope.goToMyLocation = function() {
        
        var latLng = new google.maps.LatLng(F.position.coords.latitude, F.position.coords.longitude); //Makes a latlng
        var image = './img/icons/google/blue_dot.png';
        var marker = new google.maps.Marker({
            position: latLng,
            title: "Im Here!!",
            icon: image
        });
        marker.setMap($scope.vm.map);
        $scope.vm.map.panTo(latLng);
    };

    var initPosition = function() {
        $scope.center = {};
        /*if (typeof $routeParams.lat === 'undefined' && typeof $routeParams.lng === 'undefined') {
            $scope.center.lat = F.position.coords.latitude;
            $scope.center.lng = F.position.coords.longitude;
            $scope.center.zoom = 14;
        }
        else {*/
            $scope.center.lat = $routeParams.lat;
            $scope.center.lng = $routeParams.lng;
            $scope.center.zoom = $routeParams.zoom;
        /*}*/
    }

    var initLoggedIn = function() {
        F.getSubscribe(F.user.key, $routeParams.map);
        F.db.child("maps").child($routeParams.map).child("users").child("exceptions").child(F.user.key).child("map").on("value", function(snapshot) {

            if (snapshot.exists()) {
                $scope.mapPrivileges = snapshot.val();
            }
            else {
                $scope.mapPrivileges = true;
            }

            $timeout(function() {});
        });

        mapRef.child('users').child('admins').child(F.user.key).on("value", function(snapshot) {
            if (snapshot.exists()) {
                F.admin = true;
                $scope.admin = true;
                $timeout(function() {});
            }
        });

        mapRef.child('users').child('owners').child(F.user.key).on("value", function(snapshot) {
            if (snapshot.exists()) {
                F.admin = true;
                $scope.admin = true;
                $timeout(function() {});
            }
        });

        suscriptionsRef.on("value", function(snapshot) {
            $scope.ImHere = false;
            snapshot.forEach(function(childSnapshot) {
                var key = childSnapshot.key;
                if (key === F.user.key) {
                    $scope.ImHere = true;
                    $timeout(function() {});
                }
            });
        });
    }

    $scope.$watch(function() {
        if (typeof F.user !== "undefined") {
            return F.user.key;
        }
    }, function(NewValue, OldValue) {
        if (typeof NewValue !== "undefined") {
            initLoggedIn();
        }
    });

    /*$scope.$watch(function() {
        return F.position;
    }, function(NewValue, OldValue) {
        if (typeof NewValue !== "undefined") {
            initPosition();
        }
    });*/
    
    initPosition();

}]);