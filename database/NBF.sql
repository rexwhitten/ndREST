USE [Forms]
GO

/****** Object:  Table [dbo].[NBFEngagementDocType]    Script Date: 02/16/2015 13:51:03 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[NBFEngagementDocType](
    [DocTypeId] [int] NOT NULL,
    [DocType] [varchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
    [DocTypeId] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO


USE [Forms]
GO

/****** Object:  Table [dbo].[NBFDocuments]    Script Date: 02/16/2015 13:51:20 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[NBFDocuments](
    [DocumentId] [int] IDENTITY(1,1) NOT NULL,
    [NetDocumentsNumber] [varchar](50) NULL,
    [NetDocumentsURL] [varchar](2500) NULL,
    [NetDocumentsDescription] [varchar](8000) NULL,
    [WorlDoxNumbers] [varchar](256) NULL,
    [DocTypeId] [int] NULL,
    [NBF_Key] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
    [DocumentId] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO

ALTER TABLE [dbo].[NBFDocuments]  WITH CHECK ADD FOREIGN KEY([DocTypeId])
REFERENCES [dbo].[NBFEngagementDocType] ([DocTypeId])
GO

ALTER TABLE [dbo].[NBFDocuments]  WITH CHECK ADD FOREIGN KEY([NBF_Key])
REFERENCES [dbo].[NBF] ([NBF_key])
GO

INSERT INTO [NBFEngagementDocType](DocTypeId,DocType) VALUES(1,'Engagement')
INSERT INTO [NBFEngagementDocType](DocTypeId,DocType) VALUES(2,'Other')
