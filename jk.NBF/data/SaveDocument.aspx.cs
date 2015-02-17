using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Newtonsoft.Json;
using System.Data;


namespace jk.NBF.data
{
    public class NBFDocument
    {
        public Int32 DocumentId { get; set; }

        public String NetDocumentsNumber  { get; set; }

        public String NetDocumentsUrl  { get; set; }

        public String NetDocumentsDescription  { get; set; }

        public String WorlDoxNumbers  { get; set; }

        public String DocTypeName  { get; set; }

        public Int32 NBF_Key  { get; set; }

        public NBFDocument()
        {

        }
    }

    public partial class SaveDocument : System.Web.UI.Page
    {
        private String Error  { get; set; }

        protected void Page_Load(object sender, EventArgs e)
        {
            if (Request.Headers.AllKeys.Contains("nbf_doc") == false)
            {
                Response.End();
            }


           NBFDocument model = JsonConvert.DeserializeObject<NBFDocument>(Request.Headers["nbf_doc"]);

            bool result = this.Save(model);
            
            // Finally
            if(result == true)
            {
                Response.StatusCode = 200; 
            }
            else
            {
                Response.StatusCode = 500;
                Response.Write(this.Error);
            }

            Response.End();
        }

        #region [ Sql Methods ] 
        private bool Save(NBFDocument model)
        {
            bool result = false;
            string db_result = "";

            try
            {
                var access = DataAccess.Create("default");

                access.CreateProcedureCommand("[dbo].[NBFDocument_Insert]");
                access.AddParameter("@NetDocumentsNumber", model.NetDocumentsNumber, ParameterDirection.Input);
                access.AddParameter("@NetDocumentsURL", model.NetDocumentsUrl, ParameterDirection.Input);
                access.AddParameter("@NetDocumentsDescription", model.NetDocumentsDescription, ParameterDirection.Input);
                access.AddParameter("@WorlDoxNumbers", model.WorlDoxNumbers, ParameterDirection.Input);
                access.AddParameter("@DocTypeName", model.DocTypeName, ParameterDirection.Input);
                access.AddParameter("NBF_Key", model.NBF_Key, ParameterDirection.Input);

                var _tempResults = access.ExecuteDataSet();

                if (_tempResults != null)
                {
                    db_result = _tempResults.Tables[0].Rows[0][0].ToString();
                }

                // Check the results from the Database 
                if (db_result.ToLower() != "ok")
                {
                    result = false;
                }

                result = true;
            }
            catch(Exception x)
            {
               this.Error = x.Message;
            }

            return result;
        }
        #endregion
    }
}