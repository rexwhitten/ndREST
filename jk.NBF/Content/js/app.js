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

    self.nbf = {
        nbf_key: ""
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

            if (member_index.toLowerCase().replace("?", "") == 'nbf_key') {
                self.nbf.nbf_key = params[member_index];
            }
        }


        $view_nbf.empty();
        $view_nbf.append($ul);
    }

    /**
     * View/NetDocuments List
     * @description Loads the saved search results
     * Make sure the saved search is correct in configuration
     */
    self.view_docs = function () {
        var saved_search_results = self.ndREST.savedSearch.performSearch({
            id: self.options.savedSearchId,
            maxResults: 100,
            skipToken: 0,
            getCount: true
        });

        var _count = saved_search_results.countEstimate;
        var _index = 0;

        window.__nd_results = [];
        var $doc = $("<div></div>");
        $doc.addClass("list-group");
        $doc.attr("id", "nd_list");
        $('#view_docs').empty();
        $('#view_docs').append($doc);

        while (_index <= (_count - 1)) {
            var _list_item = saved_search_results.list[_index];
            self.ndREST.document.getInfo({
                id: _list_item.envId,
                success: function (_doc_info) {

                    console.log(_doc_info);

                    var _document_result = {};
                    _document_result.envId = _doc_info.standardAttributes.envId;
                    _document_result.extension = _doc_info.standardAttributes.extension;
                    _document_result.id = _doc_info.standardAttributes.id;
                    _document_result.name = _doc_info.standardAttributes.name;
                    _document_result.url = _doc_info.standardAttributes.url;

                    // Custom Attributes 
                    for (var custom_att_index in _doc_info.customAttributes) {
                        var custom_attribute = _doc_info.customAttributes[custom_att_index];
                        _document_result[custom_attribute.description] = custom_attribute.value;
                    }


                    var $a = $('<a href="#"></a>');
                    $a.addClass("list-group-item");
                    $a.attr("data-env-id", _document_result.envId);
                    $a.attr("data-nd-id", _document_result.id);
                    $a.attr("data-nd-url", _document_result.url);
                    $a.attr("data-nd-name", _document_result.name);
                    $a.attr("data-selected", false);

                    $a.on("click", function () {
                        var selected = $(this).attr("data-selected");
                        
                        if (selected == false || selected == 'false') {
                            $(this).attr("data-selected", true);
                            $(this).addClass("list-group-item-success");
                        } else {
                            $(this).attr("data-selected", false);
                            $(this).removeClass("list-group-item-success");
                        }
                    });

                    $a.append(_document_result.name);
                    $('#nd_list').append($a);
                },
                error: function (e, v, t) {
                    console.log(v + ":" + t);
                    var _document_result = {};
                    _document_result.envId = _list_item.envId;
                    _cache.set(_document_result.envId, _document_result);
                    window.__nd_results.push(_document_result);
                }
            });
            _index++;
        }
    };

    /**
     * Loads the available Save/Update Actions
     * @description NBF Netdocuments View
     */
    self.view_actions = function () {
        var $view_actions = $('#view_actions');

        var $btngrp = $("<div></div>");
        $btngrp.addClass("btn-grp");
        $btngrp.attr("role", "group");
            
        var $save = $("<a>Save</a>");
        $save.addClass("btn btn-primary");

        $save.on("click", function () {
            var e = "data-selected";
            var selected_docs = [];

            var selectedSet = $('a[data-selected="true"]');

            var c = selectedSet.length;
            var i = 0;

            while (i <= (c - 1)) {
                var _selected = $(selectedSet[i]);

                var selected_doc = {};
                
                selected_doc.env_id = _selected.attr("data-env-id");
                selected_doc.nd_id = _selected.attr("data-nd-id");
                selected_doc.url = _selected.attr("data-nd-url");
                selected_doc.name = _selected.attr("data-nd-name");
                selected_docs.push(selected_doc);
                selected_doc.nbf_key = self.nbf.nbf_key;

                var model = {
                    DocumentId: 0,
                    NetDocumentsNumber: selected_doc.nd_id,
                    NetDocumentsUrl: selected_doc.url,
                    NetDocumentsDescription: selected_doc.name,
                    WorlDoxNumbers: "",
                    DocTypeName: "engagement",
                    NBF_Key: selected_doc.nbf_key
                }

                $.ajax({
                    url: "data/SaveDocument.aspx",
                    type: "POST",
                    headers: {
                        "nbf_doc": JSON.stringify(model)
                    }
                }).done(function (msg) {
                    alert("Data Saved: " + msg);
                });

                // Make Ajax Call POST Saved Document
                console.log(selected_doc);
                i++;
            }

            window.location = "saved.html";

        });

        var $reset = $("<a>Reset</a>");
        $reset.addClass("btn btn-default");

        $btngrp.append($save)
               .append($reset);

        $view_actions.empty()
                     .append($btngrp);
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
            error: function (e, t, j) {
                if (self.options.debug == false) {
                    self.UnAuthenticated();
                }
                console.log("error authenticating: " + j);
                check_ballback(false);
            }
        });
    }

    /**
     * @description handles when a user is not authenticated to netdocuments
     */
    self.UnAuthenticated = function () {
        console.log("un-authenticated");
        window.location = "login.html";
    };

    /**
     * @description load the app
     */
    self.Load = function () {
        console.log("loading app");

        // check for debug mode, set the access code and access tokens
        if (self.options.debug) {
            // Access Code
            self.nd.code = "8zAWRSt8oNHTG06JxhKEIA8IId/RkAD+ZfleYECDbfhHPeZU7NVlh5vt8NoDAimEWEZhAUphz1jT3D8jWO/4jbu9JWG4Sx9/zZnVZTGLXNvuDgO0v11JIP7T7rxsbvFA";
            _cache.set("code", self.nd.code, { 'expireDays': .5 });
            // Access Token
            self.nd.token = "fNb98ibhohwHm36SYnFVqauewJNj5KAVmiHxRobE44N6If6OO1l1NS1IV7VBI+AvH1XPwaY6BZksQEPPacnahVK4ezfHja+8FhpN4oX4jap6bL8mQyXhTfv5xBQ5t6YF";
            _cache.set("token", self.nd.token, { 'expireDays': .5 });
        }

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
    savedSearchId: "4822-8047-6450",
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