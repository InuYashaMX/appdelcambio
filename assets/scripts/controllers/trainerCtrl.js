angular.module("myApp").controller("trainerCtrl", ['$scope', 'F', '$timeout', '$location', function($scope, F, $timeout, $location) {

    $scope.ready = false;

    $scope.checkForm = function(user) {
        var disabled = false;

        if ($scope.ready) {
            if ((typeof user.displayName === 'undefined') || (user.displayName === '')) {
                disabled = true;
            }

            if ((typeof user.trainer === 'undefined') || (user.trainer === '')) {
                disabled = true;
            }

            if ((typeof user.team === 'undefined') || (user.team === '')) {
                disabled = true;
            }

            if ((typeof user.phone === 'undefined') || (user.phone === '')) {
                disabled = true;
            }

            if (user.team === "FuncionarioPendiente") {
                if ((typeof user.photo === 'undefined') || (user.photo === '')) {
                    disabled = true;
                }
            }
        }
        else {
            disabled = true;
        }

        return disabled;
    }

    $scope.delete = function(user) {
        var desertRef = firebase.storage().ref().child("/users/" + F.user.key + "/" + user.photoName);
        F.db.child("users").child(F.user.key).child("photo").remove();
        F.db.child("users").child(F.user.key).child("photoName").remove();
        desertRef.delete().then(function() {}).catch(function(error) {});
    }

    $scope.upload = function(user) {
        var storageRef = firebase.storage().ref();
        var uploadTask = storageRef.child("/users/" + F.user.key + "/" + user.file.name).put(user.file);
        uploadTask.on('state_changed', function(snapshot) {}, function(error) {}, function() {
            F.db.child("users").child(F.user.key).update(user);
            F.db.child("users").child(F.user.key).update({
                photo: uploadTask.snapshot.downloadURL,
                photoName: user.file.name
            });
        });
    }

    $scope.saveTrainer = function(user) {
        F.db.child("users").child(F.user.key).update({
            trainer: user.trainer,
            displayName: user.displayName,
            team: user.team,
            phone: user.phone,
            validate: user.trainer.toLowerCase(),
            likes: 0,
            dislikes: 0,
            estadisticas:{
                baches: 0,
                inundaciones: 0,
                alumbrado: 0,
                inseguridad: 0
            }
        });
        $location.path("/chat");
    }

    var initLoggedIn = function() {
        F.db.child("users").child(F.user.key).on("value", function(snapshot) {
            $scope.user = snapshot.val();
            $timeout(function() {});
            $scope.ready = true;
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


}]);