## Monday, February 16, 2015

<div class='section'>10:06 AM<div></div><div class='summary'></div></div>
#### jk.NBF/Content/js/app.js

                 })
             } else {
                 /**
    -             * debug isn ot enabledm so we need ot redirect the user
    +             * debug is not enabled so we need ot redirect the user
                  */
                 self.on_un_authenticated();
#### jk.NBF/Content/js/app.js

                     },
                     error: function (e) {
                         console.log("error authenticating");
    -                    self.on_un_authenticated();
    +                    self.on_un_authenticated(error);
                     }
                 })
#### jk.NBF/Content/js/app.js

                 /**
                  * debug isn ot enabledm so we need ot redirect the user
                  */
    +            self.on_un_authenticated();
             }
         }
    
#### jk.NBF/Content/js/app.js

                 })
             } else {
                 /**
    -             * @description
    +             * debug isn ot enabledm so we need ot redirect the user
                  */
             }
#### jk.NBF/Content/js/app.js

         if (self.nd.code == null || self.nd.token == null) {
             console.log("netdocs not authenticated");
             /**
    -         * debug mode is enabled so we can use hard coded tokes
    +         * debug mode is enabled so we can use hard coded access
              */
             if (self.options.debug) {
#### jk.NBF/Content/js/app.js

    
         if (self.nd.code == null || self.nd.token == null) {
             console.log("netdocs not authenticated");
    +        /**
    +         * debug mode is enabled so we can use hard coded tokes
    +         */
             if (self.options.debug) {
                 console.log("using hardcoded netdocs access");
                 // Access Code
                         self.on_un_authenticated();
                     }
                 })
    +        } else {
    +            /**
    +             * @description
    +             */
             }
         }
    

