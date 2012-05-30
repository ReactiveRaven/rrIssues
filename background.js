
var GitHub = {
  init: function () {
    $.each(GitHub.checks, function (i, el) {
      if (!el.requires) {
        el.init();
      }
    });
  },
  oauth: {
    init: function () {
      this.connection = new OAuth2('github', {
        client_id: 'e0c3e0e9301128108d8b',
        client_secret: 'a6da7025cbaf83663fcfc062c4d42de8b5aaeeae',
        api_scope: "user,repo,gist"
      });
      this.connection.authorize(GitHub.oauth.onAuthorised);
    },
    onAuthorised: function () {
      $.each(GitHub.checks, function (i, el) {
        if (el.requires.auth) {
          el.init();
        }
      });
      GitHub.checks.issues.init();
    }
  },
  checks: {
    
    
    
    
    oauth: {
      init: function () {
        GitHub.checks.oauth.connection = new OAuth2('github', {
          client_id: 'e0c3e0e9301128108d8b',
          client_secret: 'a6da7025cbaf83663fcfc062c4d42de8b5aaeeae'
        });
        GitHub.checks.oauth.connection.authorize(GitHub.checks.oauth.run);
      },
      run: function () {
        $.each(GitHub.checks, function (i, el) {
          if (el.requires && el.requires.oauth) {
            el.init();
          }
        });
      }
    },
    
    
    
    
    newIssues: {
      init: function () {
        alert("New Issues check init goes here");
      },
      requires: {
        oauth: true
      }
    },
    
    
    
    
    status: {
      init: function () {
        GitHub.checks.status.run();
        setInterval(GitHub.checks.status.run, 60*1000);
      },
      run: function () {
        $.ajax({
          url: "https://status.github.com/status.json", 
          success: function (data) {
            var json = JSON.parse(data);
            if (GitHub.checks.status.lastString != json.status) {
              if (GitHub.checks.status.lastNotification) {
                GitHub.checks.status.lastNotification.cancel();
              }
              GitHub.checks.status.lastString = json.status;
              var icon = "trafficlight_red.png";
              if (json.status == "minorproblem") {
                icon = "trafficlight_yellow.png";
              }
              if (json.status == "good") {
                icon = "trafficlight_green.png";
              }
              GitHub.checks.status.lastNotification = window.webkitNotifications.createNotification(icon, "GitHub status changed", "Status is now '" + json.status + "'")
              GitHub.checks.status.lastNotification.show();
            }
          }
        });
      }
    }
    
    
    
    
  },
  onAuthorised: function () {
    var token = GitHub.oauth.getAccessToken();
    $.ajax(
      {
        url: "https://api.github.com/user/repos",
        data: {
          access_token: token,
          per_page: 100
        },
        success: function (data) {
          $.each(data, function (i, el) {
            alert(el.name);
          });
        }
      }
    );
    $.ajax(
      {
        url: "https://api.github.com/issues",
        data: {
          access_token: token,
          per_page: 100
        },
        success: function (data) {
          $.each(data, function (i, el) {
            var title = "#" + el.number + " in " + el.repository.name;
            var body = "@" + el.user.login + " said: " + el.title;
            var icon = el.user.avatar_url;

            var notification = window.webkitNotifications.createNotification(icon, title, body);
            notification.show();
            notification.ondisplay = function () {
              setTimeout(function () {
                notification.cancel();
              }, 15000);
            }
          });
        }
      }
    )
  }
}

GitHub.init();