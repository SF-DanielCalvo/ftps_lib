import SftpClient from 'ssh2-sftp-client/src/index.js';

/**
 * Initialize an SFTP connection and return the SFTP Client object
 * 
 * @param {string} host - SFTP server hostname (required)
 * @param {string} username - SFTP username (required)
 * @param {string} password - SFTP password (required)
 * @param {number} [port=22] - SFTP port number (optional, defaults to 22)
 * @returns {Promise<Object>} Response object with SFTP client
 * 
 * @example
 * const result = await CreateClient('sftp.example.com', 'user', 'pass', 22);
 * if (result.statusCode === 200) {
 *   const sftpClient = result.body.Data;
 *   // Use sftpClient for SFTP operations
 * }
 */
export async function CreateClient(host, username, password, port = 22) {
    try {
        const Verifications = Verification(host, username, password, port)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_CreateClient(host, username, password, port)

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
//  FUNCTION: Get SFTP Client
//----------------------------------------------
/**
 * Establishes SFTP connection and returns client instance
 * 
 * @param {string} host - SFTP server hostname
 * @param {string} username - SFTP username
 * @param {string} password - SFTP password
 * @param {number} port - SFTP port number
 * @returns {Object} Response object with SFTP client
 */
async function Call_CreateClient(host, username, password, port) {
    let httpStatusCode
    let body

    try {
        const sftp = new SftpClient();

        await sftp.connect({
            host: host,
            port: port,
            username: username,
            password: password,
            privateKey: null,
        });

        httpStatusCode = 200
        body = {
            Data: sftp,
            Message: "SFTP connection established successfully",
        }
    } catch (e) {
        console.error("Error establishing SFTP connection:", e)
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
                Message: "SFTP connection timed out",
            }
        } else if (e.code === 'ENOTFOUND') {
            httpStatusCode = 404
            body = {
                Code: e.code,
                Message: "SFTP server not found",
            }
        } else if (e.message && e.message.includes('Authentication failed')) {
            httpStatusCode = 401
            body = {
                Code: "AuthenticationFailed",
                Message: "Invalid SFTP credentials",
            }
        } else if (e.message && e.message.includes('All configured authentication methods failed')) {
            httpStatusCode = 401
            body = {
                Code: "AuthenticationFailed",
                Message: "All authentication methods failed",
            }
        } else {
            body = {
                Code: e.code || 'Error',
                Message: e.message || "Failed to establish SFTP connection",
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
 * @param {string} host - SFTP server hostname to validate
 * @param {string} username - Username to validate
 * @param {string} password - Password to validate
 * @param {number} port - Port number to validate
 * @returns {Object} Validation result with statusCode and body
 */
function Verification(host, username, password, port) {
    const Verification_host = Verifications_host(host)
    const Verification_username = Verifications_username(username)
    const Verification_password = Verifications_password(password)
    const Verification_port = Verifications_port(port)

    const errors = []

    if (Verification_host.statusCode !== 200) {
        errors.push(Verification_host.body.Message)
    }
    if (Verification_username.statusCode !== 200) {
        errors.push(Verification_username.body.Message)
    }
    if (Verification_password.statusCode !== 200) {
        errors.push(Verification_password.body.Message)
    }
    if (Verification_port.statusCode !== 200) {
        errors.push(Verification_port.body.Message)
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
 * Validates the host parameter
 * 
 * @param {string} host - SFTP server hostname to validate
 * @returns {Object} Validation result
 */
function Verifications_host(host) {
    if (!host || typeof host !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'host' parameter is required.",
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
 * Validates the username parameter
 * 
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
function Verifications_username(username) {
    if (!username || typeof username !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'username' parameter is required.",
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
 * Validates the password parameter
 * 
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function Verifications_password(password) {
    if (!password || typeof password !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'password' parameter is required.",
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
 * Validates the port parameter
 * 
 * @param {number} port - Port number to validate
 * @returns {Object} Validation result
 */
function Verifications_port(port) {
    if (port === undefined || port === null || typeof port !== 'number') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'port' parameter must be a number.",
            },
        }
    }

    if (port <= 0 || port > 65535) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'port' parameter must be between 1 and 65535.",
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
  Establishes an SFTP (SSH File Transfer Protocol) connection to a
  server and returns a client instance for performing SFTP operations.

* Use Cases:
  - Connect to SFTP servers for secure file operations
  - Initialize SFTP client for secure download/upload tasks
  - Establish SSH-based file transfers
  - Manage secure file transfers in automated workflows

* Function:
  CreateClient(host, username, password, port = 22)
  - host: SFTP server hostname or IP address
  - username: SFTP username for authentication
  - password: SFTP password for authentication
  - port: SFTP port number (default: 22)

* Response Structure:
  {
    "Data": <SFTP Client Object>,
    "Message": "SFTP connection established successfully"
  }

* SFTP Client Object:
  The returned client is from the 'ssh2-sftp-client' library and includes
  methods such as:
  - list(path): List files in directory
  - get(remotePath, localPath): Download files
  - put(localPath, remotePath): Upload files
  - delete(path): Delete files
  - rename(oldPath, newPath): Move/rename files
  - mkdir(path): Create directory
  - rmdir(path): Remove directory
  - end(): Close connection

* Connection Settings:
  - Default port: 22 (SSH/SFTP standard)
  - Authentication: Password-based (can be extended for privateKey)
  - Protocol: SSH2 with SFTP subsystem

* Error Handling:
  - 400: Invalid parameters (missing or invalid values)
  - 401: Authentication failed (invalid credentials or all auth methods failed)
  - 404: SFTP server not found
  - 500: General SFTP connection error
  - 503: Cannot connect to SFTP server (connection refused)
  - 504: Connection timeout

* Example Usage:
  ```javascript
  import { CreateClient } from './common/SFTPClient.mjs';
  
  const host = process.env.SFTP_HOST;
  const username = process.env.SFTP_USER;
  const password = process.env.SFTP_PASSWORD;
  const port = 22;
  
  const result = await CreateClient(host, username, password, port);
  
  if (result.statusCode === 200) {
    const sftpClient = result.body.Data;
    
    // List files in directory
    const files = await sftpClient.list('/uploads');
    console.log(files);
    
    // Close connection when done
    await sftpClient.end();
  } else {
    console.error(result.body.Message);
  }
  ```

* Security Notes:
  - Never commit SFTP credentials to version control
  - Store credentials in environment variables or secure vault
  - SFTP provides encryption by default (SSH protocol)
  - Always close SFTP connections when operations are complete
  - Implement proper error handling for failed connections
  - Consider implementing connection pooling for high-frequency operations
  - For production, consider using SSH key authentication instead of passwords

* SSH Key Authentication (Future Enhancement):
  To use SSH keys instead of passwords, modify the connect config:
  ```javascript
  await sftp.connect({
    host: host,
    port: port,
    username: username,
    privateKey: fs.readFileSync('/path/to/private/key'),
    passphrase: 'keyPassphrase' // if key is encrypted
  });
  ```

* Dependencies:
  - ssh2-sftp-client: SFTP client library (npm install ssh2-sftp-client)
  - ssh2: SSH2 protocol implementation (peer dependency)

* Differences from FTP:
  - SFTP uses SSH protocol (encrypted)
  - FTP uses plain text (unless FTPS)
  - SFTP default port: 22
  - FTP default port: 21
  - SFTP requires SSH authentication

=======================================================================
*/
