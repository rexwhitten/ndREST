using System;
using Newtonsoft.Json;

namespace OAuthSample
{
    class Profile
    {
        public Profile(string id, string value)
        {
            this.id = id;
            this.value = value;
        }
        /// <summary>
        /// ID of attribute
        /// </summary>
        [JsonProperty("id")]
        public string id { get; set; }

        /// <summary>
        /// Value of attribute
        /// </summary>
        [JsonProperty("value")]
        public string value { get; set; }
    }
}