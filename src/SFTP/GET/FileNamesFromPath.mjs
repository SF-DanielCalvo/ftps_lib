/**
 * Get a list of files in the specified SFTP directory
 * 
 * @param {Object} sftpClient - SFTP Client object from GetSFTPClient (required)
 * @param {string} path - Directory path to list files from (required)
 * @returns {Promise<Object>} Response object with file list
 * 
 * @example
 * const result = await GetFileNamesFromPath(sftpClient, '/uploads');
 * if (result.statusCode === 200) {
 *   const files = result.body.Data;
 *   files.forEach(file => console.log(file.name));
 * }
 * 
 * @example
 * const result = await GetFileNamesFromPath(sftpClient, '/data');
 */
export async function GetFileNamesFromPath(sftpClient, path) {
    try {
        const Verifications = Verification(sftpClient, path)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_GetFileNamesFromPath(sftpClient, path)

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
//  FUNCTION: Get File Names From Path
//----------------------------------------------
/**
 * Lists files in the specified SFTP directory
 * 
 * @param {Object} sftpClient - SFTP Client object
 * @param {string} path - Directory path
 * @returns {Object} Response object with file list
 */
async function Call_GetFileNamesFromPath(sftpClient, path) {
    let httpStatusCode
    let body

    try {
        const fileList = await sftpClient.list(path);

        httpStatusCode = 200
        body = {
            Data: fileList,
            Message: "Files listed successfully",
        }
    } catch (e) {
        console.error("Error listing SFTP files:", e)
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
                Code: "DirectoryNotFound",
                Message: `Directory not found: ${path}`,
            }
        } else if (e.code === 3 || (e.message && e.message.includes('Permission denied'))) {
            httpStatusCode = 403
            body = {
                Code: "PermissionDenied",
                Message: `Permission denied accessing: ${path}`,
            }
        } else {
            body = {
                Code: e.code || 'Error',
                Message: e.message || "Failed to list files",
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
 * @param {string} path - Path to validate
 * @returns {Object} Validation result with statusCode and body
 */
function Verification(sftpClient, path) {
    const Verification_sftpClient = Verifications_sftpClient(sftpClient)
    const Verification_path = Verifications_path(path)

    const errors = []

    if (Verification_sftpClient.statusCode !== 200) {
        errors.push(Verification_sftpClient.body.Message)
    }
    if (Verification_path.statusCode !== 200) {
        errors.push(Verification_path.body.Message)
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
 * Validates the path parameter
 * 
 * @param {string} path - Directory path to validate
 * @returns {Object} Validation result
 */
function Verifications_path(path) {
    if (!path || typeof path !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'path' parameter is required.",
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
        "Access-Control-Allow-Methods": "GET,OPTIONS",
    }
}

/*
=======================================================================
                             REFERENCE
=======================================================================

* Purpose:
  Lists files and directories in a specified SFTP directory path.

* Use Cases:
  - Browse SFTP directory contents
  - Check if specific files exist
  - Filter files by extension or pattern
  - Monitor directory for new files

* Function:
  GetFileNamesFromPath(sftpClient, path)
  - sftpClient: SFTP Client object from GetSFTPClient
  - path: Directory path to list (e.g., '/', '/uploads', '/data')

* Response Structure:
  {
    "Data": [
      {
        "type": "-",  // "-" = file, "d" = directory, "l" = symbolic link
        "name": "file.txt",
        "size": 1024,
        "modifyTime": 1609459200000,
        "accessTime": 1609459200000,
        "rights": {
          "user": "rw",
          "group": "r",
          "other": "r"
        },
        "owner": 1000,
        "group": 1000
      }
    ],
    "Message": "Files listed successfully"
  }

* File Object Properties:
  - type: "-" (file), "d" (directory), "l" (symbolic link)
  - name: File or directory name
  - size: File size in bytes
  - modifyTime: Last modification timestamp (Unix epoch in ms)
  - accessTime: Last access timestamp (Unix epoch in ms)
  - rights: Unix-style permissions
  - owner: Owner UID
  - group: Group GID

* Error Handling:
  - 400: Invalid parameters (missing sftpClient or path)
  - 403: Permission denied (SFTP error code 3)
  - 404: Directory not found (SFTP error code 2)
  - 500: General SFTP error
  - 503: Cannot connect to SFTP server
  - 504: Request timeout

* Example Usage:
  ```javascript
  import { GetSFTPClient } from '../common/SFTPClient.mjs';
  import { GetFileNamesFromPath } from './FileNamesFromPath.mjs';
  
  // Establish connection
  const connResult = await GetSFTPClient(host, username, password, 22);
  const sftpClient = connResult.body.Data;
  
  // List files in directory
  const result = await GetFileNamesFromPath(sftpClient, '/uploads');
  
  if (result.statusCode === 200) {
    const files = result.body.Data;
    
    // Filter only files (not directories)
    const fileList = files.filter(item => item.type === '-');
    
    // Print file names and sizes
    fileList.forEach(file => {
      console.log(`${file.name} - ${file.size} bytes`);
    });
  } else {
    console.error(result.body.Message);
  }
  
  // Close connection
  await sftpClient.end();
  ```

* Common Patterns:
  
  1. Filter by file extension:
  ```javascript
  const txtFiles = files.filter(f => f.name.endsWith('.txt') && f.type === '-');
  ```
  
  2. Sort by modification time:
  ```javascript
  const sorted = files.sort((a, b) => b.modifyTime - a.modifyTime);
  ```
  
  3. Get total directory size:
  ```javascript
  const totalSize = files
    .filter(f => f.type === '-')
    .reduce((sum, f) => sum + f.size, 0);
  ```
  
  4. Convert timestamps to dates:
  ```javascript
  files.forEach(file => {
    const modifiedDate = new Date(file.modifyTime);
    console.log(`${file.name} modified: ${modifiedDate.toISOString()}`);
  });
  ```

* Notes:
  - Root directory is typically '/' or may be './'
  - Permissions follow Unix format (user/group/other)
  - Symbolic links (type "l") may require special handling
  - Some SFTP servers may not provide all metadata fields
  - Large directories may take longer to list
  - SFTP error codes: 2 = No such file, 3 = Permission denied

* SFTP vs FTP Differences:
  - SFTP uses SSH (encrypted)
  - File metadata may differ slightly
  - Error codes are SFTP-specific
  - Symbolic links handling may differ

=======================================================================
*/
