
Design and Requirements 
=======================================



Server and Environment 
=======================
1)	 Yes, it is running IIS.
2)	The server is a Windows 2008 R2 instance running IIS 6.1   


# Netdocuments Cabinet Information
That is to get the directory listing from the MATTERMAN.ENGAGE cabinet.   
The results will be presented to the user so they can select the documents they want to associate (in our NBF system) with a NBF row.

# Described User Flow
A JK User opens a new business matter in our existing New Business Form system (NBF).   

They enter required data and process the new business for approval.   

Once this approval is made, our finance department notifies the originator that the matter has been approved.  

Engagement Letters and other supporting Engagement Documents are scanned into the MATTERMAN.ENGAGE cabinet.   

This cabinet is a special cabinet created for us to hold all engagement documents for every client and matter.   

Other documents go to individual client and matter cabinets, but Engagement Documents are always put in this one cabinet.     

The saved search would be used in this one api call.  
(**Change** We will get the contents of a cabinet with a simple filter)

The selected documents details will be saved in the NBFDocuments table.   
The static url is:  
https://vault.netvoyage.com/neWeb2/goId.aspx?id=4814-0621-9041&open=Y
where 4814-0621-9041

and here is the static url to the Engagement workspace:

https://vault.netvoyage.com/neWeb2/goID.aspx?id=4822-4651-5233

Then selected document numbers, the url, the nbf_key that is passed when your page is called are saved to the table along with the doc. type as described above.  

The user will close your page and no other action is required from your app.   

NOTE:  This is one of the options that Skip described.   Skip says the document must be a PDF if the type is Engagement Letter.

