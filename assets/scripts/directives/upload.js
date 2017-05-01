angular.module('myApp').directive('chooseFile', function() {
  return {
    link: function(scope, elem, attrs) {
      var button = elem.find('button');
      var input = angular.element(elem[0].querySelector('input#fileInput'));

      button.bind('click', function() {
        input[0].click();
      });

      input.bind('change', function(e) {
        scope.$apply(function() {
          var files = e.target.files;
          if (files[0]) {
            if (typeof scope.marker !== "undefined") {
              scope.marker.fileName = files[0].name;
              scope.marker.file = files[0];
            }
            else {
              scope.Info.fileName = files[0].name;
              scope.Info.file = files[0];
            }
          }
          else {
            if (typeof scope.marker !== "undefined") {
              scope.marker.fileName = null;
            }
            else {
              scope.Info.fileName = null;
            }
          }
        });
      });
    }
  };
});