/**
 * Download a file from the SFTP server and save it to a local path
 * 
 * @param {Object} sftpClient - SFTP Client object from GetSFTPClient (required)
 * @param {string} remotePath - Remote file path on the SFTP server (required)
 * @param {string} localPath - Local file path where the file will be saved (required)
 * @returns {Promise<Object>} Response object with download result
 * 
 * @example
 * const result = await GetFile(sftpClient, '/uploads/data.csv', './data.csv');
 * if (result.statusCode === 200) {
 *   console.log('File downloaded successfully');
 * }
 */
export async function GetFile(sftpClient, remotePath, localPath) {
    try {
        const Verifications = Verification(sftpClient, remotePath, localPath)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_GetFile(sftpClient, remotePath, localPath)

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
 * Downloads file from SFTP server to local file system
 * 
 * @param {Object} sftpClient - SFTP Client object
 * @param {string} remotePath - Remote file path
 * @param {string} localPath - Local file path
 * @returns {Object} Response object with download result
 */
async function Call_GetFile(sftpClient, remotePath, localPath) {
    let httpStatusCode
    let body

    try {
        const result = await sftpClient.get(remotePath, localPath);

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
                Message: `Remote file not found: ${remotePath}`,
            }
        } else if (e.code === 3 || (e.message && e.message.includes('Permission denied'))) {
            httpStatusCode = 403
            body = {
                Code: "PermissionDenied",
                Message: `Permission denied accessing: ${remotePath}`,
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
 * @param {Object} sftpClient - SFTP client to validate
 * @param {string} remotePath - Remote path to validate
 * @param {string} localPath - Local path to validate
 * @returns {Object} Validation result with statusCode and body
 */
function Verification(sftpClient, remotePath, localPath) {
    const Verification_sftpClient = Verifications_sftpClient(sftpClient)
    const Verification_remotePath = Verifications_remotePath(remotePath)
    const Verification_localPath = Verifications_localPath(localPath)

    const errors = []

    if (Verification_sftpClient.statusCode !== 200) {
        errors.push(Verification_sftpClient.body.Message)
    }
    if (Verification_remotePath.statusCode !== 200) {
        errors.push(Verification_remotePath.body.Message)
    }
    if (Verification_localPath.statusCode !== 200) {
        errors.push(Verification_localPath.body.Message)
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
  Downloads a file from an SFTP server and saves it directly to the
  local file system.

* Use Cases:
  - Download configuration files securely
  - Retrieve data exports for processing
  - Backup files from remote server
  - Sync files from SFTP to local storage
  - Batch download multiple files

* Function:
  GetFile(sftpClient, remotePath, localPath)
  - sftpClient: SFTP Client object from GetSFTPClient
  - remotePath: Remote file path (e.g., '/uploads/data.csv')
  - localPath: Local file path to save (e.g., './downloads/data.csv')

* Response Structure:
  {
    "Data": <File path or stream result>,
    "Message": "File downloaded successfully"
  }

* Error Handling:
  - 400: Invalid parameters (missing sftpClient, remotePath, or localPath)
  - 403: Permission denied (SFTP code 3 or local file system)
  - 404: File not found (SFTP code 2 or local directory doesn't exist)
  - 500: General SFTP or file system error
  - 503: Cannot connect to SFTP server
  - 504: Request timeout

* Example Usage:
  
  1. Basic file download:
  ```javascript
  import { GetSFTPClient } from '../common/SFTPClient.mjs';
  import { GetFile } from './File.mjs';
  
  const connResult = await GetSFTPClient(host, username, password, 22);
  const sftpClient = connResult.body.Data;
  
  const result = await GetFile(
    sftpClient,
    '/uploads/data.csv',
    './local-data.csv'
  );
  
  if (result.statusCode === 200) {
    console.log('File downloaded successfully');
  } else {
    console.error(result.body.Message);
  }
  
  await sftpClient.end();
  ```
  
  2. Download with error handling:
  ```javascript
  const result = await GetFile(sftpClient, '/backups/daily.zip', './backup.zip');
  
  switch (result.statusCode) {
    case 200:
      console.log('Download complete');
      break;
    case 404:
      console.error('File not found on server');
      break;
    case 403:
      console.error('Permission denied');
      break;
    default:
      console.error('Download failed:', result.body.Message);
  }
  ```
  
  3. Download multiple files:
  ```javascript
  import { GetFileNamesFromPath } from './FileNamesFromPath.mjs';
  
  const connResult = await GetSFTPClient(host, username, password, 22);
  const sftpClient = connResult.body.Data;
  
  // List files in remote directory
  const listResult = await GetFileNamesFromPath(sftpClient, '/uploads');
  
  if (listResult.statusCode === 200) {
    const files = listResult.body.Data;
    
    // Download each file
    for (const file of files) {
      if (file.type === '-') { // Only files, not directories
        const result = await GetFile(
          sftpClient,
          `/uploads/${file.name}`,
          `./downloads/${file.name}`
        );
        
        if (result.statusCode === 200) {
          console.log(`Downloaded: ${file.name}`);
        } else {
          console.error(`Failed to download ${file.name}:`, result.body.Message);
        }
      }
    }
  }
  
  await sftpClient.end();
  ```
  
  4. Download with directory creation:
  ```javascript
  import fs from 'fs';
  import path from 'path';
  
  const remotePath = '/reports/monthly.pdf';
  const localPath = './downloads/reports/monthly.pdf';
  
  // Ensure directory exists
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const result = await GetFile(sftpClient, remotePath, localPath);
  
  if (result.statusCode === 200) {
    console.log('File saved to:', localPath);
  }
  ```

* Important Notes:
  - Local directory must exist before download (or create it first)
  - File will be overwritten if it already exists locally
  - SFTP provides encryption by default (SSH protocol)
  - Large files are handled efficiently by the SFTP library
  - Always close SFTP connection after all downloads complete
  - SFTP error code 2 = No such file, 3 = Permission denied

* Performance Tips:
  - For multiple downloads, reuse the same SFTP connection
  - Close connection only after all operations complete
  - Consider parallel downloads for large batches (manage connections carefully)
  - Monitor disk space before downloading large files
  - SFTP is encrypted, so transfers may be slower than plain FTP

* Security Benefits:
  - All data encrypted in transit (SSH protocol)
  - Credentials never sent in plain text
  - Integrated with SSH key authentication
  - Better security than FTP/FTPS

=======================================================================
*/
