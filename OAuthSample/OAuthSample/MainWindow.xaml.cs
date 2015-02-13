using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Forms;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using RestSharp;
using System.Web;
using Newtonsoft.Json;
using System.Net;

namespace OAuthSample
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private String accessCode = "";
        private String baseLoginUrl = "https://vault.netvoyage.com/neWeb2/OAuth.aspx"; //https://vault.netvoyage.com/neWeb2/mobile/login.aspx?ie7warn=N
        private String baseApiUrl = "https://api.vault.netvoyage.com"; //https://api.eu.netdocuments.com
        private String clientID = "AP-WXJAQSGO"; // insert your own client ID here
        private String clientSecret = "0VwqE6f4b9ErcDFRbivG6J42QzisW5maYyLD6GGHH4OGLd3q"; // insert your own client secret here
        private String scope = "full";
        private String responseType = "code";
        private String redirectURI = "https://localhost"; // insert your own redirectURI here.  Note that this sample will not work with some redirect URIs as it is written.
        private String accessToken = "";
        private String refreshToken = "";
        private RestSharp.RestClient restClient;
        private List<Cabinet> cabinetList;
        private OpenFileDialog open;
        private List<CustomAttribute> cabinetCustomAttributes;

        public MainWindow()
        {
            cabinetList = new List<Cabinet>();
            restClient = new RestClient(baseApiUrl);

            InitializeComponent();
            CabinetListComboBox.ItemsSource = cabinetList;

        }

        /// <summary>
        /// Makes the actual rest calls.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        private IRestResponse executeRequest(RestRequest request)
        {
            restClient.Authenticator = new HttpBasicAuthenticator(clientID, clientSecret);
            request.AddHeader("Authorization", "Bearer " + accessToken);
            return restClient.Execute(request);
        }

        /// <summary>
        /// Helper function for providing base64 encoding to for proper authentication.
        /// </summary>
        /// <param name="toEncode"></param>
        /// <returns></returns>
        private String Base64Encode(string toEncode)
        {
            byte[] byteArray = System.Text.ASCIIEncoding.ASCII.GetBytes(toEncode);
            return System.Convert.ToBase64String(byteArray);
        }

        /// <summary>
        /// Used to get a new refresh token from an access code.
        /// </summary>
        /// <param name="status"></param>
        /// <param name="errMsg"></param>
        /// <returns></returns>
        public String GetRefreshToken(ref string status, ref string errMsg)
        {
            string responseStr = "";
            string url = "v1/OAuth";

            RestRequest request = new RestRequest(url, Method.POST);
            request.AddHeader("Authorization", "Basic " + Base64Encode(clientID + ":" + clientSecret));
            request.AddParameter("grant_type", "authorization_code");
            request.AddParameter("code", accessCode);
            request.AddParameter("redirect_uri", redirectURI);
            
            IRestResponse response;

            try
            {
                response = restClient.Execute(request);
                responseStr = response.Content;
                status = response.StatusDescription;
            }
            catch (Exception ex)
            {
                errMsg = ex.Message;
                return null;
            }
            return responseStr;
        }

        /// <summary>
        /// Used to get an access token from a refresh token.
        /// </summary>
        /// <param name="status"></param>
        /// <param name="errMsg"></param>
        /// <returns></returns>
        public String GetAccessToken(ref string status, ref string errMsg)
        {
            string responseStr = "";
            string url = "v1/OAuth";

            RestRequest request = new RestRequest(url, Method.POST);
            request.AddHeader("Authorization", "Basic " + Base64Encode(clientID + ":" + clientSecret));
            request.AddParameter("grant_type", "refresh_token");
            request.AddParameter("refresh_token", refreshToken);

            IRestResponse response;

            try
            {
                response = restClient.Execute(request);
                responseStr = response.Content;
                status = response.StatusDescription;
            }
            catch (Exception ex)
            {
                errMsg = ex.Message;
                return null;
            }
            return responseStr;
        }

        /// <summary>
        /// Useful helper function for REST calls.
        /// </summary>
        /// <param name="rtype"></param>
        /// <param name="data"></param>
        /// <param name="useXML"></param>
        /// <returns></returns>
        private RestRequest FormRequest(Method method, string data, Boolean useXML)
        {
            RestRequest request = new RestRequest(data, method);

            if (useXML)
                request.AddHeader("Accept", "application/xml");
            else
                request.AddHeader("Accept", "application/json");

            return request;
        }

        /// <summary>
        /// This is a very simple REST call, just used to verify that the Access Token is working
        /// </summary>
        /// <param name="status"></param>
        /// <param name="errMsg"></param>
        /// <returns></returns>
        public string GetSystemStatus(ref string status, ref string errMsg)
        {
            string responseStr = "";
            string url = "v1/System/info";

            Boolean useXml = false;

            RestRequest rr = FormRequest(Method.GET, url, useXml);
            IRestResponse response;

            try
            {
                response = executeRequest(rr);
                responseStr = response.Content;
                status = response.StatusDescription;
            }
            catch (Exception ex)
            {
                errMsg = ex.Message;
                return null;
            }

            return responseStr;
        }

        /// <summary>
        /// Fires when the browser navigates to a page, is used to capture the access code.
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void BrowserObject_Navigating(object sender, NavigatingCancelEventArgs e)
        {
            if (e.Uri.AbsoluteUri.Equals("https://vault.netvoyage.com/neWeb2/mobile/home.aspx"))
            {
                BrowserObject.Navigate("about:blank");
            }
            if (e.Uri.Query.Contains("code") && !e.Uri.Query.Contains("response_type"))
            {
                accessCode = HttpUtility.ParseQueryString(e.Uri.Query).Get("code");
                accessCodeTextBox.Text = accessCode;

                BrowserObject.Navigate("about:blank");
            }
        }

        /// <summary>
        /// Handle Access Code button click
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void accessCodeButton_Click(object sender, RoutedEventArgs e)
        {
            accessCode = "";
            accessCodeTextBox.Text = "";
            BrowserObject.Navigate(baseLoginUrl + "?client_id=" + clientID + "&scope=" + scope + "&response_type=" + responseType + "&redirect_uri=" + redirectURI);
        }

        /// <summary>
        /// Handle refresh token button click
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void refreshTokenButton_Click(object sender, RoutedEventArgs e)
        {
            string status = "";
            string errMsg = "";
            refreshToken = "";
            refreshTokenTextBox.Text = "";
            if (!String.IsNullOrEmpty(accessCode))
            {
                int retries = -1;
                while (String.IsNullOrEmpty(refreshToken) && retries < 10) // this loop is here to work around what appears to be a bug.  I am investigating the bug and will remove this from the sample when it is no longer needed.
                {
                    String refreshResponse = GetRefreshToken(ref status, ref errMsg);

                    statusMessage.AppendText(String.IsNullOrEmpty(status) ? "" : status + "\n");
                    errorTextBox.AppendText(String.IsNullOrEmpty(errMsg) ? "" : errMsg + "\n");

                    dynamic response = JsonConvert.DeserializeObject(refreshResponse);
                    accessToken = response.access_token;
                    refreshToken = response.refresh_token;
                    retries++;
                }
                status = "";
                errMsg = "";
                retryCount.Text = retries.ToString();
                refreshTokenTextBox.Text = refreshToken;
                accessTokenTextBox.Text = accessToken;

                statusMessage.AppendText(String.IsNullOrEmpty(status) ? "" : status + "\n");
                errorTextBox.AppendText(String.IsNullOrEmpty(errMsg) ? "" : errMsg + "\n");
            }
        }

        /// <summary>
        /// Handle Access Token button click
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void accessTokenButton_Click(object sender, RoutedEventArgs e)
        {
            string status = "";
            string errMsg = "";
            accessToken = "";
            accessTokenTextBox.Text = "";
            if (!String.IsNullOrEmpty(refreshToken))
            {
                dynamic response = JsonConvert.DeserializeObject(GetAccessToken(ref status, ref errMsg));
                accessToken = response.access_token;
                accessTokenTextBox.Text = accessToken;

                statusMessage.AppendText(String.IsNullOrEmpty(status) ? "" : status + "\n");
                errorTextBox.AppendText(String.IsNullOrEmpty(errMsg) ? "" : errMsg + "\n");
            }
        }

        /// <summary>
        /// Handle Rest Call button click
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void restCallButton_Click(object sender, RoutedEventArgs e)
        {
            string status = "";
            string errMsg = "";
            systemVersion.Text = "";
            if (!String.IsNullOrEmpty(accessToken))
            {
                systemVersion.Text = GetSystemStatus(ref status, ref errMsg);

                statusMessage.AppendText(String.IsNullOrEmpty(status) ? "" : status + "\n");
                errorTextBox.AppendText(String.IsNullOrEmpty(errMsg) ? "" : errMsg + "\n");
            }
        }

        /// <summary>
        /// Ensure that the text box stays scrolled to the end so you can always see the most recent messages.
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void errorTextBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            IInputElement oldFocusedElement = FocusManager.GetFocusedElement(this);
            errorTextBox.Focus();
            errorTextBox.CaretIndex = errorTextBox.Text.Length;
            errorTextBox.ScrollToEnd();
            FocusManager.SetFocusedElement(this, oldFocusedElement);
        }

        /// <summary>
        /// Ensure that the text box stays scrolled to the end so you can always see the most recent messages.
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void statusMessage_TextChanged(object sender, TextChangedEventArgs e)
        {
            IInputElement oldFocusedElement = FocusManager.GetFocusedElement(this);
            statusMessage.Focus();
            statusMessage.CaretIndex = statusMessage.Text.Length;
            statusMessage.ScrollToEnd();
            FocusManager.SetFocusedElement(this, oldFocusedElement);
        }

        private void LoginButton_Click(object sender, RoutedEventArgs e)
        {
            BrowserObject.Navigate("https://vault.netvoyage.com/neWeb2/mobile/login.aspx?ie7warn=N");
        }

        #region upload document

        private void LoadDataButton_Click(object sender, RoutedEventArgs e)
        {
            string status = "";
            string errMsg = "";

            //string cabList = GetCabinetList(ref status, ref errMsg);

            if (!String.IsNullOrEmpty(refreshToken))
            {
                dynamic response = JsonConvert.DeserializeObject<List<Cabinet>>(GetCabinetList(ref status, ref errMsg));
                cabinetList.Clear();
                foreach (Cabinet cabinet in response)
                {
                    cabinetList.Add(cabinet);
                }
                CabinetListComboBox.ItemsSource = cabinetList;
                CabinetListComboBox.IsEnabled = true;
                return;
            }
        }

        private string GetCabinetList(ref string status, ref string errMsg)
        {
            string responseStr = "";
            string url = "/v1/User/cabinets";

            Boolean useXml = false;

            RestRequest rr = FormRequest(Method.GET, url, useXml);
            IRestResponse response;

            try
            {
                response = executeRequest(rr);
                responseStr = response.Content;
                status = response.StatusDescription;
            }
            catch (Exception ex)
            {
                errMsg = ex.Message;
                return null;
            }

            return responseStr;
        }

        private string GetCustomAttributes(ref string status, ref string errMsg)
        {
            string responseStr = "";
            string url = "/v1/Cabinet/" + ((Cabinet)CabinetListComboBox.SelectedItem).ID + "/customAttributes";

            Boolean useXml = false;

            RestRequest rr = FormRequest(Method.GET, url, useXml);
            IRestResponse response;

            try 
            {
                response = executeRequest(rr);
                responseStr = response.Content;
                status = response.StatusDescription;
            }
            catch (Exception ex)
            {
                errMsg = ex.Message;
                return null;
            }

            return responseStr;
        }

        /*
        private string UploadDocument(ref string status, ref string errMsg)
        {
            string responseStr = "";
            string url = "/v1/Document";

            Boolean useXml = false;

            RestRequest rr = FormRequest(Method.POST, url, useXml);
            rr.AddHeader("Content-Type", "multipart/form-data");
            rr.AddParameter("action", "upload");
            rr.AddParameter("name", String.IsNullOrEmpty(DocNameTextBox.Text) ? "TestDocName" : DocNameTextBox.Text);
            rr.AddParameter("extension", String.IsNullOrEmpty(DocExtensionTextBox.Text) ? ".txt" : DocExtensionTextBox.Text);
            rr.AddParameter("cabinet", ((Cabinet)CabinetListComboBox.SelectedItem).ID);
            rr.AddParameter("return", "full");
            rr.AddParameter("failOnError", "true");
            
            IRestResponse response;

            try
            {
                response = executeRequest(rr);
                responseStr = response.Content;
                status = response.StatusDescription;
            }
            catch (Exception ex)
            {
                errMsg = ex.Message;
                return null;
            }

            return responseStr;
        }
        */
        public IRestResponse UploadDocument(ref string errMsg)
        {
            string data = String.Format("/v1/Document");
            string responseStr = "";

            RestRequest rr = FormRequest(Method.POST, data, false);
            IRestResponse response = new RestSharp.RestResponse();

            rr.AddParameter("action", "upload");
            rr.AddParameter("name", String.IsNullOrEmpty(DocNameTextBox.Text) ? "TestDocName" : DocNameTextBox.Text);
            rr.AddParameter("extension", String.IsNullOrEmpty(DocExtensionTextBox.Text) ? ".txt" : DocExtensionTextBox.Text);
            rr.AddParameter("cabinet", ((Cabinet)CabinetListComboBox.SelectedItem).ID);
            /* Add Profile data*/

            List<Profile> profileData = new List<Profile>();
            if (CustomAttribute1ComboBox.SelectedItem != null && !String.IsNullOrEmpty(CustomAttribute1TextBox.Text))
            {
                profileData.Add(new Profile(cabinetCustomAttributes[CustomAttribute1ComboBox.SelectedIndex].ID.ToString(), CustomAttribute1TextBox.Text));
            }
            if (CustomAttribute2ComboBox.SelectedItem != null && !String.IsNullOrEmpty(CustomAttribute2TextBox.Text))
            {
                profileData.Add(new Profile(cabinetCustomAttributes[CustomAttribute2ComboBox.SelectedIndex].ID.ToString(), CustomAttribute2TextBox.Text));
            }
            if (CustomAttribute3ComboBox.SelectedItem != null && !String.IsNullOrEmpty(CustomAttribute3TextBox.Text))
            {
                profileData.Add(new Profile(cabinetCustomAttributes[CustomAttribute3ComboBox.SelectedIndex].ID.ToString(), CustomAttribute3TextBox.Text));
            }

            String serializedProfileData = JsonConvert.SerializeObject(profileData);
            rr.AddParameter("profile", serializedProfileData);

            rr.AddParameter("return", "full");
            rr.AddParameter("failOnError", "true");


            rr.Timeout = 1000 * 60 * 10;
            try
            {
                rr.AddFile(String.IsNullOrEmpty(DocNameTextBox.Text) ? "TestDocName" : DocNameTextBox.Text, open.FileName);
            }
            catch (Exception ex)
            {
                errMsg = ex.Message;
                ResponseTextBox.Text = "Exception details: " + ex.Message;
            }

            try
            {
                response = executeRequest(rr);
                responseStr = response.Content;
                ResponseTextBox.Text = response.Content;

                if (response.StatusCode == HttpStatusCode.OK)
                {
                    //newFileInfo.returnData = response.Content;
                }
                else
                {
                    if (String.IsNullOrEmpty(response.ErrorMessage) && response.StatusCode == HttpStatusCode.Unauthorized)
                        errMsg = "Unauthorized";
                    else
                        errMsg = response.ErrorMessage;

                    //newFileInfo.returnData = response.Content;
                    //newFileInfo.returnStatus = response.StatusDescription;

                    if (String.IsNullOrEmpty(errMsg))
                        errMsg = response.StatusDescription;

                    errMsg = "Creating Doc ... " + errMsg + " " + response.Content;
                    //AddToError(ref newFileInfo.theErrors, Processor.IEType.DocFail);
                    return response;
                }
            }
            catch (Exception ex)
            {
                errMsg = ex.Message;
                ResponseTextBox.Text = "Exception details: " + ex.Message;
                //return response;
            }

            return response;
        }


        #endregion

        private void UploadDocButton_Click(object sender, RoutedEventArgs e)
        {
            string errMsg = "";

            if (!String.IsNullOrEmpty(refreshToken))
            {
                dynamic response = JsonConvert.DeserializeObject(UploadDocument(ref errMsg).Content);
                
                return;
            }

        }

        private void FileSelectButton_Click(object sender, RoutedEventArgs e)
        {
            open = new OpenFileDialog();
            open.ShowDialog();
        }

        private void CabinetListComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            string status = "";
            string errMsg = "";

            
            if (!String.IsNullOrEmpty(refreshToken))
            {
                cabinetCustomAttributes = JsonConvert.DeserializeObject<List<CustomAttribute>>(GetCustomAttributes(ref status, ref errMsg));

                CustomAttributeListBox.ItemsSource = cabinetCustomAttributes;
                CustomAttributeListBox.IsEnabled = true;

                CustomAttribute1ComboBox.ItemsSource = cabinetCustomAttributes;
                CustomAttribute1ComboBox.IsEnabled = true;

                CustomAttribute2ComboBox.ItemsSource = cabinetCustomAttributes;
                CustomAttribute2ComboBox.IsEnabled = true;

                CustomAttribute3ComboBox.ItemsSource = cabinetCustomAttributes;
                CustomAttribute3ComboBox.IsEnabled = true;

                return;
            }
        }
    }
}
