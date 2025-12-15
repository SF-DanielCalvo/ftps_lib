/**
 * Delete a file on the SFTP server
 * 
 * @param {Object} sftpClient - SFTP Client object from GetSFTPClient (required)
 * @param {string} remotePath - Remote file path to delete (required)
 * @returns {Promise<Object>} Response object with deletion result
 * 
 * @example
 * const result = await SetDeleteFile(sftpClient, '/uploads/old-data.csv');
 * if (result.statusCode === 200) {
 *   console.log('File deleted successfully');
 * }
 * 
 * @example
 * const result = await SetDeleteFile(sftpClient, '/temp/file.txt');
 */
export async function SetDeleteFile(sftpClient, remotePath) {
    try {
        const Verifications = Verification(sftpClient, remotePath)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_DeleteFile(sftpClient, remotePath)

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
//  FUNCTION: Delete File
//----------------------------------------------
/**
 * Deletes file from SFTP server
 * 
 * @param {Object} sftpClient - SFTP Client object
 * @param {string} remotePath - Remote file path
 * @returns {Object} Response object with deletion result
 */
async function Call_DeleteFile(sftpClient, remotePath) {
    let httpStatusCode
    let body

    try {
        await sftpClient.delete(remotePath);

        httpStatusCode = 200
        body = {
            Data: true,
            Message: "File deleted successfully",
        }
    } catch (e) {
        console.error("Error deleting file:", e)
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
                Message: `File not found: ${remotePath}`,
            }
        } else if (e.code === 3 || (e.message && e.message.includes('Permission denied'))) {
            httpStatusCode = 403
            body = {
                Code: "PermissionDenied",
                Message: `Permission denied deleting: ${remotePath}`,
            }
        } else {
            body = {
                Code: e.code || 'Error',
                Message: e.message || "Failed to delete file",
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
 * @param {string} remotePath - Remote path to validate
 * @returns {Object} Validation result with statusCode and body
 */
function Verification(sftpClient, remotePath) {
    const Verification_sftpClient = Verifications_sftpClient(sftpClient)
    const Verification_remotePath = Verifications_remotePath(remotePath)

    const errors = []

    if (Verification_sftpClient.statusCode !== 200) {
        errors.push(Verification_sftpClient.body.Message)
    }
    if (Verification_remotePath.statusCode !== 200) {
        errors.push(Verification_remotePath.body.Message)
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
 * Validates the remotePath parameter
 * 
 * @param {string} remotePath - Remote file path to validate
 * @returns {Object} Validation result
 */
function Verifications_remotePath(remotePath) {
    if (!remotePath || typeof remotePath !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'remotePath' parameter is required.",
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
        "Access-Control-Allow-Methods": "DELETE,OPTIONS",
    }
}

/*
=======================================================================
                             REFERENCE
=======================================================================

* Purpose:
  Deletes a file from an SFTP server.

* Use Cases:
  - Clean up old or temporary files
  - Remove processed data files
  - Implement file retention policies
  - Delete failed uploads
  - Maintain disk space on remote server

* Function:
  DeleteFile(sftpClient, remotePath)
  - sftpClient: SFTP Client object from GetSFTPClient
  - remotePath: Remote file path (e.g., '/uploads/old-data.csv')

* Response Structure:
  {
    "Data": true,
    "Message": "File deleted successfully"
  }

* Error Handling:
  - 400: Invalid parameters (missing sftpClient or remotePath)
  - 403: Permission denied (SFTP code 3)
  - 404: File not found (SFTP code 2)
  - 500: General SFTP error
  - 503: Cannot connect to SFTP server
  - 504: Request timeout

* Example Usage:
  
  1. Basic file deletion:
  ```javascript
  import { GetSFTPClient } from '../common/SFTPClient.mjs';
  import { DeleteFile } from './DeleteFile.mjs';
  
  const connResult = await GetSFTPClient(host, username, password, 22);
  const sftpClient = connResult.body.Data;
  
  const result = await DeleteFile(sftpClient, '/uploads/old-data.csv');
  
  if (result.statusCode === 200) {
    console.log('File deleted successfully');
  } else {
    console.error(result.body.Message);
  }
  
  await sftpClient.end();
  ```
  
  2. Delete with error handling:
  ```javascript
  const result = await DeleteFile(sftpClient, '/temp/file.txt');
  
  switch (result.statusCode) {
    case 200:
      console.log('File deleted');
      break;
    case 404:
      console.log('File does not exist (already deleted?)');
      break;
    case 403:
      console.error('Permission denied');
      break;
    default:
      console.error('Deletion failed:', result.body.Message);
  }
  ```
  
  3. Delete multiple files:
  ```javascript
  import { GetFileNamesFromPath } from '../GET/FileNamesFromPath.mjs';
  
  const connResult = await GetSFTPClient(host, username, password, 22);
  const sftpClient = connResult.body.Data;
  
  // List files
  const listResult = await GetFileNamesFromPath(sftpClient, '/temp');
  
  if (listResult.statusCode === 200) {
    const files = listResult.body.Data;
    
    // Delete old files (older than 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const file of files) {
      if (file.type === '-' && file.modifyTime < sevenDaysAgo) {
        const result = await DeleteFile(sftpClient, `/temp/${file.name}`);
        
        if (result.statusCode === 200) {
          console.log(`Deleted: ${file.name}`);
        } else {
          console.error(`Failed to delete ${file.name}:`, result.body.Message);
        }
      }
    }
  }
  
  await sftpClient.end();
  ```
  
  4. Delete with backup first:
  ```javascript
  import { GetFile } from '../GET/File.mjs';
  
  const remotePath = '/uploads/data.csv';
  const backupPath = './backup-data.csv';
  
  // Backup before deletion
  const backupResult = await GetFile(sftpClient, remotePath, backupPath);
  
  if (backupResult.statusCode === 200) {
    console.log('Backup created');
    
    // Now delete remote file
    const deleteResult = await DeleteFile(sftpClient, remotePath);
    
    if (deleteResult.statusCode === 200) {
      console.log('Remote file deleted');
    }
  }
  ```

* Important Notes:
  - Deletion is permanent and cannot be undone
  - No confirmation prompt is provided
  - If file doesn't exist, error 404 is returned
  - Cannot delete directories (use rmdir for directories)
  - Always close SFTP connection after operations
  - SFTP error code 2 = No such file, 3 = Permission denied

* Safety Recommendations:
  - Always verify the file path before deletion
  - Implement backup procedures before deleting important files
  - Use file listing to confirm file exists first
  - Log all deletion operations for audit trails
  - Implement access controls and permissions
  - Consider archiving instead of deleting for compliance

* Best Practices:
  - Check if file exists before attempting deletion
  - Handle 404 errors gracefully (file may already be deleted)
  - Implement retry logic for transient failures
  - Use batch operations carefully to avoid overwhelming server
  - Monitor disk space after bulk deletions

=======================================================================
*/
