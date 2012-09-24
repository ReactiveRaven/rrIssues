$(function () {
  $("input,checkbox,textarea,radio,checkbox").not("[type=submit],[type=image]").jqBootstrapValidation(
    {
      submitSuccess: function ($form, event) {
        event.preventDefault();
        alert("Prevented submit");
      }
    }
  );
    
  var names = [];
  $("input[type=radio]").each(function (i, el) {
    names.push(el.attr("name"));
  });
  
  names = $.grep(names,function(v,k){
    return $.inArray(v,names) === k;
  });
  
  $.each(names, function (i, el) {
    var val = window.localStorage.getItem("GitHub_Preferences_" + el);
    if (val == "false") {
      val = false;
    }
    if (val) {
      $("input[type=radio][name=" + el + "][value=true]").attr("checked", "checked");
    } else {
      $("input[type=radio][name=" + el + "][value=false]").attr("checked", "checked");
    }
  });
  
  $("input[type=radio]").click(function () {
    var $this = $(this);
    if ($this.val() === "true") {
      
    }
  })
  
});