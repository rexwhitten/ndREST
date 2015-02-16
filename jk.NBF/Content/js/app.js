/// <reference path="_references.js" />

/**
 * @class NBFDocument 
 * @description  NBF document Model that will be saved to the database
 */
var NBFDOcument = function (obj) {
    var self = {};

    self.DocumentId = new Number();
    self.NetDocumentsNumber = new String();
    self.NetDocumentsURL = new String();
    self.NetDocumentsDescription = new String();
    self.WorlDoxNumbers = new String();
    self.DocTypeId = new String();
    self.NBF_Key = new String();


    if (obj) {
        self.DocumentId = obj.DocumentId;
        self.NetDocumentsNumber = obj.NetDocumentsNumber;
        self.NetDocumentsURL = obj.NetDocumentsURL;
        self.NetDocumentsDescription = obj.NetDocumentsDescription;
        self.WorlDoxNumbers = obj.WorlDoxNumbers;
        self.DocTypeId = obj.DocTypeId;
        self.NBF_Key = obj.NBF_Key;
    }

    return self;
}



/**
 * @module nbf/client
 * @description NBF Netdocuments lookup object
 */
var NdClient = function (options) {
    /**
     * Base Object
     */
    var self = {};

    /**
     * @description: Options object that is loaded
     */
    self.options = options;

    /**
     *
     * @description Cache object
     */
    var _cache = new window.Basil({
        namespace: "jk-nd",
        storages: ['cookie', 'local']
    });

    /**
     * @description netdocuments context objects
     */
    self.nd = {
        code: _cache.get("code"),
        token: _cache.get("token"),
        myUrl: null,
        requestDigest: null,
        search: null,
        params: ""
    };

    /**
     * View/NBF Query Parameters
     * @description Load the NBF query View
     */
    self.view_nbf = function () {
        var $view_nbf = $('#view_nbf');
        var $ul = $('<ul></ul>');
        $ul.addClass("list-group");
        var params = {}, queries, temp, i, l;

        // Split into key/value pairs
        var queryString = window.location.search;
        queries = queryString.split("&");

        // Convert the array of strings into an object
        for (i = 0, l = queries.length; i < l; i++) {
            temp = queries[i].split('=');
            params[temp[0]] = temp[1];
        }
        
        for (var member_index in params) {
            var $li = $("<li></li>");
            $li.addClass("list-group-item");
            $li.append("<span class='text-primary' style='margin-right:50px'>" + member_index.replace("?","") + "</span>");
            $li.append("<span class='text-info'>" + params[member_index] + "</span>");
            $ul.append($li);
        }

        $view_nbf.empty();
        $view_nbf.append($ul);
    }

    /**
     * View/NetDocuments List
     * @description Load 
     */
    self.view_docs = function () {

    };

    /**
     * Loads the available Save/Update Actions
     * @description NBF Netdocuments View
     */
    self.view_actions = function () {

    };

    /**
     * @description netdocuments library 
     */
    self.ndREST = NetDocs(null, null);

    /**
     * @description Validates if the user is authenticated with netdocuments
     */
    self.IsAuthenticated = function (check_ballback) {
        self.ndREST = NetDocs(self.options.BaseNetDocsUrl, self.nd.token);
        self.ndREST.user.getCabinets({
            success: function (cabinets) {
                console.log("user is authenticated");
                check_ballback(true);
            },
            error: function (e,t,j) {
                console.log("error authenticating: " + j);
                check_ballback(false);
            }
        });
    }

    /**
     * @description handles when a user is not authenticated to netdocuments
     */
    self.UnAuthenticated = function () {
        console.log("unauthetnicated");
        window.location = "login.html";
    };

    /**
     * @description load the app
     */
    self.Load = function () {
        console.log("loading app");

        // check for debug mode, set the access code and access tokens
        // Access Code
        self.nd.code = "njAGtL6H4wk9rO+YRsmYMtYQTPsdenZYwtRa/9YHgCZPQ9HWJS4Cf/OyR3syuXMfAsVr5PxionIrUSKxcuH7jjjfl57bZFyiDlPGPUj99WR+fI1ZhtGGSJkZMjJBXh50";
        _cache.set("code", self.nd.code, { 'expireDays': .5 });
        // Access Token
        self.nd.token = "aCKcVaIWpqYAipR335lSV/kUIzncLOkptBG3d734hrWoKEqn0WrV2HLjb7Et/FqhFlWDi4F/PIw2IkcuxcW7ZvU1jQN5+OwJ128EkEiXTwNlINU1/O/+A2+SR4wRbyYH";
        _cache.set("token", self.nd.token, { 'expireDays': .5 });
        
        // Check to see if the tokens are present 
        if (_cache.get("token") == null || _cache.get("code") == null) {
            if (self.options.debug) {
                console.log("DEBUG: using hardcoded netdocs access");
            }
            else
            {
                self.UnAuthenticated();
            }
        }
        else
        {
            console.log("tokens are present");
            self.nd.code = _cache.get("code");
            self.nd.token = _cache.get("token");
        }

        // Validate Authentication
        self.IsAuthenticated(function (auth) {
            if (auth == true) {
                console.log("user is authenticated to netdocuments");
                // Load Views
                self.view_nbf();
                self.view_docs();
                self.view_actions();
            }
            else {
                console.log("user is authenticated NOT to netdocuments");
                if (self.options.debug == false) {
                    self.UnAuthenticated();
                }
            }
        });
    }

    /**
     *  call Load
     */
    self.Load();
    // -------------------------------------------------------------------------------------------------------
    return self;
};


/**
*   ND Client Instance
*/
var nbfNdClient = new NdClient({
    debug: true,
    BaseNetDocsUrl: "https://api.vault.netvoyage.com",
    Privileges: "full",
    ClientId: "AP-WXJAQSGO", // THIS NEEDS TO BE SET
    ClientSecret: "0VwqE6f4b9ErcDFRbivG6J42QzisW5maYyLD6GGHH4OGLd3q", // THIS NEEDS TO BE SET
    OAuthURL: "https://vault.netvoyage.com/neWeb2/OAuth.aspx",
    cabinetName: "Client Documents",
    fullURL: function (debug) {
        var url = "";

        if (debug) {
            url = url + this.OAuthURL + '?client_id=' + this.ClientId + '&scope=' + this.Privileges + '&response_type=code&redirect_uri=' + "http://localhost/index.html";
        } else {
            url = url + this.OAuthURL + '?client_id=' + this.ClientId + '&scope=' + this.Privileges + '&response_type=code&redirect_uri=' + $(location).attr('href').split('?')[0];
        }

        return url;
    },
    auth_url: function (debug) {
        var url = "";
        var m_base_url = "login.html";

        if (debug) {
            url = url + m_base_url + '?client_id=' + this.ClientId + '&scope=' + this.Privileges + '&response_type=code&redirect_uri=' + "http://localhost/index.html";
        } else {
            url = url + m_base_url + '?client_id=' + this.ClientId + '&scope=' + this.Privileges + '&response_type=code&redirect_uri=' + $(location).attr('href').split('?')[0];
        }

        return url;
    }
});