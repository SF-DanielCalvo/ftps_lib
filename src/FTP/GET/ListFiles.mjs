/**
 * Get a list of files in the specified FTP directory
 * 
 * @param {Object} ftpClient - FTP Client object from StartConnection (required)
 * @param {string} path - Directory path to list files from (required)
 * @returns {Promise<Object>} Response object with file list
 * 
 * @example
 * const result = await ListFiles(ftpClient, '/uploads');
 * if (result.statusCode === 200) {
 *   const files = result.body.Data;
 *   files.forEach(file => console.log(file.name));
 * }
 */
export async function GetListFiles(ftpClient, path) {
    try {
        const Verifications = Verification(ftpClient, path)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_ListFiles(ftpClient, path)

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
//  FUNCTION: List FTP Files
//----------------------------------------------
/**
 * Lists files in the specified FTP directory
 * 
 * @param {Object} ftpClient - FTP Client object
 * @param {string} path - Directory path
 * @returns {Object} Response object with file list
 */
async function Call_ListFiles(ftpClient, path) {
    let httpStatusCode
    let body

    try {
        const files = await ftpClient.list(path);

        httpStatusCode = 200
        body = {
            Data: files,
            Message: "Files listed successfully",
        }
    } catch (e) {
        console.error("Error listing FTP files:", e)
        httpStatusCode = 500

        if (e.code === 'ECONNREFUSED') {
            httpStatusCode = 503
            body = {
                Code: e.code,
                Message: "Cannot connect to FTP server",
            }
        } else if (e.code === 'ETIMEDOUT') {
            httpStatusCode = 504
            body = {
                Code: e.code,
                Message: "FTP request timed out",
            }
        } else if (e.code === 550) {
            httpStatusCode = 404
            body = {
                Code: "DirectoryNotFound",
                Message: `Directory not found: ${path}`,
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
 * @param {Object} ftpClient - FTP client to validate
 * @param {string} path - Path to validate
 * @returns {Object} Validation result with statusCode and body
 */
function Verification(ftpClient, path) {
    const Verification_ftpClient = Verifications_ftpClient(ftpClient)
    const Verification_path = Verifications_path(path)

    const errors = []

    if (Verification_ftpClient.statusCode !== 200) {
        errors.push(Verification_ftpClient.body.Message)
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
 * Validates the ftpClient parameter
 * 
 * @param {Object} ftpClient - FTP client object to validate
 * @returns {Object} Validation result
 */
function Verifications_ftpClient(ftpClient) {
    if (!ftpClient || typeof ftpClient !== 'object') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'ftpClient' parameter is required and must be an FTP Client object.",
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
  Lists files and directories in a specified FTP directory path.

* Use Cases:
  - Browse FTP directory contents
  - Check if specific files exist
  - Filter files by extension or pattern
  - Monitor directory for new files

* Function:
  ListFiles(ftpClient, path)
  - ftpClient: FTP Client object from StartConnection
  - path: Directory path to list (e.g., '/', '/uploads', '/data')

* Response Structure:
  {
    "Data": [
      {
        "name": "file.txt",
        "type": 1,  // 1 = file, 2 = directory
        "size": 1024,
        "modifiedAt": "2023-01-01T00:00:00.000Z",
        "permissions": {
          "user": 7,
          "group": 5,
          "world": 5
        }
      }
    ],
    "Message": "Files listed successfully"
  }

* File Object Properties:
  - name: File or directory name
  - type: 1 (file), 2 (directory), 3 (symbolic link)
  - size: File size in bytes
  - modifiedAt: Last modification timestamp
  - permissions: Unix-style permissions
  - rawModifiedAt: Raw modification date string
  - user: Owner username
  - group: Group name

* Error Handling:
  - 400: Invalid parameters (missing ftpClient or path)
  - 404: Directory not found (FTP error 550)
  - 500: General FTP error
  - 503: Cannot connect to FTP server
  - 504: Request timeout

* Example Usage:
  ```javascript
  import { StartConnection } from '../common/StartConnection.mjs';
  import { ListFiles } from './ListFiles.mjs';
  
  // Establish connection
  const connResult = await StartConnection(host, user, password, 30);
  const ftpClient = connResult.body.Data;
  
  // List files in directory
  const result = await ListFiles(ftpClient, '/uploads');
  
  if (result.statusCode === 200) {
    const files = result.body.Data;
    
    // Filter only files (not directories)
    const fileList = files.filter(item => item.type === 1);
    
    // Print file names and sizes
    fileList.forEach(file => {
      console.log(`${file.name} - ${file.size} bytes`);
    });
  } else {
    console.error(result.body.Message);
  }
  
  // Close connection
  ftpClient.close();
  ```

* Common Patterns:
  
  1. Filter by file extension:
  ```javascript
  const txtFiles = files.filter(f => f.name.endsWith('.txt'));
  ```
  
  2. Sort by modification date:
  ```javascript
  const sorted = files.sort((a, b) => 
    new Date(b.modifiedAt) - new Date(a.modifiedAt)
  );
  ```
  
  3. Get total directory size:
  ```javascript
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  ```

* Notes:
  - Root directory is typically '/' or may be empty string ''
  - Permissions follow Unix format (user/group/world)
  - Symbolic links (type 3) may require special handling
  - Some FTP servers may not provide all metadata fields
  - Large directories may take longer to list

=======================================================================
*/
