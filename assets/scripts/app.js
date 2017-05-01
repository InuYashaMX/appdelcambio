angular.module('myApp', [
        'ngMaterial',
        'ngMessages',
        'ngRoute',
        'googlechart',
        'ngSanitize',
        'ngMap',
        'ngFileUpload',
        '720kb.socialshare',
        'angularMoment',
        'hSweetAlert',
        'chart.js',
        'angularMoment'
    ])
    .config(['$routeProvider', '$mdThemingProvider', function($routeProvider, $mdThemingProvider) {

        $mdThemingProvider.theme('default')
            .primaryPalette('cyan', {
                'default': '600',
            })
            .accentPalette('yellow');

        $routeProvider.
        when('/', {
            templateUrl: 'views/maps.html',
            controller: 'mapsCtrl'
        }).
        when('/new', {
            templateUrl: 'views/new.html',
            controller: 'newCtrl'
        }).
        when('/trainer', {
            templateUrl: 'views/trainer.html',
            controller: 'trainerCtrl'
        }).
        when('/proximamente', {
            templateUrl: 'views/proximamente.html',
            controller: 'proximamenteCtrl'
        }).
        when('/profile/:key', {
            templateUrl: 'views/profile.html',
            controller: 'profileCtrl'
        }).
        when('/:map', {
            templateUrl: 'views/map.html',
            controller: 'mapCtrl'
        }).
        when('/:map/chat', {
            templateUrl: 'views/chat.html',
            controller: 'chatCtrl'
        }).
        when('/:map/chat/:room', {
            templateUrl: 'views/chat.html',
            controller: 'chatCtrl'
        }).
        when('/:map/baches', {
            templateUrl: 'views/baches.html',
            controller: 'bachesCtrl'
        }).
        when('/:map/resumen', {
            templateUrl: 'views/resumen.html',
            controller: 'resumenCtrl'
        }).
        when('/:map/ranking', {
            templateUrl: 'views/ranking.html',
            controller: 'rankingCtrl'
        }).
        when('/:map/funcionarios', {
            templateUrl: 'views/funcionarios.html',
            controller: 'funcionariosCtrl'
        }).
        otherwise({
            redirectTo: '/'
        });
    }])
    .factory("F", ["FB_CONFIG", "$location", "$timeout", "$mdDialog", "$rootScope", "$mdToast", "sweet",
        function(config, $location, $timeout, $mdDialog, $rootScope, $mdToast, sweet) {

            var self = {};
            self.reg;
            self.sub;
            self.isSubscribed = false;
            self.isSuscribe = {};
            self.dominio = "appdelcambio.com";


            self.total = {
                rojo: 0,
                azul: 0,
                amarillo: 0
            };

            var DialogController = function($scope, $mdDialog) {
                $scope.login = function(type, user) {
                    var provider

                    switch (type) {
                        case "google":
                            provider = new firebase.auth.GoogleAuthProvider();
                            firebase.auth().signInWithRedirect(provider);
                            break;
                        case "facebook":
                            provider = new firebase.auth.FacebookAuthProvider();
                            firebase.auth().signInWithRedirect(provider);
                            break;
                        case "mail":
                            $mdDialog.hide();
                            firebase.auth().signInWithEmailAndPassword(user.email, user.password).catch(function(error) {
                                sweet.show({
                                    title: error.code,
                                    text: error.message,
                                    type: 'error'
                                });
                            });

                            break;
                    }


                };

                $scope.register = function(user) {

                    if (user.password == user.confirm_password) {
                        $mdDialog.hide();
                        firebase.auth().createUserWithEmailAndPassword(user.email, user.password).catch(function(error) {
                            sweet.show({
                                title: error.code,
                                text: error.message,
                                type: 'error'
                            });
                        });
                    }
                    else {
                        sweet.show({
                            title: 'Bad password',
                            text: 'Las contraseñas no coinciden',
                            type: 'error'
                        });
                    }

                }

                $scope.retrieve = function(user) {

                    firebase.auth().sendPasswordResetEmail(user.email).then(function() {
                        $mdDialog.hide();
                        sweet.show({
                            title: "Correo Enviado",
                            text: "Se te ha enviado un correo con instrucciones",
                            type: 'success'
                        });

                    }, function(error) {
                        sweet.show({
                            title: error.code,
                            text: error.message,
                            type: 'error'
                        });

                    });
                }

            }

            var suscribeController = function($scope, $mdDialog) {
                $scope.suscribeMe = function() {
                    self.suscribeMe(self.mapData, self.user);
                    $mdDialog.cancel();
                }
            }

            self.loginDialog = function(ev) {
                $mdDialog.show({
                    templateUrl: './views/login.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    controller: DialogController
                });
            }

            self.getUser = function() {
                var user = firebase.auth().currentUser;
                if (user) {
                    self.db.child("users").child(user.uid).once("value", function(snapshot) {
                        self.user = snapshot.val();
                        self.user.key = snapshot.key;
                        if (!snapshot.child("trainer").exists()) {
                            $location.path("/trainer");
                        }
                        else {
                            if ('serviceWorker' in navigator) {
                                console.log('Service Worker is supported');
                                navigator.serviceWorker.register('sw.js').then(function() {
                                    return navigator.serviceWorker.ready;
                                }).then(function(serviceWorkerRegistration) {
                                    self.reg = serviceWorkerRegistration;
                                    if (typeof self.user.device !== "undefined") {
                                        if (typeof self.user.device !== false) {
                                            self.isSubscribed = true;
                                        }
                                    }
                                    else {
                                        self.subscribe();
                                    }

                                }).catch(function(error) {});
                            }

                            var amOnline = self.db.child('.info/connected');
                            var userRef = self.db.child('presence/' + self.user.key);

                            amOnline.on('value', function(snapshot) {
                                if (snapshot.val()) {
                                    userRef.onDisconnect().remove();
                                    userRef.set(true);
                                }
                            });

                            $rootScope.$emit('loggedIn', true);
                        }
                        $timeout(function() {});
                    });
                }
                else {
                    self.loginDialog();
                }
            };

            self.subscribe = function() {
                self.reg.pushManager.subscribe({
                    userVisibleOnly: true
                }).
                then(function(pushSubscription) {
                    self.sub = pushSubscription;
                    var str = self.sub.endpoint;
                    var endpoint = str.replace("https://android.googleapis.com/gcm/send/", "");
                    self.db.child("users").child(self.user.key).child("device").set(endpoint);
                    self.isSubscribed = true;
                });
            }

            //de notificaciones
            self.unsubscribe = function() {
                self.reg.pushManager.getSubscription().then(function(subscription) {
                    subscription.unsubscribe().then(function(successful) {
                        self.isSubscribed = false;
                        self.db.child("users").child(self.user.key).child("device").set(false);
                    }).catch(function(e) {})
                });
            }

            self.resizeImg = function(url, size) {
                var icon = {
                    url: url,
                    scaledSize: new google.maps.Size(size, size),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(0, 0)
                };

                return icon;
            };

            self.getAvatar = function(img) {
                if (typeof img === "undefined") {
                    return "img/default-avatar.png"
                }
                else {
                    return img;
                }
            }

            var updateSuscriptions = function(map) {
                self.db.child("maps").child(map.url).child("users").child("suscriptions").on("value", function(snapshot) {
                    self.db.child("list").child(map.url).child("suscriptions").set(snapshot.numChildren());
                });
            }

            self.suscribeMe = function(map, user) {
                if (typeof user.key !== "undefined") {
                    self.subscribe();
                    self.db.child("maps").child(map.url).child("users").child("suscriptions").child(user.key).set({
                        trainer: user.trainer,
                        key: user.key,
                        photoURL: self.getAvatar(user.photoURL),
                        team: user.team,
                        time: firebase.database.ServerValue.TIMESTAMP,
                        likes: 0,
                        dislikes: 0
                    }, updateSuscriptions(map));

                    self.db.child("users").child(user.key).child("suscriptions").child(map.url).set({
                        map: map.name,
                        url: map.url
                    });

                    self.isSuscribe[map.url] = true;

                    self.showSimpleToast("Gracias por suscribirse a " + map.name);

                }
                else {
                    self.getUser();
                }

            }

            self.unSuscribe = function(map, user) {
                if (typeof user.key !== "undefined") {
                    self.db.child("maps").child(map.url).child("users").child("suscriptions").child(user.key).remove(updateSuscriptions(map));
                    self.db.child('users').child(user.key).child("suscriptions").child(map.url).remove();
                    self.isSuscribe[map.url] = false;
                }
                else {
                    self.getUser();
                }
            }

            self.suscribeDialog = function(ev) {
                $mdDialog.show({
                    templateUrl: './views/subscribe.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    controller: suscribeController
                });
            }

            self.getSubscribe = function(user, map) {
                self.db.child("maps").child(map).child("users").child("suscriptions").child(user).once("value", function(snapshot) {
                    if (!snapshot.exists()) {
                        self.isSuscribe[map] = false;
                    }
                    else {
                        self.isSuscribe[map] = true;
                    }
                });
            };

            self.showSimpleToast = function(text) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent(text)
                    .position('top right')
                    .hideDelay(3000)
                );
            };

            self.timeSince = function(date) {

                var seconds = Math.floor((new Date() - date) / 1000);

                var interval = Math.floor(seconds / 31536000);

                if (interval > 1) {
                    return interval + " years";
                }
                interval = Math.floor(seconds / 2592000);
                if (interval > 1) {
                    return interval + " months";
                }
                interval = Math.floor(seconds / 86400);
                if (interval > 1) {
                    return interval + " days";
                }
                interval = Math.floor(seconds / 3600);
                if (interval > 1) {
                    return interval + " hours";
                }
                interval = Math.floor(seconds / 60);
                if (interval > 1) {
                    return interval + " minutes";
                }
                return Math.floor(seconds) + " seconds";
            }

            self.calcularReputacion = function(profile) {
                var total = profile.likes + profile.dislikes;
                if ((profile.likes > 0) && (total > 0)) {
                    var number = (profile.likes * 5) / total;
                    return number.toFixed(1);
                }
                else {
                    return "0.0";
                }
            }

            self.recordLog = function(params) {

                var data = {
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    map: params.map,
                    mapName: params.mapName,
                    type: params.mrkType,
                    pokemon: params.pokemon,
                    byUserKey: params.user,
                    byUserTrainer: params.trainer,
                    byUserTeam: params.team,
                    toUserKey: params.toUserKey,
                    toUserTrainer: params.toUserTrainer,
                    toUserTeam: params.toUserTeam
                }



                self.db.child("logs").child("maps").child(params.map).push(data);
                self.db.child("logs").child("users").child(params.user).push(data);

                if (params.toUserKey !== null) {
                    self.db.child("logs").child("users").child(params.toUserKey).push(data);
                }
            }

            return self;
        }

    ]);
