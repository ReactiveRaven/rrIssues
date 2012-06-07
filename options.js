$(function () {
  $("input,checkbox,textarea,radio,checkbox").not("[type=submit],[type=image]").jqBootstrapValidation(
    {
      submitSuccess: function ($form, event) {
        event.preventDefault();
        alert("TODO!");
      }
    }
  );
    
  
});