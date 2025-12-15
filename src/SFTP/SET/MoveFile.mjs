/**
 * Move or rename a file on the SFTP server
 * 
 * @param {Object} sftpClient - SFTP Client object from GetSFTPClient (required)
 * @param {string} oldPath - Current remote file path (required)
 * @param {string} newPath - New remote file path (required)
 * @returns {Promise<Object>} Response object with move result
 * 
 * @example
 * const result = await SetMoveFile(sftpClient, '/uploads/temp.csv', '/processed/data.csv');
 * if (result.statusCode === 200) {
 *   console.log('File moved successfully');
 * }
 * 
 * @example
 * const result = await SetMoveFile(sftpClient, '/uploads/report.pdf', '/archive/report.pdf');
 */
export async function SetMoveFile(sftpClient, oldPath, newPath) {
    try {
        const Verifications = Verification(sftpClient, oldPath, newPath)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_MoveFile(sftpClient, oldPath, newPath)

        return {
            statusCode: result.httpStatusCode,
            headers: defaultHeaders(),
            body: result.body,
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers: defaultHeaders(),
            body: {
                Code: "InternalError",
                Message: "An error occurred while processing the request.",
            },
        }
    }
}

//----------------------------------------------
//  FUNCTION: Move File
//----------------------------------------------
/**
 * Moves or renames file on SFTP server
 * 
 * @param {Object} sftpClient - SFTP Client object
 * @param {string} oldPath - Current remote file path
 * @param {string} newPath - New remote file path
 * @returns {Object} Response object with move result
 */
async function Call_MoveFile(sftpClient, oldPath, newPath) {
    let httpStatusCode
    let body

    try {
        await sftpClient.rename(oldPath, newPath);

        httpStatusCode = 200
        body = {
            Data: true,
            Message: "File moved successfully",
        }
    } catch (e) {
        console.error("Error moving file:", e)
        httpStatusCode = 500

        if (e.code === 'ECONNREFUSED') {
            httpStatusCode = 503
            body = {
                Code: e.code,
                Message: "Cannot connect to SFTP server",
            }
        } else if (e.code === 'ETIMEDOUT') {
            httpStatusCode = 504
            body = {
                Code: e.code,
                Message: "SFTP request timed out",
            }
        } else if (e.code === 2 || (e.message && e.message.includes('No such file'))) {
            httpStatusCode = 404
            body = {
                Code: "FileNotFound",
                Message: `Source file not found: ${oldPath}`,
            }
        } else if (e.code === 3 || (e.message && e.message.includes('Permission denied'))) {
            httpStatusCode = 403
            body = {
                Code: "PermissionDenied",
                Message: `Permission denied moving file from ${oldPath} to ${newPath}`,
            }
        } else {
            body = {
                Code: e.code || 'Error',
                Message: e.message || "Failed to move file",
            }
        }
    }

    return {
        httpStatusCode,
        body,
    }
}

//----------------------------------------------
//  VERIFICATIONS
//----------------------------------------------

/**
 * Validates all required parameters
 * 
 * @param {Object} sftpClient - SFTP client to validate
 * @param {string} oldPath - Old path to validate
 * @param {string} newPath - New path to validate
 * @returns {Object} Validation result with statusCode and body
 */
function Verification(sftpClient, oldPath, newPath) {
    const Verification_sftpClient = Verifications_sftpClient(sftpClient)
    const Verification_oldPath = Verifications_oldPath(oldPath)
    const Verification_newPath = Verifications_newPath(newPath)

    const errors = []

    if (Verification_sftpClient.statusCode !== 200) {
        errors.push(Verification_sftpClient.body.Message)
    }
    if (Verification_oldPath.statusCode !== 200) {
        errors.push(Verification_oldPath.body.Message)
    }
    if (Verification_newPath.statusCode !== 200) {
        errors.push(Verification_newPath.body.Message)
    }

    if (errors.length > 0) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: errors,
            },
        }
    }

    return {
        statusCode: 200,
        headers: defaultHeaders(),
        body: {},
    }
}

/**
 * Validates the sftpClient parameter
 * 
 * @param {Object} sftpClient - SFTP client object to validate
 * @returns {Object} Validation result
 */
function Verifications_sftpClient(sftpClient) {
    if (!sftpClient || typeof sftpClient !== 'object') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'sftpClient' parameter is required and must be an SFTP Client object.",
            },
        }
    }

    return {
        statusCode: 200,
        headers: defaultHeaders(),
        body: {},
    }
}

/**
 * Validates the oldPath parameter
 * 
 * @param {string} oldPath - Old file path to validate
 * @returns {Object} Validation result
 */
function Verifications_oldPath(oldPath) {
    if (!oldPath || typeof oldPath !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'oldPath' parameter is required.",
            },
        }
    }

    return {
        statusCode: 200,
        headers: defaultHeaders(),
        body: {},
    }
}

/**
 * Validates the newPath parameter
 * 
 * @param {string} newPath - New file path to validate
 * @returns {Object} Validation result
 */
function Verifications_newPath(newPath) {
    if (!newPath || typeof newPath !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'newPath' parameter is required.",
            },
        }
    }

    return {
        statusCode: 200,
        headers: defaultHeaders(),
        body: {},
    }
}

//----------------------------------------------
//  DEFAULT RESPONSE HEADERS
//----------------------------------------------

/**
 * Returns default HTTP headers for API responses
 * 
 * @returns {Object} Headers object
 */
function defaultHeaders() {
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "PUT,OPTIONS",
    }
}

/*
=======================================================================
                             REFERENCE
=======================================================================

* Purpose:
  Moves or renames a file on an SFTP server using the rename operation.

* Use Cases:
  - Rename files on the server
  - Move files between directories
  - Organize files into processed/archived folders
  - Implement file workflow stages
  - Archive completed files

* Function:
  MoveFile(sftpClient, oldPath, newPath)
  - sftpClient: SFTP Client object from GetSFTPClient
  - oldPath: Current remote file path (e.g., '/uploads/temp.csv')
  - newPath: New remote file path (e.g., '/processed/data.csv')

* Response Structure:
  {
    "Data": true,
    "Message": "File moved successfully"
  }

* Error Handling:
  - 400: Invalid parameters (missing sftpClient, oldPath, or newPath)
  - 403: Permission denied (SFTP code 3)
  - 404: Source file not found (SFTP code 2)
  - 500: General SFTP error
  - 503: Cannot connect to SFTP server
  - 504: Request timeout

* Example Usage:
  
  1. Rename a file:
  ```javascript
  import { GetSFTPClient } from '../common/SFTPClient.mjs';
  import { MoveFile } from './MoveFile.mjs';
  
  const connResult = await GetSFTPClient(host, username, password, 22);
  const sftpClient = connResult.body.Data;
  
  const result = await MoveFile(
    sftpClient,
    '/uploads/temp.csv',
    '/uploads/final.csv'
  );
  
  if (result.statusCode === 200) {
    console.log('File renamed successfully');
  } else {
    console.error(result.body.Message);
  }
  
  await sftpClient.end();
  ```
  
  2. Move file to different directory:
  ```javascript
  const result = await MoveFile(
    sftpClient,
    '/uploads/data.csv',
    '/processed/data.csv'
  );
  
  switch (result.statusCode) {
    case 200:
      console.log('File moved to processed folder');
      break;
    case 404:
      console.error('Source file not found');
      break;
    case 403:
      console.error('Permission denied');
      break;
    default:
      console.error('Move failed:', result.body.Message);
  }
  ```
  
  3. Archive processed files:
  ```javascript
  import { GetFileNamesFromPath } from '../GET/FileNamesFromPath.mjs';
  
  const connResult = await GetSFTPClient(host, username, password, 22);
  const sftpClient = connResult.body.Data;
  
  // List files in uploads directory
  const listResult = await GetFileNamesFromPath(sftpClient, '/uploads');
  
  if (listResult.statusCode === 200) {
    const files = listResult.body.Data;
    
    for (const file of files) {
      if (file.type === '-') {
        const oldPath = `/uploads/${file.name}`;
        const newPath = `/archive/${file.name}`;
        
        const result = await MoveFile(sftpClient, oldPath, newPath);
        
        if (result.statusCode === 200) {
          console.log(`Archived: ${file.name}`);
        } else {
          console.error(`Failed to archive ${file.name}:`, result.body.Message);
        }
      }
    }
  }
  
  await sftpClient.end();
  ```
  
  4. Add timestamp to filename:
  ```javascript
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const oldPath = '/uploads/report.pdf';
  const newPath = `/uploads/report-${timestamp}.pdf`;
  
  const result = await MoveFile(sftpClient, oldPath, newPath);
  
  if (result.statusCode === 200) {
    console.log(`File renamed with timestamp: ${newPath}`);
  }
  ```
  
  5. Move with workflow stages:
  ```javascript
  const stages = ['uploaded', 'processing', 'processed', 'archived'];
  const filename = 'data.csv';
  
  // Move through workflow stages
  for (let i = 0; i < stages.length - 1; i++) {
    const oldPath = `/${stages[i]}/${filename}`;
    const newPath = `/${stages[i + 1]}/${filename}`;
    
    console.log(`Moving from ${stages[i]} to ${stages[i + 1]}...`);
    
    const result = await MoveFile(sftpClient, oldPath, newPath);
    
    if (result.statusCode === 200) {
      console.log(`File now in ${stages[i + 1]}`);
    } else {
      console.error('Move failed:', result.body.Message);
      break;
    }
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  ```

* Important Notes:
  - Operation is atomic (rename/move happens instantly)
  - Source file must exist
  - Destination directory must exist
  - If destination file exists, it may be overwritten (server-dependent)
  - Cannot move across different file systems (server-dependent)
  - Works for renaming in same directory or moving between directories
  - SFTP error code 2 = No such file, 3 = Permission denied

* Best Practices:
  - Verify source file exists before moving
  - Ensure destination directory exists
  - Check if destination file already exists if overwrite is not desired
  - Implement error handling for partial moves
  - Log all move operations for audit trails
  - Use atomic operations to avoid file corruption

* Workflow Patterns:
  - Upload to temp folder, validate, then move to final location
  - Process files and move to archive folder when done
  - Organize files by date: move to dated subdirectories
  - Rename with status prefixes (pending_, done_, error_)

=======================================================================
*/
