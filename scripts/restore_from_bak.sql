-- Uso con sqlcmd:
-- sqlcmd -S . -E -v BAKPATH="C:\\prueba\\SOConteo.bak" DBNAME="SOConteo" -i scripts\restore_from_bak.sql

:setvar BAKPATH "C:\\prueba\\SOConteo.bak"
:setvar DBNAME "SOConteo"

DECLARE @bak nvarchar(4000) = N'$(BAKPATH)';
DECLARE @dbname sysname = N'$(DBNAME)';

-- Obtener rutas por defecto
DECLARE @data nvarchar(4000) = CONVERT(nvarchar(4000), SERVERPROPERTY('InstanceDefaultDataPath'));
DECLARE @log nvarchar(4000) = CONVERT(nvarchar(4000), SERVERPROPERTY('InstanceDefaultLogPath'));
IF @data IS NULL SET @data = (SELECT SUBSTRING(physical_name,1,LEN(physical_name)-CHARINDEX('\\',REVERSE(physical_name))+1) FROM master.sys.database_files WHERE file_id=1);
IF @log IS NULL SET @log = @data;

-- Lista de archivos lógicos del backup
DECLARE @files TABLE (LogicalName nvarchar(128), PhysicalName nvarchar(260), Type char(1));
INSERT INTO @files (LogicalName, PhysicalName, Type)
EXEC('RESTORE FILELISTONLY FROM DISK = ''' + REPLACE(@bak,'\','\\') + '''');

DECLARE @dataLogical nvarchar(128) = (SELECT TOP 1 LogicalName FROM @files WHERE Type='D');
DECLARE @logLogical nvarchar(128)  = (SELECT TOP 1 LogicalName FROM @files WHERE Type='L');

DECLARE @dataTarget nvarchar(4000) = @data + @dbname + N'.mdf';
DECLARE @logTarget  nvarchar(4000) = @log  + @dbname + N'_log.ldf';

DECLARE @sql nvarchar(max) = N'
RESTORE DATABASE [' + @dbname + N'] FROM DISK = ''' + REPLACE(@bak,'\','\\') + N'''
WITH MOVE ''' + @dataLogical + N''' TO ''' + @dataTarget + N''',
     MOVE ''' + @logLogical  + N''' TO ''' + @logTarget  + N''',
     REPLACE, RECOVERY;';

PRINT @sql;
EXEC sp_executesql @sql;

PRINT 'Restauración finalizada.';

