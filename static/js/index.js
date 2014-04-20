document.addEventListener('DOMContentLoaded', function (evt) {

  var logoutButton = document.querySelector('#logout');
  if (logoutButton) {
    logoutButton.addEventListener('click', function () {
      var req = new XMLHttpRequest();
      req.open('POST', '/logout');
      req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
      req.addEventListener('load', function () {
        if (req.status === 200) {
          window.location = '/';
        } else {
          window.location = '/';
        }
      }, false);

      req.addEventListener('error', function () {
        window.location = '/';
      }, false);

      req.send(encodeURIComponent('_csrf') + '=' + encodeURIComponent(_csrf));
    });
  }

});
