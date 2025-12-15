/**
 * Upload a file to the SFTP server
 * 
 * @param {Object} sftpClient - SFTP Client object from GetSFTPClient (required)
 * @param {string} localPath - Local file path to upload (required)
 * @param {string} remotePath - Remote file path on the SFTP server (required)
 * @returns {Promise<Object>} Response object with upload result
 * 
 * @example
 * const result = await SetUploadFile(sftpClient, './data.csv', '/uploads/data.csv');
 * if (result.statusCode === 200) {
 *   console.log('File uploaded successfully');
 * }
 * 
 * @example
 * const result = await SetUploadFile(sftpClient, './backup.zip', '/backups/daily.zip');
 */
export async function SetUploadFile(sftpClient, localPath, remotePath) {
    try {
        const Verifications = Verification(sftpClient, localPath, remotePath)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_UploadFile(sftpClient, localPath, remotePath)

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
//  FUNCTION: Upload File
//----------------------------------------------
/**
 * Uploads file from local file system to SFTP server
 * 
 * @param {Object} sftpClient - SFTP Client object
 * @param {string} localPath - Local file path
 * @param {string} remotePath - Remote file path
 * @returns {Object} Response object with upload result
 */
async function Call_UploadFile(sftpClient, localPath, remotePath) {
    let httpStatusCode
    let body

    try {
        const result = await sftpClient.put(localPath, remotePath);

        httpStatusCode = 200
        body = {
            Data: result,
            Message: "File uploaded successfully",
        }
    } catch (e) {
        console.error("Error uploading file:", e)
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
        } else if (e.code === 'ENOENT') {
            httpStatusCode = 404
            body = {
                Code: e.code,
                Message: `Local file not found: ${localPath}`,
            }
        } else if (e.code === 3 || (e.message && e.message.includes('Permission denied'))) {
            httpStatusCode = 403
            body = {
                Code: "PermissionDenied",
                Message: `Permission denied writing to: ${remotePath}`,
            }
        } else if (e.code === 2 || (e.message && e.message.includes('No such file'))) {
            httpStatusCode = 404
            body = {
                Code: "DirectoryNotFound",
                Message: `Remote directory not found: ${remotePath}`,
            }
        } else {
            body = {
                Code: e.code || 'Error',
                Message: e.message || "Failed to upload file",
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
 * @param {string} localPath - Local path to validate
 * @param {string} remotePath - Remote path to validate
 * @returns {Object} Validation result with statusCode and body
 */
function Verification(sftpClient, localPath, remotePath) {
    const Verification_sftpClient = Verifications_sftpClient(sftpClient)
    const Verification_localPath = Verifications_localPath(localPath)
    const Verification_remotePath = Verifications_remotePath(remotePath)

    const errors = []

    if (Verification_sftpClient.statusCode !== 200) {
        errors.push(Verification_sftpClient.body.Message)
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
        "Access-Control-Allow-Methods": "POST,OPTIONS",
    }
}

/*
=======================================================================
                             REFERENCE
=======================================================================

* Purpose:
  Uploads a file from the local file system to an SFTP server.

* Use Cases:
  - Upload data exports to remote server
  - Deploy configuration files
  - Backup files to SFTP server
  - Sync local files to remote storage
  - Batch upload multiple files

* Function:
  UploadFile(sftpClient, localPath, remotePath)
  - sftpClient: SFTP Client object from GetSFTPClient
  - localPath: Local file path to upload (e.g., './data.csv')
  - remotePath: Remote file path (e.g., '/uploads/data.csv')

* Response Structure:
  {
    "Data": <Upload result>,
    "Message": "File uploaded successfully"
  }

* Error Handling:
  - 400: Invalid parameters (missing sftpClient, localPath, or remotePath)
  - 403: Permission denied (SFTP code 3)
  - 404: File or directory not found (local file or remote directory)
  - 500: General SFTP or file system error
  - 503: Cannot connect to SFTP server
  - 504: Request timeout

* Example Usage:
  
  1. Basic file upload:
  ```javascript
  import { GetSFTPClient } from '../common/SFTPClient.mjs';
  import { UploadFile } from './UploadFile.mjs';
  
  const connResult = await GetSFTPClient(host, username, password, 22);
  const sftpClient = connResult.body.Data;
  
  const result = await UploadFile(
    sftpClient,
    './local-data.csv',
    '/uploads/data.csv'
  );
  
  if (result.statusCode === 200) {
    console.log('File uploaded successfully');
  } else {
    console.error(result.body.Message);
  }
  
  await sftpClient.end();
  ```
  
  2. Upload with error handling:
  ```javascript
  const result = await UploadFile(sftpClient, './backup.zip', '/backups/daily.zip');
  
  switch (result.statusCode) {
    case 200:
      console.log('Upload complete');
      break;
    case 404:
      console.error('Local file not found or remote directory does not exist');
      break;
    case 403:
      console.error('Permission denied');
      break;
    default:
      console.error('Upload failed:', result.body.Message);
  }
  ```
  
  3. Upload multiple files:
  ```javascript
  import fs from 'fs';
  import path from 'path';
  
  const connResult = await GetSFTPClient(host, username, password, 22);
  const sftpClient = connResult.body.Data;
  
  const localDir = './exports';
  const remoteDir = '/uploads';
  
  const files = fs.readdirSync(localDir);
  
  for (const file of files) {
    const localPath = path.join(localDir, file);
    const remotePath = `${remoteDir}/${file}`;
    
    if (fs.statSync(localPath).isFile()) {
      const result = await UploadFile(sftpClient, localPath, remotePath);
      
      if (result.statusCode === 200) {
        console.log(`Uploaded: ${file}`);
      } else {
        console.error(`Failed to upload ${file}:`, result.body.Message);
      }
    }
  }
  
  await sftpClient.end();
  ```
  
  4. Upload with progress monitoring:
  ```javascript
  import fs from 'fs';
  
  const localPath = './large-file.zip';
  const remotePath = '/uploads/large-file.zip';
  
  const stats = fs.statSync(localPath);
  console.log(`Uploading ${stats.size} bytes...`);
  
  const result = await UploadFile(sftpClient, localPath, remotePath);
  
  if (result.statusCode === 200) {
    console.log('Upload completed');
  }
  ```

* Important Notes:
  - Remote directory must exist before upload
  - File will be overwritten if it already exists remotely
  - SFTP provides encryption by default (SSH protocol)
  - Large files are handled efficiently by the SFTP library
  - Always close SFTP connection after all uploads complete
  - SFTP error code 2 = No such file, 3 = Permission denied

* Performance Tips:
  - For multiple uploads, reuse the same SFTP connection
  - Close connection only after all operations complete
  - Consider parallel uploads for large batches (manage connections carefully)
  - Monitor local file system before uploading
  - SFTP is encrypted, so transfers may be slower than plain FTP

* Security Benefits:
  - All data encrypted in transit (SSH protocol)
  - Credentials never sent in plain text
  - Integrated with SSH key authentication
  - Better security than FTP/FTPS

* File Overwrite Behavior:
  - By default, existing remote files are overwritten
  - No warning or confirmation is provided
  - Consider checking if file exists first using GetFileNamesFromPath
  - Or implement backup/versioning logic before upload

=======================================================================
*/
