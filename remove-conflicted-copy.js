var fs = require( "fs" );
var path = require( "path" );

/*
	Checks if this contains a string "conflicted copy" generated by dropbox.
*/
var conflictedCopyPattern = /([^]+?)\s*\([^]+?conflicted copy[^]+?(\d{4}-\d{2}-\d{2})\)([^]+)?$/g;
var checkIfConflictedCopy = function checkIfConflictedCopy( path ){
	console.log( "Checking path: " + path + " if conflicted copy." );
	var state = conflictedCopyPattern.test( path );
	if( state ){
		console.log( "Path: " + path + " is a conflicted copy." );
		var dissectedFilePathData = dissectFilePath( path );
		var originalFilePath = dissectedFilePathData.originalFilePath;
		/*
			We can only determine if this is a conflict if
				the original file path is still existing.
		*/
		state = fs.existsSync( originalFilePath );
		if( state ){
			console.log( "File: " + path + " is a conflicted copy of file: " + originalFilePath );
		}
		/*
			If the conflicting copy is not existing should we still
				delete it?
			Though this is rare and somewhat impossible to happen.
		*/
		return state;
	}
};

/*
	Tries to dissect the file path if conflicted to get the original path
		and the date of conflict.
*/
var dissectFilePath = function dissectFilePath( path ){
	var matches = path.match( conflictedCopyPattern );
	return {
		"originalFilePath": matches[ 0 ] + ( matches[ 2 ] || "" ),
		"conflictDate": matches[ 1 ]
	};
};

/*
	List all contents and check if this is a directory or a file.
*/
var traverseDirectory = function traverseDirectory( directory ){
	directory = path.normalize( directory );
	console.log( "\n\nTraversing directory: " + directory );
	fs.readdir( directory,
		function onDirectoryList( error, fileList ){
			if( error ){
				console.error( error );
				throw error;
			}else{
				var fileListLength = fileList.length;
				for( var index = 0; index < fileListLength; index++ ){
					var currentFile = fileList[ index ];
					var currentPath = path.normalize( directory + "/" + currentFile );
					if( fs.statSync( currentPath ).isDirectory( ) ){
						queueDirectory( currentPath );
					}else if( fs.statSync( currentPath ).isFile( ) ){
						if( checkIfConflictedCopy( currentPath ) ){
							console.log( "Removing file: " + currentPath );
							do{
								fs.unlinkSync( currentPath );
							}while( fs.existsSync( currentPath ) );
							console.log( "File: " + currentPath + " removed!" );
						}
					}
				}
				console.log( "Directory: " + directory + " traversed!" );
				if( directoryQueue.length > 0 ){
					traverseDirectory( directoryQueue.pop( ) );
				}
			}
		} );
};

var directoryQueue = [ ];
var queueDirectory = function queueDirectory( path ){
	console.log( "Queuing directory: " + path );
	directoryQueue.push( path );
};

/*
	Returns the directory you want to scan for conflicted copies.
*/
var getInputDirectory = function getInputDirectory( ){
	return process.argv[ 2 ];
};

var checkInputDirectory = function checkInputDirectory( ){
	if( !fs.existsSync( inputDirectory ) ){
		var error = new Error( "input directory does not exists" );
		console.error( error );
		throw error;
	}
};

var inputDirectory = getInputDirectory( );
checkInputDirectory( );
traverseDirectory( inputDirectory );

