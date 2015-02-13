using System;
using Newtonsoft.Json;

namespace OAuthSample
{
    public class Cabinet
    {
        /// <summary>
        /// Cabinet ID
        /// </summary>
        [JsonProperty("id")]
        public string ID { get; set; }

        /// <summary>
        /// Name of cabinet
        /// </summary>
        [JsonProperty("name")]
        public string Name { get; set; }

        /// <summary>
        /// ID of repository containing this cabinet
        /// </summary>
        [JsonProperty("repositoryId")]
        public string RepositoryID { get; set; }

        /// <summary>
        /// Name of repository containing this cabinet
        /// </summary>
        [JsonProperty("repositoryName")]
        public string RepositoryName { get; set; }

        /// <summary>
        /// Index of workspace attribute
        /// </summary>
        [JsonProperty("wsAttrNum")]
        public string WSAttributeNum { get; set; }

        /// <summary>
        /// Plural name of workspace attribute
        /// </summary>
        [JsonProperty("wsAttrPluralName")]
        public string WSAttributePlName { get; set; }

        public override string ToString()
        {
            return (ID + ": " + Name);
        }
    }
}