/**
 * Download a file from the FTP server and save it to a local path
 * 
 * @param {Object} ftpClient - FTP Client object from StartConnection (required)
 * @param {string} localPath - Local file path where the file will be saved (required)
 * @param {string} remotePath - Remote file path on the FTP server (required)
 * @returns {Promise<Object>} Response object with download result
 * 
 * @example
 * const result = await GetFile(ftpClient, './data.csv', '/uploads/data.csv');
 * if (result.statusCode === 200) {
 *   console.log('File downloaded successfully');
 * }
 */
export async function GetFile(ftpClient, localPath, remotePath) {
    try {
        const Verifications = Verification(ftpClient, localPath, remotePath)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_GetFile(ftpClient, localPath, remotePath)

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
//  FUNCTION: Download File
//----------------------------------------------
/**
 * Downloads file from FTP server to local file system
 * 
 * @param {Object} ftpClient - FTP Client object
 * @param {string} localPath - Local file path
 * @param {string} remotePath - Remote file path
 * @returns {Object} Response object with download result
 */
async function Call_GetFile(ftpClient, localPath, remotePath) {
    let httpStatusCode
    let body

    try {
        const result = await ftpClient.downloadTo(localPath, remotePath, 0);

        httpStatusCode = 200
        body = {
            Data: result,
            Message: "File downloaded successfully",
        }
    } catch (e) {
        console.error("Error downloading file:", e)
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
                Code: "FileNotFound",
                Message: `Remote file not found: ${remotePath}`,
            }
        } else if (e.code === 'EACCES') {
            httpStatusCode = 403
            body = {
                Code: e.code,
                Message: `Permission denied writing to local path: ${localPath}`,
            }
        } else if (e.code === 'ENOENT') {
            httpStatusCode = 404
            body = {
                Code: e.code,
                Message: `Local directory does not exist: ${localPath}`,
            }
        } else {
            body = {
                Code: e.code || 'Error',
                Message: e.message || "Failed to download file",
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
 * @param {string} localPath - Local path to validate
 * @param {string} remotePath - Remote path to validate
 * @returns {Object} Validation result with statusCode and body
 */
function Verification(ftpClient, localPath, remotePath) {
    const Verification_ftpClient = Verifications_ftpClient(ftpClient)
    const Verification_localPath = Verifications_localPath(localPath)
    const Verification_remotePath = Verifications_remotePath(remotePath)

    const errors = []

    if (Verification_ftpClient.statusCode !== 200) {
        errors.push(Verification_ftpClient.body.Message)
    }
    if (Verification_localPath.statusCode !== 200) {
        errors.push(Verification_localPath.body.Message)
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
 * Validates the localPath parameter
 * 
 * @param {string} localPath - Local file path to validate
 * @returns {Object} Validation result
 */
function Verifications_localPath(localPath) {
    if (!localPath || typeof localPath !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'localPath' parameter is required.",
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
        "Access-Control-Allow-Methods": "GET,OPTIONS",
    }
}

/*
=======================================================================
                             REFERENCE
=======================================================================

* Purpose:
  Downloads a file from an FTP server and saves it directly to the
  local file system.

* Use Cases:
  - Download configuration files
  - Retrieve data exports for processing
  - Backup files from remote server
  - Sync files from FTP to local storage
  - Batch download multiple files

* Function:
  GetFile(ftpClient, localPath, remotePath)
  - ftpClient: FTP Client object from StartConnection
  - localPath: Local file path to save (e.g., './downloads/data.csv')
  - remotePath: Remote file path (e.g., '/uploads/data.csv')

* Response Structure:
  {
    "Data": {
      "code": 226,
      "message": "Transfer complete"
    },
    "Message": "File downloaded successfully"
  }

* Error Handling:
  - 400: Invalid parameters (missing ftpClient, localPath, or remotePath)
  - 403: Permission denied (cannot write to local path)
  - 404: File not found (remote file or local directory doesn't exist)
  - 500: General FTP or file system error
  - 503: Cannot connect to FTP server
  - 504: Request timeout

* Example Usage:
  
  1. Basic file download:
  ```javascript
  import { StartConnection } from '../common/StartConnection.mjs';
  import { GetFile } from './File.mjs';
  
  const connResult = await StartConnection(host, user, password, 30);
  const ftpClient = connResult.body.Data;
  
  const result = await GetFile(
    ftpClient,
    './local-data.csv',
    '/uploads/data.csv'
  );
  
  if (result.statusCode === 200) {
    console.log('File downloaded successfully');
  } else {
    console.error(result.body.Message);
  }
  
  ftpClient.close();
  ```
  
  2. Download with error handling:
  ```javascript
  const result = await GetFile(ftpClient, './backup.zip', '/backups/daily.zip');
  
  switch (result.statusCode) {
    case 200:
      console.log('Download complete');
      break;
    case 404:
      console.error('File not found on server');
      break;
    case 403:
      console.error('Permission denied - check local path permissions');
      break;
    default:
      console.error('Download failed:', result.body.Message);
  }
  ```
  
  3. Download multiple files:
  ```javascript
  import { ListFiles } from './ListFiles.mjs';
  
  const connResult = await StartConnection(host, user, password, 30);
  const ftpClient = connResult.body.Data;
  
  // List files in remote directory
  const listResult = await ListFiles(ftpClient, '/uploads');
  
  if (listResult.statusCode === 200) {
    const files = listResult.body.Data;
    
    // Download each file
    for (const file of files) {
      if (file.type === 1) { // Only files, not directories
        const result = await GetFile(
          ftpClient,
          `./downloads/${file.name}`,
          `/uploads/${file.name}`
        );
        
        if (result.statusCode === 200) {
          console.log(`Downloaded: ${file.name}`);
        } else {
          console.error(`Failed to download ${file.name}:`, result.body.Message);
        }
      }
    }
  }
  
  ftpClient.close();
  ```
  
  4. Download with directory creation:
  ```javascript
  import fs from 'fs';
  import path from 'path';
  
  const localPath = './downloads/reports/monthly.pdf';
  const remotePath = '/reports/monthly.pdf';
  
  // Ensure directory exists
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const result = await GetFile(ftpClient, localPath, remotePath);
  
  if (result.statusCode === 200) {
    console.log('File saved to:', localPath);
  }
  ```

* Important Notes:
  - Local directory must exist before download (or create it first)
  - File will be overwritten if it already exists locally
  - Download starts at byte offset 0 (full file download)
  - Large files are handled efficiently by the FTP library
  - Always close FTP connection after all downloads complete
  - Consider using GetFileStream for very large files to monitor progress

* Performance Tips:
  - For multiple downloads, reuse the same FTP connection
  - Close connection only after all operations complete
  - Consider parallel downloads for large batches (manage connections carefully)
  - Monitor disk space before downloading large files

=======================================================================
*/
