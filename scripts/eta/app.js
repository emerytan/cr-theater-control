define(["jquery",
        "jqxcore",
        "jqxButton",
        "jqxSwitchButton",
        "jqxButtonGroup",
        "jqxcheckbox",
        "jqxTouch",
        "jquery-ui",
        "jquery-ui-touch",
        "bsModal",
        "jqxDropDownList"
      ], function () {

  var initialize = function () {
    
    require(['socketRouter', 'deviceTabs', 'lightsModule']);

  };
  return {
    initialize: initialize
  };
});
