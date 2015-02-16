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

        public Int32 DocTypeId  { get; set; }

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

            try
            {

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