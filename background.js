
var GitHub = {
  init: function () {
    this.checkStatus();
    setInterval(this.checkStatus, 30000);
  },
  lastStatusNotification: null,
  lastStatus: "",
  checkStatus: function () {
    $.ajax({
      url: "https://status.github.com/status.json", 
      success: function (data) {
        var json = JSON.parse(data);
        console.log(json);
        if (GitHub.lastStatus != json.status) {
          GitHub.lastStatus = json.status;
          var icon = "trafficlight_red.png";
          if (json.status == "minorproblem") {
            icon = "trafficlight_yellow.png";
          }
          if (json.status == "good") {
            icon = "trafficlight_green.png";
          }
          GitHub.lastStatusNotification = window.webkitNotifications.createNotification(icon, "GitHub status changed", "Status is now '" + json.status + "'")
          GitHub.lastStatusNotification.show();
        }
      }
    });
  }
}

GitHub.init();

var github = new OAuth2('github', {
  client_id: 'e0c3e0e9301128108d8b',
  client_secret: 'a6da7025cbaf83663fcfc062c4d42de8b5aaeeae'
});

github.authorize(function() {
  alert("Have auth!");
});





/*


n = window.webkitNotifications.createNotification('icon.png', 'Notify me', 'This is the notification body');
n.show();
setInterval(function () {
  console.log(n)
}, 5000);

setTimeout(function () { n.hide }, 10000);

*/