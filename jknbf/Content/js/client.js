/// <reference path="lib/jquery-1.11.0.js" />
/// <reference path="lib/Base64.js" />
/// <reference path="lib/jquery.base64.js" />
/// <reference path="lib/URI.min.js" />
/// <reference path="lib/jstorage.min.js" />
/// <reference path="lib/NDRest.js" />


var NdClient = function (options) {
    var self = {};

    self.options = options;
    
    self.nd = {
        code: "9vj4j6GYd9l0/BQ/SLfealCzY6b3vm/8S9zZrB6SUtauKXYfBxvY4oFHTWFnDGCecrCu/jL/4KlXjNCGo17LMPD8v9VRch4x9EM0FxiFV3JLStKFycoNVj404HoQd899",
        token: "Xho8zpEAvVuL2z33GjEmAL07S2oOjjqFKru29u+hOFrzjs7cgOeLlN3e3rtpSRh7hI2KzOEAc8wEYoXg6te0mofkQAkQsHGdon96xvW01Js2PLk2MQ2eMuqkgDZ9jqtt",
        myUrl: null,
        requestDigest: null,
        search: null,
        params: ""
    };

    self.ndREST = NetDocs(null, null);


    self.load = function (complete_callback) {
        // detect if the codes are in the url 
        if (document.URL.indexOf("?") > 0) {
            this.nd.params = document.URL.split("?")[1].split("&");
            for (var i = 0; i < this.nd.params.length; i = i + 1) {
                var param = this.nd.params[i].split("=");
                switch (param[0]) {
                    case "code":
                        this.nd.code = decodeURIComponent(param[1]);
                        break;
                    case "access_token":
                        this.nd.token = decodeURIComponent(param[1]);
                        break;
                }
            }
        }

        // check and if these are not in the url then load them from cache
        if (this.nd.code == null) {
            this.nd.code = $.jStorage.get("code");
        }

        if (this.nd.token == null) {
            this.nd.token = $.jStorage.get("token");
        }

        if (this.nd.code == null || this.nd.token == null) {
            console.log("Not authenticated to Netdoc ! ! !");
            window.location = this.options.fullURL(this.options.debug);
            return;
        }
        else
        {
            $('#_primary_content').hide();
        }

        this.ndREST = NetDocs(this.options.BaseNetDocsUrl, this.nd.token);
       
        // Load Documents
        this.ndREST.user.getCabinets({
            success: this.queryNd,
            error: this.on_un_authenticated
        });

        // Bind
        if (complete_callback) {
            complete_callback();
        }
    };

    self.authenticate = function () {
            
    };

    self.on_un_authenticated = function () {
        window.location = self.options.auth_url(self.options.debug);
        $('#_nd_').attr("src", self.options.auth_url(self.options.debug));
    };

    self.queryNd = function (cabinet_results) {
        // Client Documents
        for (var cabinet_result_index in cabinet_results) {
            var cabinet = cabinet_results[cabinet_result_index];

            if (cabinet.name == this.options.cabinetName) {
                console.log(cabinet);
            }
        }
    };

    self.queryFiles = function (criteria, cabinet, cabinetName, result_callback) {
        // call back 
        if (results_callback) {
            results_callback(results);
        }
    }

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
        var m_base_url = "https://vault.netvoyage.com/neWeb2/mobile/login.aspx?ie7warn=N";

        if (debug) {
            url = url + m_base_url + '?client_id=' + this.ClientId + '&scope=' + this.Privileges + '&response_type=code&redirect_uri=' + "http://localhost/index.html";
        } else {
            url = url + m_base_url + '?client_id=' + this.ClientId + '&scope=' + this.Privileges + '&response_type=code&redirect_uri=' + $(location).attr('href').split('?')[0];
        }

        return url;
    }
});