/**
 * Close the SFTP Client
 * 
 * @param {Object} sftpClient - SFTP Client object from GetSFTPClient (required)
 * @returns {Promise<Object>} Response object with close result
 * 
 * @example
 * const result = await CloseClient(sftpClient);
 * if (result.statusCode === 200) {
 *   console.log('Client closed successfully');
 * }
 */
export async function CloseClient(sftpClient) {
    try {
        const Verifications = Verification(sftpClient)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_CloseClient(sftpClient)

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
//  FUNCTION: Close Client
//----------------------------------------------
/**
 * Closes SFTP Client gracefully
 * 
 * @param {Object} sftpClient - SFTP Client object
 * @returns {Object} Response object with close result
 */
async function Call_CloseClient(sftpClient) {
    let httpStatusCode
    let body

    try {
        await sftpClient.end();

        httpStatusCode = 200
        body = {
            Data: true,
            Message: "SFTP Client closed successfully",
        }
    } catch (e) {
        console.error("Error closing SFTP Client:", e)
        httpStatusCode = 500

        body = {
            Code: e.code || 'Error',
            Message: e.message || "Failed to close SFTP Client",
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
 * @returns {Object} Validation result with statusCode and body
 */
function Verification(sftpClient) {
    const Verification_sftpClient = Verifications_sftpClient(sftpClient)

    const errors = []

    if (Verification_sftpClient.statusCode !== 200) {
        errors.push(Verification_sftpClient.body.Message)
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
    }
}

/*
=======================================================================
                             REFERENCE
=======================================================================

* Purpose:
  Gracefully closes an SFTP Client to free up resources.

* Use Cases:
  - Clean up after completing all SFTP operations
  - Release server resources
  - End session after file transfers
  - Properly terminate Clients in error scenarios
  - Implement Client pooling cleanup

* Function:
  CloseClient(sftpClient)
  - sftpClient: SFTP Client object from GetSFTPClient

* Response Structure:
  {
    "Data": true,
    "Message": "SFTP Client closed successfully"
  }

* Error Handling:
  - 400: Invalid parameter (missing sftpClient)
  - 500: General error closing Client

* Example Usage:
  
  1. Basic Client close:
  ```javascript
  import { GetSFTPClient } from '../common/SFTPClient.mjs';
  import { CloseClient } from './CloseClient.mjs';
  
  const connResult = await GetSFTPClient(host, username, password, 22);
  const sftpClient = connResult.body.Data;
  
  // Perform SFTP operations...
  
  // Close Client
  const result = await CloseClient(sftpClient);
  
  if (result.statusCode === 200) {
    console.log('Client closed successfully');
  } else {
    console.error(result.body.Message);
  }
  ```
  
  2. With try-finally pattern:
  ```javascript
  let sftpClient;
  
  try {
    const connResult = await GetSFTPClient(host, username, password, 22);
    sftpClient = connResult.body.Data;
    
    // Perform SFTP operations...
    
  } finally {
    if (sftpClient) {
      await CloseClient(sftpClient);
    }
  }
  ```
  
  3. Complete workflow with cleanup:
  ```javascript
  import { GetSFTPClient } from '../common/SFTPClient.mjs';
  import { GetFile } from '../GET/File.mjs';
  import { CloseClient } from './CloseClient.mjs';
  
  async function downloadFile(host, username, password, remotePath, localPath) {
    let sftpClient;
    
    try {
      // Connect
      const connResult = await GetSFTPClient(host, username, password, 22);
      if (connResult.statusCode !== 200) {
        throw new Error('Failed to connect');
      }
      sftpClient = connResult.body.Data;
      
      // Download
      const downloadResult = await GetFile(sftpClient, remotePath, localPath);
      if (downloadResult.statusCode !== 200) {
        throw new Error('Failed to download');
      }
      
      console.log('File downloaded successfully');
      
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      // Always close Client
      if (sftpClient) {
        const closeResult = await CloseClient(sftpClient);
        if (closeResult.statusCode === 200) {
          console.log('Client closed');
        }
      }
    }
  }
  
  await downloadFile(host, username, password, '/data.csv', './local-data.csv');
  ```
  
  4. Client pooling pattern:
  ```javascript
  class SFTPPool {
    constructor(config) {
      this.config = config;
      this.Clients = [];
    }
    
    async getClient() {
      if (this.Clients.length > 0) {
        return this.Clients.pop();
      }
      
      const result = await GetSFTPClient(
        this.config.host,
        this.config.username,
        this.config.password,
        this.config.port
      );
      
      return result.body.Data;
    }
    
    async releaseClient(sftpClient) {
      // Return to pool instead of closing
      this.Clients.push(sftpClient);
    }
    
    async closeAll() {
      for (const client of this.Clients) {
        await CloseClient(client);
      }
      this.Clients = [];
      console.log('All Clients closed');
    }
  }
  
  const pool = new SFTPPool({ host, username, password, port: 22 });
  
  // Use Client
  const client = await pool.getClient();
  // ... operations ...
  await pool.releaseClient(client);
  
  // Cleanup when done
  await pool.closeAll();
  ```

* Important Notes:
  - Always close Clients when done to free resources
  - Client should be closed even if errors occur
  - Use try-finally to ensure cleanup
  - Closing an already closed Client may result in errors
  - Pending operations may be interrupted
  - Client cannot be reused after closing

* Best Practices:
  - Use try-finally blocks to guarantee cleanup
  - Close Clients as soon as operations complete
  - Don't keep Clients open unnecessarily
  - Implement timeout mechanisms for long-running operations
  - Log Client lifecycle for debugging
  - Handle close errors gracefully

* Client Lifecycle:
  1. Connect: GetSFTPClient()
  2. Perform operations: Get/Put/Delete/Move files
  3. Close: CloseClient()

* Alternative to manual closing:
  ```javascript
  // Direct use of end() method (less structured)
  await sftpClient.end();
  
  // vs structured approach with validation
  await CloseClient(sftpClient);
  ```

* Resource Management:
  - Each Client consumes server resources
  - Unclosed Clients may lead to resource leaks
  - Server may have Client limits
  - Proper cleanup prevents Client exhaustion
  - Consider Client pooling for high-frequency operations

=======================================================================
*/
