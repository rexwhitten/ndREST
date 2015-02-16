/// <reference path="lib/jquery.js" />
/// <reference path="lib/head.js" />
/// <reference path="lib/basil.js" />
/// <reference path="lib/Base64.js" />
/// <reference path="lib/bootstrap.js" />
/// <reference path="lib/URI.js" />
/// <reference path="app/NDRest.js" />


/**
 * @description loading libraries
 */

var libs = [
    "Content/js/lib/jquery.js",
    "Content/js/lib/bootstrap.js",
    "Content/js/lib/basil.js",
    "Content/js/lib/Base64.js",
    "Content/js/lib/URI.js"
];

var apps = [
    "Content/js/app/NDRest.js",
    "Content/js/app.js"
];


head.load(libs, function () {
    /**
    *  Now we can load the application
    */
    
    head.load(apps, function () {
        /**
        * application is ready
        */
        console.log("ready");
    });
});

