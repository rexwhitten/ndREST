var code = undefined;
var token = null;
var SPAppWebUrl = undefined;
var requestDigest = undefined;
var search = undefined;
var params = document.URL.split("?")[1].split("&");
for (var i = 0; i < params.length; i = i + 1) {
    var param = params[i].split("=");
    switch (param[0]) {
        case "code":
            code = decodeURIComponent(param[1]);
            break;
        case "access_token":
            token = decodeURIComponent(param[1]);
            break;
        case "SPAppWebUrl":
            SPAppWebUrl = decodeURIComponent(param[1]);
            break;
    }
}


function customAttribute(attr, value) {
    var self = this;
    self.Description = attr.description;
    self.Key = attr.value;
    self.attrNum = value;
}

function Item(name, size, id, envId, created, createdBy, url, modified, modifiedBy, versions, extension, customAttributes, parent, checkedOut) {
    var self = this;
    self.Name = name;
    self.ID = id;
    self.checkoutTo = ko.observable();
    self.checkoutOn = ko.observable();
    if (checkedOut != undefined) {
        var checkoutDate = new Date(parseInt(modified.replace("/Date(", "").replace(")/", "")));
        self.checkoutOn(checkoutDate.toLocaleDateString());
    }
    self.envId = envId;
    self.checkedOut = ko.observable(checkedOut == undefined ? false : true);
    if (modified) {
        var myDate = new Date(parseInt(modified.replace("/Date(", "").replace(")/", "")));
        self.modified = myDate.toLocaleDateString() + " " + myDate.toLocaleTimeString();
        self.modified = myDate.toLocaleString();
    }
    else {
        self.modified = "";
    }
    if (created) {
        var createdDate = new Date(parseInt(created.replace("/Date(", "").replace(")/", "")));
        self.created = createdDate.toLocaleString();
    }
    else {
        self.created = "";
    }
    self.createdBy = createdBy;
    self.url = url;
    self.size = size;
    self.Client = null;
    self.Matter = null;
    self.Parent = parent;
    self.SelectionImg = ko.observable("../images/unchecked.png");
    if (customAttributes) {
        for (var ii = 0; ii < customAttributes.length; ii++) {
            var customAttr = customAttributes[ii];
            if (customAttr.id == 1 && customAttr.description)
                self.Client = new customAttribute(customAttr, 1001);
            else
                if (customAttr.id == 2 && customAttr.description)
                    self.Matter = new customAttribute(customAttr, 1002);
        }
    }

    self.isNotFolder = ko.observable(extension != "ndfld" && extension != "custom");

    self.Selected = ko.observable(false);
    self.modifiedBy = modifiedBy;
    self.ClientText = ko.observable(self.Client ? self.Client.Description : "")
    self.ClientKeyHash = ko.observable(self.Client ? ("#parent=" + encodeURIComponent(location.hash) + "&current=" + encodeURIComponent("criteria=" + encodeURIComponent("=" + self.Client.attrNum + "({" + self.Client.Key + "})"))) : "");
    self.MatterText = ko.observable(self.Matter ? self.Matter.Description : "")
    self.MatterKeyHash = ko.observable(self.Matter ? (self.ClientKeyHash() + encodeURIComponent(encodeURIComponent(" =" + self.Matter.attrNum + "({" + self.Matter.Key + "})"))) : "");
    self.versions = versions;
    self.Classes = ko.computed(function () {
        return self.Selected() ? "ms-alternating  ms-itmHoverEnabled ms-itmhover s4-itm-selected" : "ms-alternating  ms-itmHoverEnabled ms-itmhover"
    });
    self.ext = extension;
    self.extension = "*." + extension;
    self.iconTypeClass = ko.computed(function () { return " " + extension + " file-icon" + (self.checkedOut() ? " checkout" : "") });
    self.FullName = self.Name + ((self.ext != undefined && self.ext != "ndfld" && self.ext != "custom") ? "." + self.ext : "");

}

function getUrlPath() {
    if (SPAppWebUrl == undefined) {
        SPAppWebUrl = $(location).attr('href').toString().toLowerCase().split('/pages')[0];
    }
    var webRel = SPAppWebUrl;
    var lastIndex = webRel.lastIndexOf('/');
    var urlpath = webRel.substring(0, lastIndex);
    return urlpath;
}

function SharePointContext() {
    var self = this;
    self.userEmail = null;
    self.UserName = ko.observable();
    self.requestDigest = undefined;
    $.ajax({
        url: $(location).attr('href').toString().toLowerCase().split('/pages')[0] + "/_api/contextinfo",
        method: "POST",
        headers: { "Accept": "application/json; odata=verbose" },
        success: function (data) {
            self.requestDigest = data.d.GetContextWebInformation.FormDigestValue;
        },
        error: function (data, errorCode, errorMessage) {
            alert(errorMessage)
        }
    });

    function init() {
        this.clientContext = SP.ClientContext.get_current();
        this.oWeb = clientContext.get_web();
        currentUser = this.oWeb.get_currentUser();
        this.clientContext.load(currentUser);
        this.clientContext.executeQueryAsync(onQuerySucceeded, onQueryFailed);
    }
    function onQuerySucceeded() {
        self.userEmail = currentUser.get_email();
        self.UserName(currentUser.$2_0.$K_0.Title);
        self.checkList();
    }
    function onQueryFailed(sender, args) {
        init();
    }



    self.Init = function () {
        init();
    }

    self.GetItemTypeForListName = function (name) {
        return "SP.Data." + name.charAt(0).toUpperCase() + name.slice(1) + "ListItem";
    }
    self.refreshToken = ko.observable();

    self.CreateItem = function (token) {
        var itemType = self.GetItemTypeForListName("Users_x0020_Refresh_x0020_Tokens");
        var item = {
            "__metadata": { "type": itemType },
            "Title": token,
            "UserEmail": self.userEmail
        };
        $.ajax({
            url: getUrlPath() + "/_api/web/lists/getbytitle('Users%20Refresh%20Tokens')/items",
            type: "POST",
            contentType: "application/json;odata=verbose",
            data: JSON.stringify(item),
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-RequestDigest": self.requestDigest
            },
            success: function (data) {
                console.log(data);
            },
            error: function (data) {
                debugger;
                console.log(data);
            }
        });
    }




    self.checkList = function () {
        var url = getUrlPath() + "/_api/web/Lists/getbytitle('Users%20Refresh%20Tokens')/Items";
        $.ajax(
             {
                 url: url,
                 method: "GET",
                 headers: { "Accept": "application/json; odata=verbose" },
                 success: function (data, aa, bb) {
                     var exist = false;
                     for (var ii = 0; ii < data.d.results.length; ii++) {
                         var listItem = data.d.results[ii];
                         if (listItem.UserEmail.toLowerCase() == self.userEmail.toLowerCase()) {
                             exist = true;
                             self.refreshToken(listItem.Title);
                         }
                     }
                     if (!exist) {
                         self.refreshToken("Not Found");
                     }
                 },
                 error: function (data, aa, bb) {
                     alert("Ooops an error occured");
                 }
             });
    }
}

function Cabinet(name, id, repositoryid, repositoryname) {
    var self = this;
    self.Name = name;
    self.ID = id;
    self.repositoryId = repositoryid;
    self.repositoryName = repositoryname;

}

function NetDocsInfo() {
    var self = this;
    self.BaseNetDocsUrl = "https://api.vault.netvoyage.com";
    self.ClientId = "AP-BJCDEEIW";
    self.ClientSecret = "DfWdTV6gixpfSQeaB0ydq5lUwlLiFV8tvJocfk4jEiogNI8k";
    self.AppUrl = $(location).attr('href').split('?')[0];
    self.Privileges = "full";
    self.OAuthURL = "https://vault.netvoyage.com/neWeb2/OAuth.aspx";
    self.fullURL = self.OAuthURL + '?client_id=' + self.ClientId + '&scope=' + self.Privileges + '&response_type=code&redirect_uri=' + self.AppUrl;
}

function ViewModel() {
    var self = this;
    self.Parent = ko.observable(null);
    self.ShowClass = ko.observable();
    self.SharepointContext = ko.observable(new SharePointContext());
    self.SelectedCabinet = ko.observable();
    self.isCustomSearch = ko.observable(false);
    self.Search = "";
    self.HistoryLength = ko.observable(window.history.length);
    self.HistoryIndex = ko.observable(self.HistoryLength());
    self.HistoryLength.subscribe(function (newValue) {
        self.HistoryIndex(newValue);
    });
    self.getUserInfo = function (userID, file) {
        self.NetDocToolKit().user.getInfo({
            id: userID,
            success: function (data) {
                file.checkoutTo(data.displayName);
            },
            error: function (data) {
                debugger;
            }
        });
    }
    self.SelectedItem = ko.observable();
    self.Cabinets = ko.observableArray();
    self.Item = ko.observableArray();
    self.firstLogin = ko.observable();
    self.refreshToken = ko.observable();
    self.Clicked = function (File) {
        File.Selected(!File.Selected());
        File.SelectionImg(File.Selected() ? "../images/checked.png" : "../images/unchecked.png");
    }

    self.checkOutFile = function (File) {
        if (File.ext != 'ndfld') {
            var result = prompt("Are you sure you want to check out this document\nCommnets:");
            if (result != null) {
                var myDocument = {};
                myDocument.id = File.ID;
                myDocument.comment = result,
                myDocument.addToRecent = false;
                myDocument.download = false;
                myDocument.success = function (data, textStatus, jqXHR) {
                    alert("Document Checked Out successfully");
                    File.checkedOut(true);
                }
                myDocument.error = function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log(jqXHR);
                }
                self.NetDocToolKit().document.checkOut(myDocument);
            }
        }
        else {
            alert("Cannot CheckOut Folders");
        }
    }

    self.checkInFile = function (Item) {
        if (File.ext != 'ndfld') {
            if (confirm("Are you sure you want to check in this document?")) {
                var myDocument = {};
                myDocument.id = Item.ID;
                myDocument.success = function (data, textStatus, jqXHR) {
                    alert("Document Checked In successfully");
                    Item.checkedOut(false);
                }
                myDocument.error = function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log(jqXHR);
                }
                self.NetDocToolKit().document.checkIn(myDocument);
            }
        }
        else {
            alert("Cannot CheckIn Folders");
        }
    }

    self.removeFile = function (Item) {
        if (Item.ext != 'ndfld') {
            if (confirm("Are you sure you want to delete this document?")) {
                var myDocument = {};
                myDocument.id = Item.ID;
                myDocument.success = function (data, textStatus, jqXHR) {
                    alert("Document deleted successfully");
                }
                myDocument.error = function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log(jqXHR);
                }
                self.NetDocToolKit().document.deleteItem(myDocument);
            }
        }
        else {
            if (confirm("Are you sure you want to delete this folder?")) {
                var myFolder = {};
                myFolder.id = Item.ID;
                myFolder.deleteContents = confirm("Do you want to delete its content?");
                myFolder.success = function (data, textStatus, jqXHR) {
                    alert("Folder deleted successfully");
                }
                myFolder.error = function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log(jqXHR);
                }
                self.NetDocToolKit().folder.deleteItem(myFolder);
            }
        }
    }

    self.closeDiv = function (item) {
        $('#close-' + item.ID).hide();
    }

    self.refreshToken.subscribe(function (newValue) {
        var request = new XMLHttpRequest();
        var myNetDocts = new NetDocsInfo();
        request.onreadystatechange = function (data) {
            if (request.readyState == 4) {
                if (request.status == 200) {
                    self.NetDocToolKit(new NetDocs("https://api.vault.netvoyage.com", JSON.parse(request.response).access_token));
                }
            }
        }
        var body = "grant_type=refresh_token&refresh_token=" + encodeURIComponent(newValue);
        request.open('POST', 'https://api.vault.netvoyage.com/v1/OAuth', true);
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.setRequestHeader("Authorization", "Basic " + Base64.encode(myNetDocts.ClientId + ":" + myNetDocts.ClientSecret));
        request.setRequestHeader("Accept", "application/json");
        request.send(body);
    });



    self.enterSubFolder = function (File) {
        if (File.ext == 'ndfld') {
            var hash = location.hash;
            location.hash = "parent=" + encodeURIComponent(hash) + "&current=" + encodeURIComponent("cabID=" + self.SelectedCabinet().ID + "&folderID=" + File.ID);
        }
        else {
            if (File.ext == 'custom') {
                var hash = location.hash;
                var criteria = "%3D1004(%7B" + File.ID + "%7D)";
                location.hash = "parent=" + encodeURIComponent(hash) + "&current=" + encodeURIComponent("criteria=" + criteria + "&cabID=" + self.SelectedCabinet().ID);
            }
            else {
                var myDocument = {};
                myDocument.id = File.ID;
                myDocument.addToRecent = false;
                myDocument.success = function (data, textStatus, jqXHR) {
                    var myBlob = new Blob([data], jqXHR.getResponseHeader("Content-Type"));
                    window.saveAs(myBlob, File.FullName);
                }
                myDocument.error = function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log(jqXHR);
                }
                self.NetDocToolKit().document.getContent(myDocument);
            }
        }
    }


    self.AlreadyExists = function (ID) {
        for (var ii = 0; ii < self.Item().length; ii++) {
            if (ID == self.Item()[ii].ID)
                return true;
        }
        return false;
    }

    self.Back = function () {
        window.history.back();
    }
    self.Up = function (Item) {
        $("#search").val("");
        location.hash = self.Parent();
    }

    self.Searching = false;

    self.searchFiles = function (criteria, CabId, cabinetName) {
        if (self.Searching == false) {
            self.Searching = true;
            if (self.NetDocToolKit()) {
                if (CabId != undefined) {
                    if (self.Cabinets().length > 0) {
                        for (var ii = 0; ii < self.Cabinets().length; ii++) {
                            var item = self.Cabinets()[ii];
                            if (item.ID == CabId) {
                                if (self.SelectedCabinet().ID != item.ID) {
                                    self.SelectedCabinet(item);
                                }
                                break;
                            }
                        }
                    }
                }
                else {
                    if (cabinetName != undefined) {
                        if (self.Cabinets().length > 0) {
                            for (var ii = 0; ii < self.Cabinets().length; ii++) {
                                var item = self.Cabinets()[ii];

                                if (item.Name.toLowerCase() == cabinetName.toLowerCase()) {
                                    CabId = item.ID;
                                    if (self.SelectedCabinet().ID != item.ID) {
                                        self.SelectedCabinet(item);
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        CabId = self.SelectedCabinet().ID;
                    }
                }
                self.Clear();
                self.SelectedItem(null);
                self.NetDocToolKit().search.performSearch({
                    cabGuid: CabId,
                    criteria: criteria,
                    maxResults: "500",
                    select: "standardAttributes",
                    success: function (data) {
                        $('.remove-me').remove();
                        $('#myTable').trigger('update');
                        self.ArraySize = data.standardList.length;
                        for (var ii = 0; ii < data.standardList.length; ii++) {
                            if (!self.AlreadyExists(data.standardList[ii].id)) {
                                if (data.standardList[ii].extension != "ndfld") {
                                    self.NetDocToolKit().document.getInfo({
                                        id: data.standardList[ii].id,
                                        extras: "allowClosed=true",
                                        success: function (data2) {
                                            var retrievedItem = data2.standardAttributes;
                                            var myItem = new Item(retrievedItem.name, retrievedItem.size, retrievedItem.id, retrievedItem.envId, retrievedItem.created, retrievedItem.createdBy, retrievedItem.url, retrievedItem.modified, retrievedItem.modifiedBy, retrievedItem.versions, retrievedItem.extension, data2.customAttributes, undefined, data2.checkedOut);
                                            self.Item.push(myItem);
                                            if (data2.checkedOut)
                                                self.getUserInfo(data2.checkedOut.by, myItem);
                                            self.UpdateTable();
                                        },
                                        error: function (data, extra, extra2) {
                                            debugger;
                                            self.ArraySize--;
                                            self.UpdateTable();
                                        }
                                    });
                                }
                                else {
                                    var retrievedItem = data.standardList[ii];
                                    self.Item.push(new Item(retrievedItem.name, retrievedItem.size, retrievedItem.id, retrievedItem.envId, retrievedItem.created, retrievedItem.createdBy, retrievedItem.url, retrievedItem.modified, retrievedItem.modifiedBy, retrievedItem.versions, retrievedItem.extension, undefined, self.SelectedCabinet()));
                                    self.UpdateTable();
                                }
                            }
                        }
                        self.UpdateTable();
                    },
                    error: function (data) {
                        self.Clear();
                        self.ArraySize = 0;
                        self.UpdateTable();
                        debugger;
                    }
                });
            }
        }
    }

    self.UpLevelVisibility = ko.computed(function () {
        return self.Parent() != undefined;
    });

    self.ArraySize = -1;

    self.UpdateTable = function (isCab) {
        if (self.ArraySize == self.Item().length) {
            if (isCab != undefined) {
                var cabAttr = {};
                cabAttr.id = self.SelectedCabinet().ID;
                cabAttr.success = function (data, textStatus, jqXHR) {
                    var found = false;
                    for (var ii = 0; ii < data.length; ii++) {
                        if (data[ii].name == "DocType") {
                            found = true;
                            var attr = {};
                            attr.repository = self.SelectedCabinet().repositoryId;
                            attr.field = data[ii].id;
                            attr.success = function (attrData, attrTxtStatus, attrjqXHR) {
                                self.ArraySize += attrData.rows.length;
                                for (var ii = 0; ii < attrData.rows.length; ii++) {
                                    self.Item.push(new Item(attrData.rows[ii].description, undefined, attrData.rows[ii].key, undefined, undefined, undefined, undefined, undefined, undefined, undefined, "custom"));
                                }
                                self.UpdateTable();
                            }
                            attr.error = function (attrData, attrTxtStatus, attrjqXHR) {
                                debugger;
                                self.UpdateTable();
                            }
                            self.NetDocToolKit().attributes.get(attr);
                        }
                    }
                    if (!found)
                        self.UpdateTable();
                }
                cabAttr.error = function (jqXHR, textStatus, errorThrown) {
                    self.UpdateTable();
                    debugger;
                }
                self.NetDocToolKit().cabinet.getCustomAttributes(cabAttr);
            }
            else {
                setTimeout(function () {
                    if (self.isCustomSearch()) {
                        $("#search").quicksearch($("#myTable .myRow "), searchOptions);
                    }
                    $('#myTable').trigger('update');
                    $('#fieldSet').unblock();
                    self.ShowClass("");
                    self.Searching = false;
                    var hostPageMessage = {};
                    hostPageMessage.type = "setHeight";
                    hostPageMessage.message = $("fieldset").innerHeight() + 160;
                    var hostPageMessageString = JSON.stringify(hostPageMessage);
                    window.parent.postMessage(hostPageMessageString, "*");
                }, 500);
            }
        }
    }

    self.Clear = function () {
        for (var ii = 0; ii < self.Item().length; ii++) {
            $("#" + self.Item()[ii].ID).remove();
        }
        self.ArraySize = 0;
        self.Item.removeAll();
        var hostPageMessage = {};
        hostPageMessage.type = "setHeight";
        hostPageMessage.message = $("fieldset").innerHeight() + 160;
        var hostPageMessageString = JSON.stringify(hostPageMessage);
        window.parent.postMessage(hostPageMessageString, "*");
    }
    self.RetrieveFolders = function (cab, isBack) {
        var myFolders = {};
        myFolders.id = cab.ID;
        myFolders.select = "standardAttributes";
        self.Clear();
        $('.remove-me').remove();
        self.Parent(null);
        myFolders.success = function (data, textStatus, jqXHR) {

            $('#myTable').trigger('update');
            self.ArraySize = data.standardList.length;
            for (var ii = 0; ii < data.standardList.length; ii++) {
                if (!self.AlreadyExists(data.standardList[ii].id)) {

                    var retrievedItem = data.standardList[ii];
                    self.Item.push(new Item(retrievedItem.name, retrievedItem.size, retrievedItem.id, retrievedItem.envId, retrievedItem.created, retrievedItem.createdBy, retrievedItem.url, retrievedItem.modified, retrievedItem.modifiedBy, retrievedItem.versions, retrievedItem.extension, undefined, cab));

                }
            }
            self.UpdateTable(true);
        };
        myFolders.error = function (jqXHR, textStatus, errorThrown) {
            debugger;
            self.Clear();
            self.UpdateTable();
        }
        self.NetDocToolKit().cabinet.getFolders(myFolders);
        return cab;
    }

    self.isrefreshToken = ko.computed(function () {
        return self.refreshToken() != null;
    });

    self.RetrieveItems = function (folder) {
        var myFiles = {};
        myFiles.id = folder.ID;
        myFiles.select = "standardAttributes";
        myFiles.extensions = null;
        self.Clear();
        $('.remove-me').remove();
        folder.extension = "folder";
        myFiles.success = function (data, textStatus, jqXHR) {
            $('#myTable').trigger('update');
            self.ArraySize = data.standardList.length;
            for (var ii = 0; ii < data.standardList.length; ii++) {
                if (!self.AlreadyExists(data.standardList[ii].id)) {
                    if (data.standardList[ii].extension == "ndfld") {
                        var retrievedItem = data.standardList[ii];
                        var myItem = new Item(retrievedItem.name, retrievedItem.size, retrievedItem.id, retrievedItem.envId, retrievedItem.created, retrievedItem.createdBy, retrievedItem.url, retrievedItem.modified, retrievedItem.modifiedBy, retrievedItem.versions, retrievedItem.extension, data.customAttributes, folder);
                        self.Item.push(myItem);

                        self.UpdateTable();
                    }
                    else {
                        self.NetDocToolKit().document.getInfo({
                            id: data.standardList[ii].id,
                            extras: "allowClosed=true",
                            success: function (data) {
                                var retrievedItem = data.standardAttributes;
                                var myItem = new Item(retrievedItem.name, retrievedItem.size, retrievedItem.id, retrievedItem.envId, retrievedItem.created, retrievedItem.createdBy, retrievedItem.url, retrievedItem.modified, retrievedItem.modifiedBy, retrievedItem.versions, retrievedItem.extension, data.customAttributes, folder, data.checkedOut);
                                self.Item.push(myItem);
                                if (data.checkedOut)
                                    self.getUserInfo(data.checkedOut.by, myItem);
                                self.UpdateTable();
                            },
                            error: function (data, extra, extra2) {
                                self.ArraySize--;
                                self.UpdateTable();
                                debugger;
                            }
                        });
                    }

                }
            }
            self.UpdateTable();
        }
        myFiles.error = function (jqXHR, textStatus, errorThrown) {
            self.Clear();
            self.UpdateTable();
            debugger;
        }
        self.NetDocToolKit().folder.getContents(myFiles);
    }

    self.AddCabinet = function (name, id, repositoryid, repositoryname) {

        self.Cabinets.push(new Cabinet(name, id, repositoryid, repositoryname));
    }

    self.Token = ko.observable();

    self.NetDocToolKit = ko.observable(null);

    self.NetDocToolKit.subscribe(function (newValue) {
        if (newValue && newValue.user)
            newValue.user.getCabinets({
                success: function (data) {
                    for (var ii = 0; ii < data.length; ii++) {
                        self.AddCabinet(data[ii].name, data[ii].id, data[ii].repositoryId, data[ii].repositoryName);
                    }
                    self.Init();
                },
                error: function (data, extra, extra2) {
                    debugger;
                    console.log(data);
                }
            });
    });

    self.OptionChanged = function (newValue, event) {
        $("#search").val("");
        location.hash = "current=" + encodeURIComponent("cabID=" + newValue.SelectedCabinet().ID);
    }

    self.extentionClicked = function (Item) {
        $('#close-' + Item.ID).css('display', 'block');
        setTimeout(function () {
            $(document).mouseup(function (e) {
                var container = $('#close-' + Item.ID);
                if (!container.is(e.target) // if the target of the click isn't the container...
                    && container.has(e.target).length === 0) // ... nor a descendant of the container
                {
                    container.hide();
                    $(this).off(e);
                }

            });
        }, 500);
    }

    self.SelectedItem.subscribe(function (newValue) {
        if (newValue)
            location.hash = "navigation?cabinet=" + self.SelectedCabinet().ID + "&folder=" + newValue.ID;
    });

    self.Text = ko.computed(function () {
        return self.isrefreshToken() == true ? "Welcome " + self.SharepointContext().UserName() : "Not logged in yet.";
    });

    self.MakeSearch = function (hashInfo) {
        var params = hashInfo.split("&");
        var criteria = undefined
        var cabinet = undefined;
        var cabinetName = undefined;
        for (var i = 0; i < params.length; i = i + 1) {
            var param = params[i].split("/");
            switch (param[0]) {
                case "cabinet":
                    cabinet = decodeURIComponent(param[1]);
                    break;
                case "criteria":
                    criteria = decodeURIComponent(param[1]);
                    break;
                case "cabinetName":
                    cabinetName = decodeURIComponent(param[1]);
                    break;
            }
        }
        if (criteria != "" && (cabinet != "" || cabinetName != "")) {
            $('#fieldSet').block(blockTableProperties);
            self.ShowClass("notShowRow");
            self.searchFiles(criteria, cabinet, cabinetName);
        }

    }

    self.InputHasValue = false;

    self.ConfigureSearch = function () {
        self.InputHasValue = true;
        var StartWordExt = new RegExp("(^|\\s)\\w+\\*\\.[a-z]{3,4}\\b", "gi");
        var EndWordExt = new RegExp("(^|\\s)\\*\\w+\\.[a-z]{3,4}\\b", "gi");
        var searchValue = $("#search").val().replace(/"/g, "'");
        var regexpExt = new RegExp("\\*\\.([a-z]{3,4})\\b", "gi");
        var regexpLS = new RegExp("\'(\\w* *\\w*\)*'", "gi");
        var result;
        var extensions = [];
        var literalString = [];
        var StartWordExtArray = [];
        var EndWordExtArray = [];
        var prevcriteria = "";
        var hash = location.hash;
        if (/current=.*criteria%3D/gi.test(hash)) {
            var cabID = undefined;
            var cabName = undefined;
            var prevcriteria = "";
            var params = decodeURIComponent(/current=.*criteria%3D.*/gi.exec(hash)[0].replace("current=", "")).split("&");
            for (var i = 0; i < params.length; i++) {
                var param = params[i].split("=");
                switch (param[0]) {
                    case "cabID":
                        cabID = decodeURIComponent(param[1]);
                        break;
                    case "criteria":
                        prevcriteria = decodeURIComponent(param[1]);
                        break;
                    case "cabName":
                        cabName = decodeURIComponent(param[1]);
                        break;
                }
            }
        }

        while ((result = StartWordExt.exec(searchValue)) != null) {
            StartWordExtArray.push(result[0]);
        }
        for (var ii = 0; ii < StartWordExtArray.length; ii++) {
            searchValue = searchValue.replace(StartWordExtArray[ii], "");
        }

        while ((result = EndWordExt.exec(searchValue)) != null) {
            EndWordExtArray.push(result[0]);
        }
        for (var ii = 0; ii < EndWordExtArray.length; ii++) {
            searchValue = searchValue.replace(EndWordExtArray[ii], "");
        }

        while ((result = regexpLS.exec(searchValue)) != null) {
            literalString.push(result[0]);
        }
        for (var ii = 0; ii < literalString.length; ii++) {
            searchValue = searchValue.replace(literalString[ii], "");
        }
        while ((result = regexpExt.exec(searchValue)) != null) {
            extensions.push(result[0].replace("*.", ""));
        }
        for (var ii = 0; ii < extensions.length; ii++) {
            searchValue = searchValue.replace("*." + extensions[ii], "");
        }
        var simpleText = searchValue.split(" ").filter(function (value) { return value != ""; });
        literalString = literalString.concat(simpleText);
        for (var ii = 0; ii < StartWordExtArray.length; ii++) {
            literalString.push(StartWordExtArray[ii].slice(0, StartWordExtArray[ii].indexOf("*") + 1));
            extensions.push(StartWordExtArray[ii].slice(StartWordExtArray[ii].indexOf("*") + 2));
        }
        for (var ii = 0; ii < EndWordExtArray.length; ii++) {
            literalString.push(EndWordExtArray[ii].slice(0, EndWordExtArray[ii].indexOf(".")));
            extensions.push(EndWordExtArray[ii].slice(EndWordExtArray[ii].indexOf(".") + 1));
        }
        var extCrit = extensions.join(" OR ");

        var nameCrit = literalString.join(" OR ");
        if (extCrit != "") {
            prevcriteria += " =11(" + extCrit + ") ";
        }
        if (nameCrit != "") {
            prevcriteria += " =3(" + nameCrit + ")";
        }
        $('#fieldSet').block(blockTableProperties);
        self.ShowClass("notShowRow");
        self.searchFiles(prevcriteria, cabID, cabName);
    }

    self.doSearch = function (obj, event) {
        if (!self.isCustomSearch()) {
            if (event.keyCode == 13) {
                $('#fieldSet').focus();
                if ($("#search").val() != "") {
                    self.ConfigureSearch();
                }
                else {
                    $('#fieldSet').focus();
                    if (self.InputHasValue) {
                        self.InputHasValue = false;
                        $("#search").val("");
                        $(window).hashchange();
                    }
                }
            }
            else {
                if (event.keyCode == 27) {
                    $('#fieldSet').focus();
                    if (self.InputHasValue) {
                        self.InputHasValue = false;
                        $("#search").val("");
                        $(window).hashchange();
                    }
                }
            }
        }

    }

    self.BackLevelVisibility = ko.observable(false);

    self.firstLogin((new NetDocsInfo()).fullURL);

    self.Init = function () {

        if (self.isCustomSearch()) {
            location.hash = "current=" + encodeURIComponent(self.Search.replace(/\#/g, ""));
        }
        $(window).hashchange(function (aa, bb, cc) {
            self.InputHasValue = false;
            $("#search").val("");
            var hash = location.hash.replace(/\#/g, "");
            var parent = undefined;
            var current = undefined;
            var params = hash.split("&");
            for (var i = 0; i < params.length; i = i + 1) {
                var param = params[i].split("=");
                switch (param[0]) {
                    case "parent":
                        parent = decodeURIComponent(param[1]);
                        break;
                    case "current":
                        current = decodeURIComponent(param[1]);
                        break;
                }
            }
            self.Parent(parent);
            var cabID = undefined;
            var folderID = undefined;
            var criteria = undefined;
            var cabName = undefined;
            if (current != undefined) {
                self.ShowClass("notShowRow");
                $('#fieldSet').block(blockTableProperties);
                var params = current.split("&");
                for (var i = 0; i < params.length; i++) {
                    var param = params[i].split("=");
                    switch (param[0]) {
                        case "cabID":
                            cabID = decodeURIComponent(param[1]);
                            break;
                        case "folderID":
                            folderID = decodeURIComponent(param[1]);
                            break;
                        case "criteria":
                            criteria = decodeURIComponent(param[1]);
                            break;
                        case "cabName":
                            cabName = decodeURIComponent(param[1]);
                            break;
                    }
                }
                if (folderID != undefined) {
                    self.RetrieveItems({ ID: folderID });
                    if (self.SelectedCabinet().ID != cabID)
                        for (var ii = 0; ii < self.Cabinets().length; ii++) {
                            if (self.Cabinets()[ii].ID == cabID) {
                                self.SelectedCabinet(self.Cabinets()[ii]);
                            }
                        }


                }
                else {
                    if (criteria != undefined) {

                        self.searchFiles(criteria, cabID, cabName);
                    }
                    else {
                        self.RetrieveFolders({ ID: cabID });
                    }
                }
            }

        });
        $(window).hashchange();
    }


    self.SharepointContext().refreshToken.subscribe(function (newValue) {
        if (newValue != "Not Found") {
            self.refreshToken(newValue);
        }
        else {
            if (code != undefined) {
                var myNetDocts = new NetDocsInfo();
                var request = new XMLHttpRequest();
                request.onerror = function (aa, bb, cc) {
                    debugger;
                    console.log(aa);
                }
                request.onreadystatechange = function (aa) {
                    if (request.readyState == 4) {
                        if (request.status == 200) {
                            self.SharepointContext().CreateItem(JSON.parse(request.response).refresh_token);
                            self.refreshToken(JSON.parse(request.response).refresh_token);

                        }
                    }
                }
                var requestBody = "grant_type=authorization_code&code=" + encodeURIComponent(code) + "&" + encodeURIComponent("redirect_uri") + "=" + encodeURIComponent(myNetDocts.AppUrl.split('?')[0]);
                request.open('POST', "https://api.vault.netvoyage.com/v1/OAuth", true);
                request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                request.setRequestHeader("Authorization", "Basic " + Base64.encode(myNetDocts.ClientId + ":" + myNetDocts.ClientSecret));
                request.setRequestHeader("Accept", "application/json");
                request.send(requestBody);
            }
            else {
                self.firstLogin((new NetDocsInfo()).fullURL);
            }
        }
    });


    var sendHostPageInfoListener = function (e) {

        var returnedData = JSON.parse(e.data);
        requestDigest = returnedData.requestDigest;
        if (returnedData.getHostURL == false) {
            if (returnedData.isCustomSearch == true) {
                self.isCustomSearch(true);
                self.Search = "cabName=" + encodeURIComponent(returnedData.cabinetName) + "&criteria=" + encodeURIComponent(returnedData.criteria);

            }
            self.SharepointContext().Init();
        }
    };

    if (typeof window.addEventListener !== 'undefined') {
        window.addEventListener('message', sendHostPageInfoListener, false);
    }
    else if (typeof window.attachEvent !== 'undefined') {
        window.attachEvent('onmessage', sendHostPageInfoListener);
    }

    var hostPageMessage = {};
    hostPageMessage.message = "knockoutready";
    var hostPageMessageString = JSON.stringify(hostPageMessage);
    window.parent.postMessage(hostPageMessageString, "*");


}

var myViewModel = new ViewModel();
var pagerOptions = {
    container: $(".pagerOne"),
    // possible variables: {page}, {totalPages}, {filteredPages}, {startRow}, {endRow}, {filteredRows} and {totalRows}
    output: 'Showing rows from {startRow} to {endRow} of {filteredRows}',
    // apply disabled classname to the pager arrows when the rows at either extreme is visible - default is true
    updateArrows: true,
    // starting page of the pager (zero based index)
    page: 0,
    // Number of visible rows - default is 10
    size: 10,
    // table row set to a height to compensate; default is false
    fixedHeight: true,

    removeRows: false,
    // css class names of pager arrows
    cssNext: '.next', // next page arrow
    cssPrev: '.prev', // previous page arrow
    cssFirst: '.first', // go to first page arrow
    cssLast: '.last', // go to last page arrow
    cssGoto: '.gotoPage', // select dropdown to allow choosing a page
    cssPageDisplay: '.pagedisplay', // location of where the "output" is displayed
    //cssPageSize: '.pagesize', // page size selector - select dropdown that sets the "size" option
    // class added to arrows when at the extremes (i.e. prev/first arrows are "disabled" when on the first page)
    cssDisabled: 'disabled', // Note there is no period "." in front of this class name
    cssErrorRow: 'tablesorter-errorRow' // ajax error information row
};

var searchOptions = {
    delay: 0,
    testQuery: function (query, txt, _row) {
        var cellToSearch = $(_row).find(".toSearch");
        if (query[0].indexOf('*.') != -1 && query[0].length >= 2) {
            var ext = query[0].slice(2, query[0].length).toString();
            if (cellToSearch.hasClass(ext)) {
                return true;
            }
        } else {
            for (var ii = 0; ii < query.length; ii++) {
                if (cellToSearch.text().toLowerCase().indexOf(query[ii].toLowerCase()) === -1) {
                    return false;
                }
            }
            return true;
        }

    },
    show: function () {
        $(this).show().removeClass('filtered');
        $('#myTable').trigger('update'); // reset to page 1 & update display
    },
    hide: function () {
        $(this).hide().addClass('filtered');
        $('#myTable').trigger('update'); // reset to page 1 & update display
    },
    onAfter: function () {
        $('#myTable').trigger('update');
    },

};

var blockTableProperties = {
    message: $('#loading'),
    centerY: 0,
    css: {
        border: 'none',
        padding: '15px',
        backgroundColor: '#000',
        '-webkit-border-radius': '10px',
        '-moz-border-radius': '10px',
        opacity: .5,
        color: '#fff',
        top: '10px', left: '', right: '10px'
    }
}

var dateSorter = {
    id: "customDate",
    is: function (s) {
        return /\d{1,4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}\.\d+/.test(s);
    },
    format: function (s) {
        return newDate = new Date(fixString(s)).getTime();
    },
    type: "numeric"
};

function fixString(input) {
    var output = [];
    var index = 0;
    for (var i = 0; i < input.length; i++) {
        var charCode = input.charCodeAt(i)
        if (charCode != 8206) {
            output[index] = String.fromCharCode(charCode);
            index++;
        }
    }
    return output.join('');
}

function myParseInt(str) {
    str = str.substring(1, str.length);
    var res = str.charCodeAt(0) - 48;
    var strLength = str.length;
    for (i = 1; i < strLength; i++) {
        var charCode = str.charCodeAt(i)
        if (charCode != 8206) {
            res *= 10;
            var value = charCode - 48;
            res += value;
        }
    }
    return res;
};

ko.bindingHandlers.sortTable = {
    init: function (element, valueAccessor) {

        setTimeout(function () {
            $.tablesorter.addParser(dateSorter);
            $(element).addClass('tablesorter');
            $(element).tablesorter({
                widthFixed: true,
                tableClass: 'hasFilters',
                headers: {
                    6: { sorter: 'customDate' }
                }
            })
                .tablesorterPager(pagerOptions).bind('pagerChange pagerComplete pagerInitialized pageMoved', function (e, c) {
                    var msg = '"</span> event triggered, ' + (e.type === 'pagerChange' ? 'going to' : 'now on') +
                      ' page <span class="typ">' + (c.page + 1) + '/' + c.totalPages + '</span>';
                    $('#display')
                      .append('<li><span class="str">"' + e.type + msg + '</li>')
                      .find('li:first').remove();
                });

        }, 0);
    },
};

ko.applyBindings(myViewModel);

window.saveAs || (window.saveAs = (window.navigator.msSaveBlob ? function (b, n) { return window.navigator.msSaveBlob(b, n); } : false) || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs || (function () {
    window.URL || (window.URL = window.webkitURL);
    if (!window.URL) {
        return false;
    }
    return function (blob, name) {
        var url = URL.createObjectURL(blob);
        if ("download" in document.createElement('a')) {
            var a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', name);
            var clickEvent = document.createEvent("MouseEvent");
            clickEvent.initMouseEvent("click", true, true, window, 0,
                event.screenX, event.screenY, event.clientX, event.clientY,
                event.ctrlKey, event.altKey, event.shiftKey, event.metaKey,
                0, null);
            a.dispatchEvent(clickEvent);
        }
        else {
            window.open(url, '_blank', '');
        }
    };

})()
);

$('th').hover(
function () { $(this).addClass('ms-headerCellStyleHover') },
function () { $(this).removeClass('ms-headerCellStyleHover') }
);

