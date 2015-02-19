
-- ======================================================================================
-- Procedure : NBF Document Add 
-- Purpose: This procedure will insert a record into the NBFDocuments Table
-- ======================================================================================
CREATE PROCEDURE [dbo].[NBFDOcument_Insert]
	@NetDocumentsNumber			[varchar](50)	= '/',
	@NetDocumentsURL			[varchar](2500) = '/',
	@NetDocumentsDescription	[varchar](8000) = NULL,
	@WorlDoxNumbers				[varchar](256)	= NULL,
	@DocTypeName				[varchar](50)	= 'OTHER',
	@NBF_Key					[int]			= NULL

AS
BEGIN 
	-- VARIABLES 
	DECLARE @DocTypeId		INT	= 0
	DECLARE @Result			VARCHAR(25) = 'ok'
	DECLARE @ExistsCount	INT = 0

	-- CHECKS 
	IF (@NBF_Key IS NULL) 
	BEGIN 
		SET @Result = 'missing:nbf_key'
		SELECT @Result AS [Result]
		RETURN;
	END

	-- GET DOC TYPE ID 
	SELECT TOP 1
		@DocTypeId = [DocTypeId]
	FROM [dbo].[NBFEngagementDocType]
	WHERE 
		[DocType] = @DocTypeName
	
	-- CHECK DOC TYPE 
	IF(@DocTypeId IS NULL)
	BEGIN 
		SET @Result = 'invalid:doc_type'
		SELECT @Result AS [Result]
		RETURN;
	END


	-- DUPLICATE CHECK 
	SELECT 
		@ExistsCount = COUNT(*)
	FROM [dbo].[NBFDocuments] 
	WHERE  
		([NetDocumentsURL] = @NetDocumentsURL)
	 AND 
		([NBF_Key] = @NBF_Key)

	-- PERFORM INSERT
	IF(@ExistsCount = 0)
		BEGIN 
			INSERT INTO [dbo].[NBFDocuments]
				(
					[NetDocumentsNumber],
					[NetDocumentsURL],
					[NetDocumentsDescription],
					[DocTypeId],
					[NBF_Key]
				 )
			 VALUES
				 (
					@NetDocumentsNumber,
					@NetDocumentsURL,
					@NetDocumentsDescription,
					@DocTypeId,
					@NBF_Key
				 )
		END 
	ELSE 
		BEGIN 
			SET @Result = 'duplicate'
			SELECT @Result AS [Result]
			RETURN;
		END 

	-- Return Successful results
	SELECT @Result AS [Result]
	RETURN;
END