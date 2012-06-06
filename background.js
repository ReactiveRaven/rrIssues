
var GitHub = {
  init: function () {
    $.each(GitHub.checks, function (i, el) {
      if (!el.requires) {
        el.init();
      }
    });
  },
  user: {
    login: "ReactiveRaven"
  },
  classifyColour: function (colour) {
    
    var rgb = hexToRgb(colour);
    var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    
    var hue = hsl[0]*360;
    var sat = hsl[1];
    if (sat < 0.5) {
      return "blue"; // low saturation, not a colour worth highlighting
    }
    
    hue = hue % 360;
    if (hue < 0) {
      hue += 360;
    }
    if (hue > 300 || hue < 20) {
      return "red";
    } else if (hue <= 70) {
      return "yellow";
    } else if (hue < 160) {
      return "green";
    } else {
      return "blue";
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
    
    
    
    
    events: {
      init: function () {
        var that = GitHub.checks.events;
        
        // disabled for now!
        
        //that.run();
        //setInterval(that.run, 15*1000);
      },
      requires: {
        oauth: true
      },
      run: function () {
        $.ajax({
          url: "https://api.github.com/repos/coolpink/DFS/issues/events",
          data: {
            access_token: GitHub.checks.oauth.connection.getAccessToken()
          },
          success: function (data) {
            console.log(data);
          }
        });
      }
    },
    
    
    
    
    myIssues: {
      firstRun: true,
      init: function () {
        GitHub.checks.myIssues.run();
        setInterval(GitHub.checks.myIssues.run, 2 * 1000);
      },
      requires: {
        oauth: true
      },
      issues: {},
      receive: function (data) {
        var that = GitHub.checks.myIssues;
        var newIssues = [];
        var closedIssues = [];
        var reTag = [];
        var reMilestone = [];
        var reComment = [];
        
        var newIssueIds = $.map(data, function (el, i) {
          return el.id;
        });
        $.each(that.issues, function (i, el) {
          if ($.inArray(el.id, newIssueIds) < 0) {
            closedIssues.push(el);
            delete that.issues[el.id];
          }
        })
        
        $.each(data, function (i, el) {
          if (!that.issues[el.id]) {
            that.issues[el.id] = el;
            if (!that.firstRun) {
              newIssues.push(el);
              var newEl = $.extend({}, el, true);
              newEl.milestone = null;
              newEl.labels = [];
              that.issues[el.id] = newEl;
            }
          }
          
          if ((that.issues[el.id].milestone || el.milestone) && (!!that.issues[el.id].milestone != !!el.milestone || that.issues[el.id].milestone.number != el.milestone.number)) {
            reMilestone.push(el);
          }
          
          if (el.comments - that.issues[el.id].comments > 0) {
            el.oldComments = that.issues[el.id].comments;
            reComment.push(el);
          }
          
          var oldLabelNames = $.map(that.issues[el.id].labels, function (item) {
            return item.name;
          });
          var newLabelNames = $.map(el.labels, function (item) {
            return item.name;
          });
          var tagDiff = (
            $.map(
              $.grep(
                oldLabelNames, 
                function (item) {
                  return $.inArray(item, newLabelNames) < 0;
                }
              ), 
              function (item) { 
                return "-" + item
              }
            ).concat(
              $.map(
                $.grep(
                  newLabelNames, 
                  function (item) { 
                    return $.inArray(item, oldLabelNames) < 0;
                  }
                ), 
                function (item) { 
                  return "+" + item; 
                }
              )
            )
          );
          if (tagDiff.length) {
            el.oldLabels = that.issues[el.id].labels;
            reTag.push(el);
          }
          that.issues[el.id] = el;
        });
        
        $.each(newIssues, function (i, el) {
          var title = "[" + el.repository.name + "] #" + el.number + " " + el.title;
          var body = "New issue assigned to you";
          if (el.comments > 0) {
            body = "Issue reopened or reassigned to you";
          }
          var icon = "images/exclamation_red.png";

          var notification = window.webkitNotifications.createNotification(icon, title, body);
          notification.onclick = function () {
            chrome.tabs.create({url: el.repository.html_url + "/issues/" + el.number});
            notification.cancel();
          }
          notification.show();
          notification.ondisplay = function () {
            setTimeout(function () {
              notification.cancel();
            }, 15000);
          }
        });
        
        $.each(closedIssues, function (i, el) {
          var title = "[" + el.repository.name + "] #" + el.number + " " + el.title;
          var body = "Issue closed or reassigned";
          var icon = "images/exclamation_green.png";

          var notification = window.webkitNotifications.createNotification(icon, title, body);
          notification.onclick = function () {
            chrome.tabs.create({url: el.repository.html_url + "/issues/" + el.number});
            notification.cancel();
          }
          notification.show();
          notification.ondisplay = function () {
            setTimeout(function () {
              notification.cancel();
            }, 15000);
          }
        })
        
        $.each(reMilestone, function (i, el) {
          var title = "[" + el.repository.name + "] #" + el.number + " " + el.title;
          var body = "Milestone cleared";
          var icon = "images/calendar_blue.png";
          if (el.milestone && el.milestone.title) {
            title = "[" + el.repository.name + "] #" + el.number + " " + el.title;
            body = "Moved to milestone '" + el.milestone.title + "'";
            if (el.milestone.due_on) {
              var time_until_due = +new Date(el.milestone.due_on) - +new Date();
              if (time_until_due < 0) {
                icon = "images/calendar_red.png";
              } else if (time_until_due < 1000 * 60 * 60 * 24 * 2) {
                icon = "images/calendar_yellow.png";
              } else {
                icon = "images/calendar_green.png";
              }
            }
          }
          var notification = window.webkitNotifications.createNotification(icon, title, body);
          notification.onclick = function () { 
            chrome.tabs.create({url: el.repository.html_url + "/issues/" + el.number});
            notification.cancel();
          }
          notification.ondisplay = function () {
            setTimeout(function () {
              notification.cancel();
            }, 15 * 1000);
          }
          notification.show();
        });
        
        $.each(reComment, function (i, el) {
          var numNew = el.comments - el.oldComments;
          
          $.ajax({
            url: el.url + "/comments",
            data: {
              access_token: GitHub.checks.oauth.connection.getAccessToken(),
              per_page: 100
            },
            success: function (data) {
              $.each(data.slice(-numNew), function (j, comment) {
                var title = "[" + el.repository.name + "] #" + el.number + " " + el.title;
                var body = "@" + comment.user.login + " said: " + comment.body;
                var icon = comment.user.avatar_url;
                
                var notification = window.webkitNotifications.createNotification(icon, title, body);
                notification.onclick = function () { 
                  chrome.tabs.create({url: el.repository.html_url + "/issues/" + el.number + "#issuecomment-" + comment.id});
                  notification.cancel();
                }
                notification.ondisplay = function () {
                  setTimeout(function () {
                    notification.cancel();
                  }, 15 * 1000);
                }
                notification.show();
              });
            }
          });
          
        });
        
        $.each(reTag, function (i, el) {
          var oldLabelNames = $.map(el.oldLabels, function (item) {
            return item.name;
          });
          var newLabelNames = $.map(el.labels, function (item) {
            return item.name;
          });
          
          var tagDiff = (
            $.grep(
              oldLabelNames, 
              function (item) {
                return $.inArray(item, newLabelNames) < 0;
              }
            ).concat(
              $.grep(
                newLabelNames, 
                function (item) { 
                  return $.inArray(item, oldLabelNames) < 0;
                }
              )
            )
          );
          
          $.each(el.labels, function (i, label) {
            if ($.inArray(label.name, tagDiff) >= 0) {
              var title = "[" + el.repository.name + "] #" + el.number + " " + el.title;
              var body = "ADDED '" + label.name + "'";
              var icon = "images/tag_" + GitHub.classifyColour(label.color) + ".png";
              
              var notification = window.webkitNotifications.createNotification(icon, title, body);
              notification.onclick = function () { 
                chrome.tabs.create({url: el.repository.html_url + "/issues/" + el.number});
                notification.cancel();
              }
              notification.ondisplay = function () {
                setTimeout(function () {
                  notification.cancel();
                }, 15 * 1000);
              }
              notification.show();
            }
          })
          
          $.each(el.oldLabels, function (i, label) {
            if ($.inArray(label.name, tagDiff) >= 0) {
              var title = "[" + el.repository.name + "] #" + el.number + " " + el.title;
              var body = "REMOVED '" + label.name + "'";
              var icon = "images/tag_" + GitHub.classifyColour(label.color) + ".png";
              
              var notification = window.webkitNotifications.createNotification(icon, title, body);
              notification.onclick = function () { 
                chrome.tabs.create({url: el.repository.html_url + "/issues/" + el.number});
                notification.cancel();
              }
              notification.ondisplay = function () {
                setTimeout(function () {
                  notification.cancel();
                }, 15 * 1000);
              }
              notification.show();
            }
          })
        });
        
        that.firstRun = false;
      },
      run: function () {
        $.ajax(
          {
            url: "https://api.github.com/issues",
            data: {
              access_token: GitHub.checks.oauth.connection.getAccessToken(),
              per_page: 100
            },
            success: GitHub.checks.myIssues.receive
          }
        );
      }
    },
    
    
    
    
    status: {
      init: function () {
        GitHub.checks.status.run();
        setInterval(GitHub.checks.status.run, 60*1000);
      },
      lastString: "",
      run: function () {
        var that = GitHub.checks.status;
        $.ajax({
          url: "https://status.github.com/status.json", 
          success: function (data) {
            var json = JSON.parse(data);
            if (that.lastString != json.status) {
              if (that.lastNotification) {
                that.lastNotification.cancel();
              }
              
              var lastLastString = that.lastString;
              that.lastString = json.status;
              
              var icon = "images/trafficlight_red.png";
              if (json.status == "minorproblem") {
                icon = "images/trafficlight_yellow.png";
              }
              if (json.status == "good") {
                icon = "images/trafficlight_green.png";
              }
              
              if (lastLastString.length) {
                that.lastNotification = window.webkitNotifications.createNotification(icon, "GitHub status changed", "Status is now '" + json.status + "'")
                that.lastNotification.show();
              } else if (json.status != "good") {
                that.lastNotification = window.webkitNotifications.createNotification(icon, "GitHub is unwell", "Status is currently '" + json.status + "'");
              }
              
              if (that.lastNotification) {
                that.lastNotification.onclick = function () {chrome.tabs.create({url: "http://status.github.com"});that.lastNotification.cancel();};
                that.lastNotification.show();
              }
            }
          }
        });
      }
    }
    
    
    
    
  }
}

GitHub.init();

function extractHue(color) {
  var rgb = hexToRgb(color);
  
  return rgbToHsl(rgb[0], rgb[1], rgb[2])[0]*360;
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  var r = parseInt(hex.substr(0,2), 16); // Grab the hex representation of red (chars 1-2) and convert to decimal (base 10).
  var g = parseInt(hex.substr(2,2), 16);
  var b = parseInt(hex.substr(4,2), 16);
  
  return [r, g, b];
}

function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r:h = (g - b) / d + (g < b ? 6 : 0);break;
            case g:h = (b - r) / d + 2;break;
            case b:h = (r - g) / d + 4;break;
        }
        h /= 6;
    }

    return [h, s, l];
}