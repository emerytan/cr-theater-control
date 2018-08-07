requirejs.config({
	baseUrl: 'scripts',
	paths: {
		'io': 'lib/socket.io-client/socket.io',
		'jquery': 'lib/jquery',
		'jquery-ui': 'lib/jquery-ui',
		'jquery-ui-touch': 'lib/jquery-ui-touch',
		'jqxcore': 'lib/jqxcore',
		'jqxSwitchButton': 'lib/jqxswitchbutton',
		'jqxButton': 'lib/jqxbuttons',	
		'jqxButtonGroup': 'lib/jqxbuttongroup',
		'jqxcheckbox': 'lib/jqxcheckbox',
		'jqxTouch': 'lib/jqxtouch',
		'jqxDropDownList': 'lib/jqxdropdownlist',
		'jqxscrollbar': 'lib/jqxscrollbar',
		'jqxlistbox': 'lib/jqxlistbox',
		'bsModal': 'lib/bootstrap/js/bootstrap',
		'app': 'eta/app',
		'socketRouter': 'eta/socketRouter',
		'deviceTabs': 'eta/deviceTabs',
		'integraModule': 'eta/integraModule',
		'uiMaster': 'eta/uiMaster',
		'quickSetups': 'eta/quickSetups',
		'logModule': 'eta/logModule',
		'lightsModule': 'eta/lightsModule',
		'projectorModule': 'eta/projectorModule',
		'maskingModule': 'eta/maskingModule'
	},
	shim: {
		'jquery-ui-touch': ['jquery-ui'],
		'bsButton': {
			deps: ['jquery'],
			exports: '$.fn.button'
		},
		"jqxcore": {
			export: "$",
			deps: ['jquery']
		},
		"jqxSwitchButton": {
			deps: ["jquery", "jqxcore", "jqxcheckbox"],
			export: "$"
		},
		"jqxcheckbox": {
			deps: ["jquery", "jqxcore"],
			export: "$"
		},
		"jqxButton": {
			deps: ["jquery", "jqxcore"],
			export: "$"
		},
		"jqxButtonGroup": {
			deps: ["jquery", "jqxcore"],
			export: "$"
		},
		"jqxTouch": {
			deps: ["jquery", "jqxcore"],
			export: "$"
		},
		'bsModal': {
			deps: ['jquery'],
			exports: '$.fn.modal'
		},
        'jqxscrollbar': {
            deps: ["jquery", "jqxcore"],
            exports: "$"
        },
        'jqxlistbox': {
            deps: ["jquery", "jqxcore"],
            exports: "$"
        },
        'jqxDropDownList': {
			deps: ["jquery", "jqxcore", "jqxscrollbar", "jqxlistbox"],
			exports: "$"
		}
	}
});

require(['app'], function (App) {
	App.initialize();
})
