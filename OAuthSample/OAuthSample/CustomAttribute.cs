using System;
using Newtonsoft.Json;

namespace OAuthSample
{
    class CustomAttribute
    {
        /// <summary>
        /// 
        /// </summary>
        [JsonProperty("allowPunc")]
        public bool AllowPunc { get; set; }

        /// <summary>
        /// baseSecurity
        /// </summary>
        [JsonProperty("baseSecurity")]
        public bool BaseSecurity { get; set; }

        /// <summary>
        /// Force Uppercase
        /// </summary>
        [JsonProperty("forceUppercase")]
        public bool ForceUppercase { get; set; }

        /// <summary>
        /// hideLookup
        /// </summary>
        [JsonProperty("hideLookup")]
        public bool HideLookup { get; set; }

        /// <summary>
        /// ID
        /// </summary>
        [JsonProperty("id")]
        public int ID { get; set; }

        /// <summary>
        /// Max Length
        /// </summary>
        [JsonProperty("maxLen")]
        public int MaxLength { get; set; }

        /// <summary>
        /// Name
        /// </summary>
        [JsonProperty("name")]
        public string Name { get; set; }

        /// <summary>
        /// promptIfEmpty
        /// </summary>
        [JsonProperty("promptIfEmpty")]
        public bool PromptIfEmpty { get; set; }

        /// <summary>
        /// Type
        /// </summary>
        [JsonProperty("type")]
        public string Type { get; set; }

        /// <summary>
        /// Use Lookup
        /// </summary>
        [JsonProperty("useLookup")]
        public bool UseLookup { get; set; }

        public override string ToString()
        {
            return (ID + ": " + Name);
        }
    }
}
