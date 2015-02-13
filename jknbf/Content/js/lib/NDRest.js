/** 
* Javascript library for the NetDocuments REST API
*/
/**
*   @class The ecompasing class that contains all necessary calls to operate the NetDocuments REST API via javascript.
*   @param {String} baseUrl
*   @param {String} accessToken The oAuth given access token.
*/
function NetDocs(baseUrl, accessToken) {
    var state = {};
    state.baseUrl = baseUrl;
    state.accessToken = accessToken;

    /** Default async error handler. 
	*	@private
	*/
    function defaultAsyncErrorHandler(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
    }

    /** Default synchronous error handler. 
	*	@private
	*/
    function defaultSyncErrorHandler(jqXHR, textStatus, errorThrown) {
        var err = {};
        err.error = errorThrown;
        err.status = jqXHR.status;
        err.errorDesc = jqXHR.responseText;
        state.syncErr = err;
        state.syncStatus = jqXHR.status;
    }

    /** Default synchronous success handler 
	*	@private
	*/
    function defaultSyncSuccessHandler(data, status, jqxhr) {
        if (data != null)
            state.syncRet = data;
        else if (jqxhr.responseText.length > 0)
            state.syncRet = JSON.parse(jqxhr.responseText);
        else
            state.syncRet = '';
        state.syncStatus = jqxhr.status;
    }

    /**	Update an expired access token
	*	@param {String} token The new access token
	*/
    function setAccessToken(token) {
        state.accessToken = token;
    }

    /** 
    * Most if not all API calls should go through this function.
	* @private	
    * @param {string} url The url of the ajax call.
    * @param {string} token The access token to be used in the call.
    * @param {object} data A JS object that will be turned into post or query arguments.
    * @param {function} handler A function with the signature function(data, status, jqxhr) that is called after a successful Ajax call.
    *       If null then a synchronous call is made and results are returned directly.
    * @param {string} [type] HTTP call type, defaults to GET
    * @param {function} [error] A function with the same signature as defaultErrorHandler called when there is an error during the ajax call.
    *       If null then errors are thrown from synchronous calls and displayed in a messsagebox after asynchronous calls.
    * @param {object} [extraSttings] Extra settings passed to the jQuery ajax call.  When passing in a FormData object use 
    *       {processData: false, contentType: false} so jQuery does the right thing.
    */
    function doAPIAjaxCall(url, token, data, handler, type, error, extraSettings) {
        if (url == undefined) {
            throw "url is a required parameter.";
        }
        if (token == undefined || token == null || token.length == 0) {
            throw "token is a required parameter";
        }
        if (type == undefined) type = "GET";
        var async;
        if (handler == undefined) {
            async = false;
            state.syncRet = undefined;
            state.syncErr = undefined;
            state.syncStatus = undefined;
            handler = defaultSyncSuccessHandler;
            if (error == undefined)
                error = defaultSyncErrorHandler;
        } else {
            async = true;
            if (error == undefined)
                error = defaultAsyncErrorHandler;
        }

        var callSettings = {
            url: url,
            data: data,
            async: async,
            success: handler,
            error: error,
            dataType: "json",
            type: type,
            statusCode: {
                401: error
            },
            headers: { Authorization: "Bearer " + token }
        };
        if (extraSettings != undefined)
            $.extend(callSettings, extraSettings);
        $.ajax(callSettings);

        if (!async) {
            if (state.syncErr != null)
                throw (state.syncErr);
            return state.syncRet;
        }
    }

    /** Parse the query portion of a URL and return an object with a named property for each parameter. 
	*	@private
	*	@param {String} url
	*/
    function parseQuery(url) {
        var urlParams = {};
        var match;
        var pl = /\+/g;  // Regex for replacing addition symbol with a space
        var search = /([^&=]+)=?([^&]*)/g;
        /**	@inner	*/
        var decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
        var query;
        var sep = url.indexOf('?');
        if (sep > 0)
            query = url.substr(sep + 1);
        else
            query = '';

        while (match = search.exec(query))
            urlParams[decode(match[1])] = decode(match[2]);
        return urlParams;
    }

    /** Append a parameter to the query portion of a URL. 
	*	@private
	*/
    function appendParam(url, name, value) {
        var sep = url.indexOf('?');
        var prefix = (sep > 0) ? '&' : '?';
        url += prefix + name + '=' + encodeURIComponent(value);
        return url;
    }

    /** Build an extension list filter 
	*	@private
	*/
    function buildExtensionFilter(extensions) {
        var filterList = '';
        if (extensions != null && extensions.length > 0) {
            var extList = []
            if (extensions.constructor === String) extList = extensions.split(',');
            else if (extensions instanceof Array) extList = extensions;
            else throw "Extension list must be a comman delimeted string or an array";
            for (var i = 0; i < extList.length; i++) {
                var ext = extList[i].trim();
                if (ext.length == 0)
                    continue;
                filterList += ' or extension eq ' + ext;
            }
        }
        return filterList.length > 0 ? filterList.substr(4) : filterList;
    }

    /** Create an access entry.  An ACL is an array of access entries.
    *   @param {string} principal - ID of a user, group, or cabinet
    *   @param {string} rights - Combination of V, E, S, and A or N or Z.  Z can only be used with cabinet principals.
    */
    function createAccessEntry(principal, rights) {
        var ace = {};
        ace.principal = principal;
        if (principal.length > 3 && principal.substr(0, 3) == "NG-") {
            if (rights == "Z")
                ace.cabDefault = true;
            else
                throw "Invalid access rights specified for a cabinet";
        }
        if (rights == "N")
            ace.no_access = true;
        else if (rights.indexOf("V") < 0)
            throw "Invalid access rights specified";
        ace.view = true;
        if (rights.indexOf("E") >= 0)
            ace.edit = true;
        if (rights.indexOf("S") >= 0)
            ace.share = true;
        if (rights.indexOf("A") >= 0)
            ace.administer = true;
        return ace;
    }

    function prevSyncStatus() {
        return state.syncStatus;
    }

    /** The objects added into the common object are available to the inner API objects like Document and Workspace.
	*	@private
	*/
    var common = {
        state: state,
        callND: doAPIAjaxCall
    };

    /** 
    *   @class Document APIs 
    *   @example Document IDs take one of the following forms:<br/>
    *       envelope ID, i.e. :Q12:a:b:c:d:~121106123412345.nev <br/>
    *       12 digit numeric id formatted ####-####-####
    */
    var Document = (function (api) {

        var apiUrl = api.state.baseUrl + "/v1/Document/";

        /** Retrieve document profile data or version details
        * @param {string} id Document id
        * @param {int} [version] Version number.  0 to retrieve document profile.
		* @param {Obeject} [extras] Any additional parameters that need to be considered.
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getInfo(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            if (p.version != undefined && p.version.toString().match(/^\d+$/)) url += "/" + p.version;
            url += "/info";
            if (p.extras) {
                url += "?";
                for (i in p.extras) {
                    url += i + "=" + p.extras[i] + "&";
                }
                url = url.replace(/\&$/, "");
            }
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve document ACL 
        * @param {string} id Document id
        * @param {int} [version] Version number.  Defaults to 0.
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getAcl(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            if (p.version != undefined && p.version.toString().match(/^\d+$/)) url += "/" + p.version;
            url += "/acl";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve document content 
        * @param {string} id Document id.
        * @param {int} [version] Version number.  Defaults to the official version.
        * @param {bool} [addToRecent] If true the document will be added to the user's Recently Opened Documents list.
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getContent(p) {
            var queryArgs = {};
            if (p.addToRecent)
                queryArgs.addToRecent = "Y";
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            if (p.version != undefined)
                url += "/" + p.version
            return doAPIAjaxCall(url, api.state.accessToken, queryArgs, p.success, "GET", p.error, { dataType: "text" });
        }

        /** Retrieves document version list 
        * @param {string} id Document id.
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getVersionList(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/versionList/";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error, { dataType: "json" });
        }

        /** Upload new file (also called <b>Create</b>)
        * @param {file} [file] File object to upload, if left empty new document contents are empty.
        * @param {string} [cab] Cabinet ID to upload file to; ignored if dest is specified.
        * @param {string} [dest] Id of folder, workspace, or sharespace that file should be put in.
        * @param {string} [name] Name of file.  Defaults from file object.
        * @param {string} [ext] File extension. Defaults from file object.
        * @param {string or Date} [lastmod] Last modified date/time for the document.  Defaults to current date/time.
        * @param {Profile[]} [profile] Array of custom profile objects to set on the new document.
        * @param {bool} [allowClosed] Boolean specifing whether closed attribute values are allowed
        * @param {ACL[]} [acl] Array of ACL objects to set on the new document.
        * @param {bool} [full_return] How much information do you want back on success?
        * @param {bool} [addToRecent] If true the document will be added to the user's Recently Added Documents list.
		* @param {bool} [checkOut] If true the document will be checked out.
		* @param {bool} [comment] Optional comment associated with checking out the document.
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function postNewFile(p) {
            var action = "upload";
            if (p.file == undefined) action = "create";
            else if (p.name == undefined || p.name == "" || p.ext == undefined || p.ext == "") {
                var pieces = p.file.name.split(".");
                if (p.name == undefined || p.name == "")
                    p.name = pieces[0];
                if (p.ext == undefined || p.ext == "")
                    p.ext = pieces[1];
            }
            if (p.name == undefined || p.name == "") throw "No name provided.";
            if (p.ext == undefined || p.ext == "") throw "No ext provided.";
            if (p.lastmod == undefined && p.file != undefined && p.file.lastModifiedDate != undefined)
                p.lastmod = p.file.lastModifiedDate;
            var data = new FormData();
            data.append("action", action);
            data.append("cabinet", p.cab);
            data.append("name", p.name);
            data.append("extension", p.ext);
            if (p.full_return != undefined && p.full_return) {
                data.append("return", "full")
            }
            if (p.dest != undefined && p.dest != "")
                data.append('destination', p.dest);
            if (p.profile != undefined && p.profile != "")
                data.append('profile', JSON.stringify(JSON.parse(p.profile)));
            if (p.allowClosed != undefined && p.allowClosed)
                data.append('allowClosed', 'true');
            if (p.acl != undefined && p.acl != "")
                data.append('acl', JSON.stringify(JSON.parse(p.acl)));
            if (p.checkOut != undefined && p.checkOut)
                data.append('checkOut', 'true');
            if (p.comment != undefined && p.comment.length > 0)
                data.append('comment', p.comment);
            if (p.lastmod instanceof Date)
                data.append('modified', p.lastmod.toISOString());
            else if (typeof (p.lastmod) == 'string' && p.lastmod.length > 0)
                data.append('modified', p.lastmod);
            if (p.addToRecent)
                data.append('addToRecent', 'true');
            if (p.extraValues != undefined) {
                for (var key in p.extraValues)
                    data.append(key, p.extraValues[key]);
            }
            data.append("file", p.file);
            return doAPIAjaxCall(
                apiUrl,
                api.state.accessToken,
                data,
                p.success,
                "POST",
                p.error,
                {
                    processData: false,
                    contentType: false,//"multipart/form-data",
                    //mimeType: "multipart/form-data"
                });
        }

        /** Checkout a document 
        * @param {string} id Document id.
        * @param {string} [comment] optional checkout comment.
        * @param {bool} [download] Do you want to download the file as well?
		* @param {boolean} [addToRecent] If true, the document will be added to the user's Recently Opened Documents list.
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function postCheckOut(p) {
            if (p.id == undefined) throw "id is required.";
            /**	Default values */
            var data = {
                "action": "checkout",
            };
            if (p.comment == undefined) p.comment = "";
            if (p.download == undefined) p.download = false;
            data = $.extend(data, p);
            if (data.success)
                delete data.success;
            if (data.error)
                delete data.error;
            if (p.download)
                data.download = "Y";
            return doAPIAjaxCall(
                apiUrl,
                api.state.accessToken,
                data,
                p.success,
                "POST",
                p.error,
                {
                    dataType: "text"
                });
        }
        /** Check in a document 
        * @param {string} id Document id.
        * @param {File} [file] Optional file object to check in.
        * @param {string} [extension] New file extension.  Only used in conjunction with file.
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function postCheckIn(p) {
            if (p.id == undefined) throw "id is required.";

            if (p.file != undefined) {
                var data = new FormData();
                data.append("action", "checkin");
                data.append("id", p.id);
                if (p.extension != undefined)
                    data.append("extension", p.extension);
                data.append("file", p.file);
                return doAPIAjaxCall(
                    apiUrl,
                    api.state.accessToken,
                    data,
                    p.success,
                    "POST",
                    p.error,
                    {
                        processData: false,
                        contentType: false,
                    });
            } else {
                return doAPIAjaxCall(
                    apiUrl,
                    api.state.accessToken,
                    { action: "checkin", id: p.id },
                    p.success,
                    "POST",
                    p.error
                    );
            }
        }

        /** Copy an existing document or version to a new document
        * @param {string} id Original document id
        * @param {int} [version] Version of original document
        * @param {string} [cabinet] Destination cabinet id, defaults to same as original document
        * @param {string} [destination] Folder, Workspace, or Sharespace id that new document will be copied into.
        * @param {string} [name] Name of new document.
        * @param {bool} [addToRecent] If true the document will be added to the user's Recently Added Documents list.
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function postCopy(p) {
            if (p.id == undefined) throw "id is required.";
            var data = $.extend({ "action": "copy" }, p);
            if (data.success)
                delete data.success;
            if (data.error)
                delete data.error;
            return doAPIAjaxCall(
                apiUrl,
                api.state.accessToken,
                data,
                p.success,
                "POST",
                p.error
                );
        }

        /** Upload new file contents 
        * @param {File} file File to upload
        * @param {string} id Document id
        * @param {int} [version] Version number to upload.  Defaults to official version.  Passing in "new" creates a new version.
        * @param {string} [extension] New file extension
        * @param {string} [description] New version description
        * @param {bool} [official] Whether the newly uploaded content should be the official version.
        * @param {bool} [addToRecent] If true the document will be added to the user's Recently Edited Documents list.
        * @param {int} [srcVer] When creating a new version, specifies an existing version to copy from.  Ignored if file
        *       is specified.  If neither srcVer or file are supplied the official version is copied.
		* @param {bool} [checkOut] Whether to checkout a new version of a document or not.
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function putFileContents(p) {
            if (p.file == undefined) throw "file is required.";
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            if (p.version != undefined) url += "/" + p.version;
            if (p.extension != undefined || p.description != undefined || p.official != undefined || (p.checkOut != undefined && p.version == "new") || p.addToRecent != undefined) {
                url += "?";
                if (p.extension != undefined) url += "extension=" + p.extension + "&";
                if (p.description != undefined) url += "versiondescription=" + p.description + "&";
                if (p.addToRecent) url += "addToRecent=Y&";
                if (p.official != undefined && p.official) url += "official=Y&";
                if (p.checkOut != undefined && p.checkOut && p.version == "new") url += "checkOut=Y";

                url = url.replace(/&$/, "");
            }
            return doAPIAjaxCall(
                url,
                api.state.accessToken,
                p.file,
                p.success,
                "PUT",
                p.error,
                {
                    processData: false,
                    contentType: p.file.type
                });
        }

        /** Create a new version without uploading content.  Use putFileContents() when uploading content.
        * @param {string} id Document id
        * @param {string} [extension] New version extension
        * @param {string} [description] New version description
        * @param {bool} [official] Whether the new version should be the official version.
        * @param {bool} [addToRecent] If true the document will be added to the user's Recently Edited Documents list.
        * @param {int} [srcVer] Specifies an existing version to copy from.  If not specified the official version is copied.
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function putNewVersion(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            url += "/new";
            if (p.extension != undefined || p.description != undefined || p.official != undefined || p.addToRecent != undefined || p.srcVer != undefined) {
                url += "?";
                if (p.extension != undefined) url += "extension=" + p.extension + "&";
                if (p.description != undefined) url += "version_description=" + p.description + "&";
                if (p.addToRecent) url += "addToRecent=Y&";
                if (p.srcVer != undefined && p.file == undefined) url += "srcVer=" + p.srcVer + "&";
                if (p.official != undefined && p.official) url += "official=Y&";
                url = url.replace(/&$/, "");
            }
            return doAPIAjaxCall(
                url,
                api.state.accessToken,
                p.file,
                p.success,
                "PUT",
                p.error,
                {
                    processData: false,
                    contentType: "application/json"
                });
        }

        /** Set a new ACL 
        * @param {ACL[]} acl Array of ACL objects or User IDs to set on the document.
        * @param {string} id Document id.
        * @param {int} [version] Defaults to the official version.  If a non official version is specified
        *        ACL should be an array of strings each specifying a user id to grant permission on the
        *        version.
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function putAcl(p) {
            if (p.acl == undefined) throw "acl is required.";
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            if (p.version != undefined) url += "/" + p.version;
            url += "/acl";
            if ($.type(p.acl) != "string") p.acl = JSON.stringify(p.acl);
            doAPIAjaxCall(
                url,
                api.state.accessToken,
                p.acl,
                p.success,
                "PUT",
                p.error,
                {
                    processData: false,
                    contentType: "application/json",
                });
            return state.syncStatus;
        }
        /** Update document custom properties or name 
        * @param {DocumentInfo Object} info Document info object with some combination of the new document name
        * and custom document attributes.  Object should match the one returned from a getInfo call.
        * @param {string} id Document id.
        * @param {int} [version] If version is supplied then the version details will be update for the given version number.
        * @param {bool} [allowClosed] Boolean specifing whether closed attribute values are allowed
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function putInfo(p) {
            if (p.info == undefined) throw "info is required.";
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            if (p.version != undefined) { url += "/" + p.version; }
            url += "/info";
            if (p.allowClosed != undefined && p.allowClosed) {
                url += "?allowClosed=true"
            }
            if ($.type(p.info) != "string") p.info = JSON.stringify(p.info);
            doAPIAjaxCall(
                url,
                api.state.accessToken,
                p.info,
                p.success,
                "PUT",
                p.error,
                {
                    processData: false,
                    contentType: "application/json"
                });
            return state.syncStatus;
        }
        /** Delete a document or version
        * @param {string} id Document id.
        * @param {int} [version] Version to delete
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function deleteDoc(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            if (p.version != undefined && p.version.length > 0) url += "/" + p.version;
            doAPIAjaxCall(
                url,
                api.state.accessToken,
                null,
                p.success,
                "DELETE",
                p.error
                );
        }

        return {
            deleteItem: deleteDoc,
            getInfo: getInfo,
            getAcl: getAcl,
            getContent: getContent,
            getVersionList: getVersionList,
            create: postNewFile,
            checkOut: postCheckOut,
            checkIn: postCheckIn,
            copy: postCopy,
            putFileContents: putFileContents,
            putInfo: putInfo,
            putAcl: putAcl,
            putNewVersion: putNewVersion
        }
    })(common);

    /** 
    *   @class Workspace APIs 
    *   @example Workspace IDs take one of the following forms:<br/>
    *       API ID, i.e. :Q12:a:b:c:d:^W12110612341234.nev<br/>
    *       12 digit numeric workspace id formatted ####-####-####<br/>
    *       cabGuid + workspace attr values, i.e. NG-ABCD123/Client1/Matter3
    */
    var Workspace = (function (api) {

        var apiUrl = api.state.baseUrl + "/v1/Workspace/";

        /** Retrieve workspace profile data 
		*	@param {String} id Workspace id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getInfo(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/info";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve workspace ACL 
		*	@param {String} id Workspace id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getAcl(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/acl";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve list of workspace containers
		*	@param {String} id Workspace id
        *	@param {string} select null to return id and type, standardAttributes to return all standard attributes
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getContainers(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            if (p.select != null && p.select.length > 0)
                url = appendParam(url, "$select", p.select);
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Delete a workspace 
		*	@param {String} id Workspace id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function remove(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "DELETE", p.error);
        }

        /** Add a workspace to the Favorite Workspaces list 
		*	@param {String} id Workspace id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function addToFavorites(p) {
            if (p.id == undefined) throw "id is required.";
            var params = {};
            params.id = p.id;
            params.action = "addToFavorites";
            return doAPIAjaxCall(apiUrl, api.state.accessToken, params, p.success, "POST", p.error);
        }

        /** Add a workspace to the Recent Workspaces list 
		*	@param {String} id Workspace id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function addToRecent(p) {
            if (p.id == undefined) throw "id is required.";
            var params = {};
            params.id = p.id;
            params.action = "addToRecent";
            return doAPIAjaxCall(apiUrl, api.state.accessToken, params, p.success, "POST", p.error);
        }

        /** Modify workspace ACL 
		*	@param {String} id Workspace id
		*	@param {ACL[]} acl Array of ACL objects to set on the new document.
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function putAcl(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/acl";
            var data = JSON.stringify(p.acl);
            return doAPIAjaxCall(url, api.state.accessToken, data, p.success, "PUT", p.error, { contentType: 'application/json' });
        }

        /** Modify workspace profile 
		*	@param {String} id Workspace id
		*	@param {JSON} info
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function putInfo(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/info";
            var data = JSON.stringify(p.info);
            return doAPIAjaxCall(url, api.state.accessToken, data, p.success, "PUT", p.error, { contentType: 'application/json' });
        }

        return {
            getInfo: getInfo,
            getAcl: getAcl,
            getContainers: getContainers,
            deleteItem: remove,
            addToFavorites: addToFavorites,
            addToRecent: addToRecent,
            putAcl: putAcl,
            putInfo: putInfo
        }
    })(common);

    /** 
    *   @class Folder APIs 
    *   @example Folder IDs take one of the following forms:<br/>
    *       API ID, i.e. :Q12:a:b:c:d:^F12110612341234.nev<br/>
    *       12 digit numeric folder id formatted ####-####-####
    */
    var Folder = (function (api) {

        var apiUrl = api.state.baseUrl + "/v1/Folder/";

        /** Retrieve folder profile data 
		*	@param {String} id Folder id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getInfo(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/info";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve folder ACL 
		*	@param {String} id Folder id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getAcl(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/acl";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve ID of folder's parent 
		*	@param {String} id Folder id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getParent(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/parent";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve list of items filed in the folder 
		*	@param {string} id Folder id
        *	@param {boolean} extensions null to return all folder contents, ndfld to return subfolders only, or a comma-separated
        *   list of file extensions to only return contents with matching extensions.
        *	@param {string} select null to return id and type, standardAttributes to return all standard attributes
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
       */
        function getContents(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            var filterList = buildExtensionFilter(p.extensions);
            if (filterList.length > 0)
                url = appendParam(url, '$filter', filterList);
            if (p.select != null && p.select.length > 0)
                url = appendParam(url, "$select", p.select);
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Delete a folder 
		*	@param {string} id Folder id
        *   @param {Boolean} deleteContents true to delete documents in the folder tree.  If false documents are unfiled but not deleted.
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function remove(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            if (p.deleteContents)
                url = appendParam(url, 'deleteContents', '1');
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "DELETE", p.error);
        }

        /** Modify folder profile 
		*	@param {string} id Folder id
        *   @param {JSON} info Folder info object. Object should match the one returned from a getInfo call.
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function putInfo(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/info";
            var data = JSON.stringify(p.info);
            return doAPIAjaxCall(url, api.state.accessToken, data, p.success, "PUT", p.error, { contentType: 'application/json' });
        }

        /** Modify folder ACL 
		*	@param {string} id Folder id
        *   @param {JSON} acl 
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function putAcl(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/acl";
            var data = JSON.stringify(p.acl);
            return doAPIAjaxCall(url, api.state.accessToken, data, p.success, "PUT", p.error, { contentType: 'application/json' });
        }

        /** Change folder's parent, i.e. move folder 
		*	@param {string} id Folder id
        *   @param {JSON, String} newParent
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function putParent(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/parent";
            if (typeof (newParent) != "string")
                newParent = JSON.stringify(p.newParent);
            return doAPIAjaxCall(url, api.state.accessToken, p.newParent, p.success, "PUT", p.error, { contentType: 'application/json' });
        }

        /** Create new folder 
        *   @param {string} name name of the new folder
        *   @param {string} parent ID of parent folder or workspace; null for top-level folder
        *   @param {string} cabinet ID of cabinet for top-level folder; ignored if parent is non-null
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function create(p) {
            if (p.name == null || p.name.length < 1) throw "name is required";
            var data = "name=" + encodeURIComponent(p.name);
            if (p.parent != null && p.parent.length > 0)
                data += "&parent=" + encodeURIComponent(p.parent);
            if (p.cabinet != null && p.cabinet.length > 0)
                data += "&cabinet=" + encodeURIComponent(p.cabinet);
            return doAPIAjaxCall(apiUrl, api.state.accessToken, data, p.success, "POST", p.error);
        }

        /** File items in a folder
		*	@param {string} id Folder id
        *   @param {string, string Array} items - IDs of documents and saved searches to file in the folder
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)		
        */
        function file(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            var data = "action=file";
            if (typeof (p.items) == "string")
                data += "&item=" + encodeURIComponent(p.items);
            else {
                for (var i = 0; i < p.items.length; i++)
                    data += "&item=" + encodeURIComponent(p.items[i]);
            }
            return doAPIAjaxCall(url, api.state.accessToken, data, p.success, "POST", p.error);
        }

        /** Unfile items from a folder
		*	@param {string} id Folder id
        *   @param {string, string Array} items - IDs of documents and saved searches to file in the folder
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)	
        */
        function unfile(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            var data = "action=unfile";
            if (typeof (p.items) == "string")
                data += "&item=" + encodeURIComponent(p.items);
            else {
                for (var i = 0; i < items.length; i++)
                    data += "&item=" + encodeURIComponent(p.items[i]);
            }
            return doAPIAjaxCall(url, api.state.accessToken, data, p.success, "POST", p.error);
        }

        return {
            getInfo: getInfo,
            getAcl: getAcl,
            getParent: getParent,
            getContents: getContents,
            putInfo: putInfo,
            putAcl: putAcl,
            putParent: putParent,
            create: create,
            deleteItem: remove,
            file: file,
            unfile: unfile
        }
    })(common);

    /** 
    *   @class Saved Search APIs 
    *   @example Saved Search IDs take one of the following forms:<br/>
    *       API ID, i.e. :Q12:a:b:c:d:~012110612341234.nev<br/>
    *       12 digit numeric saved search id formatted ####-####-####
    */
    var SavedSearch = (function (api) {

        var apiUrl = api.state.baseUrl + "/v1/SavedSearch/";

        /** Retrieve saved search profile data 
		*	@param {String} id SavedSearch id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getInfo(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/info";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve saved search ACL 
		*	@param {String} id SavedSearch id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getAcl(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/acl";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve search results 
		*	@param {String} id SavedSearch id
        *	@param {Integer} maxResults The maximum # of results to return from each call.  Can't be over 500. 0 or null to use the default.
        *   @param {String} skipToken null for the initial search.  To retrieve additional results after the first block, pass the skipToken
        *           returned from the previous call.
        *   @param {Boolean} getCount true to return an estimate of the total # of items matching the search
        *	@param {String} extensions - null to return all results or a comma-separated
        *       list of file extensions to only return contents with matching extensions.
        *	@param {string} select - null to return id and type, standardAttributes to return all standard attributes
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function doSearch(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            if (p.maxResults != null && p.maxResults > 0)
                url = appendParam(url, '$top', p.maxResults);
            if (p.skipToken != null && p.skipToken.length > 0)
                url = appendParam(url, '$skiptoken', p.skipToken);
            if (p.getCount)
                url = appendParam(url, '$inlinecount', 'allpages');
            var filterList = buildExtensionFilter(p.extensions);
            if (filterList.length > 0)
                url = appendParam(url, '$filter', filterList);
            if (p.select != null && p.select.length > 0)
                url = appendParam(url, "$select", p.select);
            var r = doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
            if (r != null && r.next != null) {
                var nextPar = parseQuery(r.next);
                r.skipToken = nextPar.$skiptoken;
            }
            return r;
        }

        /** Create a saved search
        *   @param {string} name - name of the new saved search
        *   @param {string} criteria - search criteria
        *   @param {string} cabinet - ID of cabinet where saved search will be created
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function create(p) {
            if (p.name == null || p.name.length < 1) throw "name is required";
            if (p.cabinet == null || p.cabinet.length < 1) throw "cabinet is required";
            if (p.criteria == null || p.criteria.length < 1) throw "criteria are required";
            var data = {};
            data.name = p.name;
            data.cabinet = p.cabinet;
            data.q = p.criteria;
            return doAPIAjaxCall(apiUrl, api.state.accessToken, data, p.success, "POST", p.error);
        }

        /** Delete a saved search 			
		*	@param {String} id SavedSearch id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function remove(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "DELETE", p.error);
        }

        /** Modify saved search ACL        			
		*	@param {String} id SavedSearch id
		*	@param {JSON} acl
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function putAcl(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/acl";
            var data = JSON.stringify(p.acl);
            return doAPIAjaxCall(url, api.state.accessToken, data, p.success, "PUT", p.error, { contentType: 'application/json' });
        }

        /** Modify saved search profile        			
		*	@param {String} id SavedSearch id
		*	@param {JSON} info
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function putInfo(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/info";
            var data = JSON.stringify(p.info);
            return doAPIAjaxCall(url, api.state.accessToken, data, p.success, "PUT", p.error, { contentType: 'application/json' });
        }

        return {
            getInfo: getInfo,
            getAcl: getAcl,
            performSearch: doSearch,
            create: create,
            deleteItem: remove,
            putAcl: putAcl,
            putInfo: putInfo
        }
    })(common);

    /** 
    *   @class Filter APIs
    *   @example Filter IDs take one of the following forms:<br/>
    *       API ID, i.e. :Q12:a:b:c:d:~112110612341234.nev<br/>
    *       12 digit numeric filter id formatted ####-####-####
    */
    var Filter = (function (api) {

        var apiUrl = api.state.baseUrl + "/v1/Filter/";

        /** Retrieve filter profile data 		
		*	@param {String} id Filter id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getInfo(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/info";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve filter ACL  		
		*	@param {String} id Filter id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getAcl(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/acl";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve search results 
		*	@param {String} id Filter id
        *	@param {Integer} maxResults The maximum # of results to return from each call.  Can't be over 500. 0 or null to use the default.
        *   @param {String} skipToken null for the initial call.  To retrieve additional results after the first block, pass the skipToken
        *           returned from the previous call.
        *	@param {String} extensions - null to return all results or a comma-separated
        *       list of file extensions to only return contents with matching extensions.
        *	@param {string} select - null to return id and type, standardAttributes to return all standard attributes
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function doSearch(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            if (p.maxResults != null && p.maxResults > 0)
                url = appendParam(url, '$top', p.maxResults);
            if (p.skipToken != null && p.skipToken.length > 0)
                url = appendParam(url, '$skiptoken', p.skipToken);
            var filterList = buildExtensionFilter(p.extensions);
            if (filterList.length > 0)
                url = appendParam(url, '$filter', filterList);
            if (p.select != null && p.select.length > 0)
                url = appendParam(url, "$select", p.select);
            var r = doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
            if (r != null && r.next != null) {
                var nextPar = parseQuery(r.next);
                r.skipToken = nextPar.$skiptoken;
            }
            return r;
        }

        /** Delete a filter  		
		*	@param {String} id Filter id
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function remove(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id;
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "DELETE", p.error);
        }

        /** Modify filter ACL  		
		*	@param {String} id Filter id
		*	@param {JSON} acl
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function putAcl(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/acl";
            var data = JSON.stringify(p.acl);
            return doAPIAjaxCall(url, api.state.accessToken, data, p.success, "PUT", p.error, { contentType: 'application/json' });
        }

        return {
            getInfo: getInfo,
            getAcl: getAcl,
            performSearch: doSearch,
            deleteItem: remove,
            putAcl: putAcl,
        }
    })(common);

    /** 
    *   @class Search APIs 
    */
    var Search = (function (api) {

        var apiUrl = api.state.baseUrl + "/v1/Search/";

        /** Do a search 
		*	@param {String} cabGuid The guid of the cabinet you want to search in.
		*	@param {String} criteria The criteria the search will be based off.
        *	@param {Integer} maxResults The maximum # of results to return from each call.  Can't be over 500. 0 or null to use the default.
        *   @param {String} skipToken null for the initial call.  To retrieve additional results after the first block, pass the skipToken
        *           returned from the previous call.
        *   @param {String} sort "lastMod" to sort by Last Modified, "name" to sort by name/subject, "relevance" or null to sort by relevance.
        *	@param {string} select - null to return id and type, standardAttributes to return all standard attributes
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function doSearch(p) {
            if (p.cabGuid == undefined) throw "cabGuid is required.";
            var url = apiUrl + p.cabGuid + "?q=" + encodeURIComponent(p.criteria);
            if (p.maxResults != null && p.maxResults > 0)
                url = appendParam(url, '$top', p.maxResults);
            if (p.skipToken != null && p.skipToken.length > 0)
                url = appendParam(url, '$skiptoken', p.skipToken);
            if (p.sort != null && p.sort.length > 0)
                url = appendParam(url, '$orderby', p.sort);
            if (p.select != null && p.select.length > 0)
                url = appendParam(url, "$select", p.select);
            var r = doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
            if (r != null && r.next != null) {
                var nextPar = parseQuery(r.next);
                r.skipToken = nextPar.$skiptoken;
            }
            return r;
        }

        return {
            performSearch: doSearch,
        }
    })(common);

    /** 
    *   @class User APIs 
    */
    var User = (function (api) {

        var apiUrl = api.state.baseUrl + "/v1/User/";

        /** Retrieve common user information 
        *   @param {String} id null for the current user
		*   @param {Object} [extras] Any additional data that needs to be passed to the GET request.
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)		
        */
        function getInfo(p) {
            var url = apiUrl;
            if (p.id != null)
                url += p.id + "/";
            url += "info";
            if (p.extras) {
                url += "?";
                for (i in p.extras) {
                    url += i + "=" + p.extras[i] + "&";
                }
                url = url.replace(/\&$/, "");
            }
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve the list of cabinets the current user is a member of 				
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getCabinetList(p) {
            var url = apiUrl + "cabinets";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve the user's Recently Opened Documents list 
        *	@param {string} select null to return id and type, standardAttributes to return all standard attributes
		*	@param {String} extensions null to return all results or a comma-separated
        *       list of file extensions to only return contents with matching extensions.		
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getRecentlyOpenedDocs(p) {
            var url = apiUrl + "recentlyOpenedDocs";
            if (p.select != null && p.select.length > 0)
                url = appendParam(url, "$select", p.select);
            var filterList = buildExtensionFilter(p.extensions);
            if (filterList.length > 0)
                url = appendParam(url, '$filter', filterList);
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve the user's Recently Edited Documents list 
        *	@param {string} select null to return id and type, standardAttributes to return all standard attributes
		*	@param {String} extensions null to return all results or a comma-separated
        *       list of file extensions to only return contents with matching extensions.		
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getRecentlyEditedDocs(p) {
            var url = apiUrl + "recentlyEditedDocs";
            if (p.select != null && p.select.length > 0)
                url = appendParam(url, "$select", p.select);
            var filterList = buildExtensionFilter(p.extensions);
            if (filterList.length > 0)
                url = appendParam(url, '$filter', filterList);
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve the user's Recently Added Documents list 
        *	@param {string} select null to return id and type, standardAttributes to return all standard attributes
		*	@param {String} extensions null to return all results or a comma-separated
        *       list of file extensions to only return contents with matching extensions.		
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getRecentlyAddedDocs(p) {
            var url = apiUrl + "recentlyAddedDocs";
            if (p.select != null && p.select.length > 0)
                url = appendParam(url, "$select", p.select);
            var filterList = buildExtensionFilter(p.extensions);
            if (filterList.length > 0)
                url = appendParam(url, '$filter', filterList);
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve the user's ND home page content 
        *	@param {string} select - null to return id and type, standardAttributes to return all standard attributes
		*	@param {String} extensions null to return all results or a comma-separated
        *       list of file extensions to only return contents with matching extensions.		
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getHomePage(p) {
            var url = apiUrl + "homePage";
            if (p.select != null && p.select.length > 0)
                url = appendParam(url, "$select", p.select);
            var filterList = buildExtensionFilter(p.extensions);
            if (filterList.length > 0)
                url = appendParam(url, '$filter', filterList);
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve the list of groups the current user is a member of 
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getGroups(p) {
            var url = apiUrl + "groups";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve the current user's favorite workspaces list 
        *	@param {string} select null to return id and type, standardAttributes to return all standard attributes
        *	@param {string} filter "cabinet eq cabinetId" to restrict to only return workspaces in a particular cabinet
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getFavoriteWorkspaces(p) {
            var url = apiUrl + "wsFav";
            if (p.select != null && p.select.length > 0)
                url = appendParam(url, "$select", p.select);
            if (p.filter != null && p.filter.length > 0)
                url = appendParam(url, "$filter", p.filter);
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve the current user's recent workspaces list 
        *	@param {string} select - null to return id and type, standardAttributes to return all standard attributes
        *	@param {string} filter - "cabinet eq cabinetId" to restrict to only return workspaces in a particular cabinet
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getRecentWorkspaces(p) {
            var url = apiUrl + "wsRecent";
            if (p.select != null && p.select.length > 0)
                url = appendParam(url, "$select", p.select);
            if (p.filter != null && p.filter.length > 0)
                url = appendParam(url, "$filter", p.filter);
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        return {
            getInfo: getInfo,
            getCabinets: getCabinetList,
            getRecentlyOpenedDocs: getRecentlyOpenedDocs,
            getRecentlyEditedDocs: getRecentlyEditedDocs,
            getRecentlyAddedDocs: getRecentlyAddedDocs,
            getHomePage: getHomePage,
            getGroups: getGroups,
            getFavoriteWorkspaces: getFavoriteWorkspaces,
            getRecentWorkspaces: getRecentWorkspaces,
        }


    })(common);

    /** 
    *   @class Repository APIs 
    */
    var Repository = (function (api) {

        var apiUrl = api.state.baseUrl + "/v1/Repository/";

        /** Retrieve common repository information
		*   @param {String} id id of the Repository
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getInfo(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/info";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        return {
            getInfo: getInfo
        }
    })(common);

    /** 
    *   @class Cabinet APIs 
    */
    var Cabinet = (function (api) {

        var apiUrl = api.state.baseUrl + "/v1/Cabinet/";

        /** Retrieve common cabinet information
		*   @param {String} id The id of the Cabinet
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getInfo(p) {
            if (p.id == undefined) throw "id is required";
            var url = apiUrl + p.id + "/info";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve custom attributes definitions for this cabinet
		*   @param {String} id The id of the Cabinet
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getCustomAttributes(p) {
            if (p.id == undefined) throw "id is required";
            var url = apiUrl + p.id + "/customAttributes";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve top-level folders
		*   @param {String} id The id of the Cabinet
        *	@param {string} select null to return id and type, standardAttributes to return all standard attributes
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getFolders(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/folders";
            if (p.select != null && p.select.length > 0)
                url = appendParam(url, "$select", p.select);
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve cabinet settings
		*   @param {String} id The id of the Cabinet
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getSettings(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/settings";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve the current user's security templates for this cabinet
        *   @param {String} id The id of the cabinet
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getSecurityTemplates(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/securityTemplates";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }
        /** Retrieve the current user's profile templates for this cabinet
        *   @param {String} id The id of the cabinet
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getProfileTemplates(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/securityTemplates";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        return {
            getInfo: getInfo,
            getCustomAttributes: getCustomAttributes,
            getFolders: getFolders,
            getSettings: getSettings,
            getSecurityTemplates: getSecurityTemplates,
            getProfileTemplates: getProfileTemplates
        }
    })(common);

    /** 
    *   @class User Group APIs     
    */
    var Group = (function (api) {

        var apiUrl = api.state.baseUrl + "/v1/Group/";

        /** Retrieve common group information 
        *   @param {String} id The id of the group
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getInfo(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/info";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve group membership list 
        *   @param {String} id The id of the group
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
		*/
        function getMembers(p) {
            if (p.id == undefined) throw "id is required.";
            var url = apiUrl + p.id + "/members";
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        return {
            getInfo: getInfo,
            getMembers: getMembers
        }
    })(common);

    /** 
    *   @class Lookup Table APIs 
    */
    var Attribute = (function (api) {
        /**	@private
		*/
        function encodeAttribute(attr) {
            if (attr.search(/[/\\%\+]/) > -1)
                return encodeURIComponent(encodeURIComponent(attr))
            else
                return encodeURIComponent(attr)
        }

        var apiUrl = api.state.baseUrl + "/v1/attributes/";

        /** Get the lookup data information for a single or multiple keys.
        * @param {String} repository The repository/account GUID
        * @param {int} field Lookup field id
        * @param {String} key Lookup items key
        * @param {String} [parent] Lookup items parent
        * @param {String} [filter] What to filter results by.  Currently needs to be 
            startswith(key|description, prefix) or substringof(substring, key|description)
            if you need to have a comma in the prefix or substring enclose in ""
        * @param {String} [select] Comma separated list of fields to return on each item
        * @param {int} [skip] Skip this number of entries
        * @param {int} [top] How many entries to return
        * @param {String} [orderby] Either key or parent
        * @param {String} [count] Any of no, also, only
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function getAttributes(p) {
            if (p.repository == undefined) throw "repository is required.";
            if (p.field == undefined) throw "field is required.";
            var url = apiUrl + p.repository + "/" + p.field;
            if (p.parent != undefined && p.parent.length > 0) url += "/" + encodeAttribute(p.parent);
            if (p.key != undefined && p.key.length > 0) url += "/" + encodeAttribute(p.key);
            if (p.count != undefined && p.count == 'only') url += "/$count";
            if (p.select || p.skip || p.top || p.filter) url += "?";
            if (p.filter != undefined && p.filter.length > 0) {
                url += "$filter=" + encodeURIComponent(p.filter) + "&";
                if (p.orderby != undefined && p.orderby.length > 0) url += "$orderby=" + encodeAttribute(p.orderby) + "&";
            }
            if (p.select != undefined && p.select.length > 0) url += "$select=" + encodeAttribute(p.select) + "&";
            if (p.skip != undefined && p.skip > 0) url += "$skip=" + encodeAttribute(p.skip) + "&";
            if (p.top != undefined && p.top > 0) url += "$top=" + encodeAttribute(p.top) + "&";
            if (p.count != undefined && p.count == 'also') url += "$inlinecount=allpages";
            url = url.replace(/&$/, ''); //remove any ending &
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Put a new lookup attribute into the table or alter an existing one.
        * @param {String} repository The repository/account GUID
        * @param {int} field Lookup field id
        * @param {String} key Lookup items key
        * @param {String} [parent] Lookup items parent
        * @param {object} [data] Lookup item data.  Formatted the same as objects returned from a get.
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function putAttribute(p) {
            if (p.repository == undefined) throw "repository is required.";
            if (p.field == undefined) throw "field is required.";
            if (p.data == undefined) p.data = {};
            var url = apiUrl + p.repository + "/" + p.field;
            if (p.parent != undefined && p.parent.length > 0) url += "/" + encodeAttribute(p.parent);
            if (p.key != undefined && p.key.length > 0) url += "/" + encodeAttribute(p.key);
            if ($.type(p.data) != "string") p.data = JSON.stringify(p.data);
            return doAPIAjaxCall(url, api.state.accessToken, p.data, p.success, "PUT", p.error);
        }

        /** Put an existing lookup attribute.
        * @param {String} repository The repository/account GUID
        * @param {int} field Lookup field id
        * @param {String} key Lookup items key
        * @param {String} [parent] Lookup items parent
        * @param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        * @param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function deleteAttribute(p) {
            if (p.repository == undefined) throw "repository is required.";
            if (p.field == undefined) throw "field is required.";
            var url = apiUrl + p.repository + "/" + p.field;
            if (p.parent != undefined && p.parent.length > 0) url += "/" + encodeAttribute(p.parent);
            if (p.key != undefined && p.key.length > 0) url += "/" + encodeAttribute(p.key);
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "DELETE", p.error);
        }

        return {
            getAttributes: getAttributes,
            get: getAttributes,
            put: putAttribute,
            deleteItem: deleteAttribute
        };
    })(common);

    /* This is an undocumented class added for the sync api.
    */
    var Sync = (function (api) {
        var apiUrl = api.state.baseUrl + "/v1/sync/";

        /** Retrieve list of files and folders to be synced 
        *   @param {} replica The replica ID
		*   @param {} [container] Restrict chages to this container
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function get(p) {
            if (p.replica == undefined) throw "replica is required";
            var url = apiUrl + p.replica;
            if (p.container != null && p.container.length > 0) url += "/" + p.container;
            return doAPIAjaxCall(url, api.state.accessToken, null, p.success, "GET", p.error);
        }

        /** Retrieve a new replica ID
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function replicaID(p) {
            return doAPIAjaxCall(apiUrl, api.state.accessToken, { "action": "createReplica" }, p.success, "POST", p.error);
        }

        /** Add a new container to the users sync list
        *   @param {} container
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function addSyncContainer(p) {
            return doAPIAjaxCall(apiUrl, api.state.accessToken, { "action": "addContainer", "container": p.container }, p.success, "POST", p.error, { dataType: "text" });
        }

        /** Remove a container from the users sync list
        *   @param {} container
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function removeSyncContainer(p) {
            return doAPIAjaxCall(apiUrl, api.state.accessToken, { "action": "removeContainer", "container": p.container }, p.success, "POST", p.error, { dataType: "text" });
        }

        /** List the users synced containers
		*   @param {boolean} [all] Should child containers be listed as well?
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function listSyncContainers(p) {
            if (p == undefined) p = { all: "f" };
            else if (p.all == undefined || !p.all) p.all = "f";
            else p.all = "t";
            return doAPIAjaxCall(apiUrl, api.state.accessToken, { "action": "listContainers", "all": p.all }, p.success, "POST", p.error);
        }

        /** Confirm successful completion or storage of sync commands
        *   @param {} replica Replica ID
		*   @param {} container Env url of container
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function confirmSync(p) {
            var data = { "action": "changelistConfirmed", "replica": p.replica };
            if (p.container != null && p.container.length > 0) data['container'] = p.container;
            return doAPIAjaxCall(apiUrl, api.state.accessToken, data, p.success, "POST", p.error, { dataType: "text" });
        }

        /** Register a device
        *   @param {String} replica Replica ID
		*   @param {String} name Name of device
		*   @param {String} version Software version
		*   @param {String} device Type of device
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function register(p) {
            var data = {
                "action": "register",
                "id": p.replica,
                "name": p.name,
                "version": p.version,
                "device": p.device
            };
            return doAPIAjaxCall(apiUrl, api.state.accessToken, data, p.success, "POST", p.error, { dataType: "text" });
        }

        /** Update replica information
        *   @param {String} replica Replica ID
		*   @param {String} name Name of device
		*   @param {String} version Software version
		*   @param {String} device Type of device
		*	@param {function} [success] Called on success.  Signature function(data, textStatus, jqXHR)
        *	@param {function} [error] Called when error occurs.  Signature function(jqXHR, textStatus, errorThrown)
        */
        function update(p) {
            var data = {
                "action": "update",
                "id": p.replica,
                "name": p.name,
                "version": p.version,
                "device": p.device
            };
            return doAPIAjaxCall(apiUrl, api.state.accessToken, data, p.success, "POST", p.error, { dataType: "text" });
        }

        return {
            get: get,
            replicaID: replicaID,
            addContainer: addSyncContainer,
            removeContainer: removeSyncContainer,
            listContainers: listSyncContainers,
            confirm: confirmSync,
            register: register,
            update: update
        };
    })(common);

    /** The objects added into the api object form the publicly exposed API.*/
    return {
        document: Document,
        workspace: Workspace,
        folder: Folder,
        search: Search,
        savedSearch: SavedSearch,
        filter: Filter,
        user: User,
        group: Group,
        cabinet: Cabinet,
        repository: Repository,
        attributes: Attribute,
        sync: Sync,
        // Helper functions
        createAccessEntry: createAccessEntry,
        getPrevSyncStatus: prevSyncStatus,
        setAccessToken: setAccessToken
    };
}
