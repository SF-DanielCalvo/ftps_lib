import ftp from 'basic-ftp';

/**
 * Initialize an FTP connection and return the FTP Client object
 * 
 * @param {string} host - FTP server hostname (required)
 * @param {string} user - FTP username (required)
 * @param {string} password - FTP password (required)
 * @param {boolean} secure - Whether to use secure FTP connection (FTPS) (optional, default: false)
 * @param {number} timeout - Connection timeout in seconds (required)
 * @returns {Promise<Object>} Response object with FTP client
 * 
 * @example
 * const result = await CreateClient('ftp.example.com', 'user', 'pass', 30);
 * if (result.statusCode === 200) {
 *   const ftpClient = result.body.Data;
 *   // Use ftpClient for FTP operations
 * }
 */
export async function CreateClient(host, user, password, secure, timeout = 10000) {
    try {
        const Verifications = Verification(host, user, password, timeout)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_CreateClient(host, user, password, secure, timeout)

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
//  FUNCTION: Start FTP Connection
//----------------------------------------------
/**
 * Establishes FTP connection and returns client instance
 * 
 * @param {string} host - FTP server hostname
 * @param {string} user - FTP username
 * @param {string} password - FTP password
 * @param {boolean} secure - Whether to use secure FTP connection (FTPS)
 * @param {number} timeout - Connection timeout in seconds
 * @returns {Object} Response object with FTP client
 */
async function Call_CreateClient(host, user, password, secure, timeout) {
    let httpStatusCode
    let body

    try {
        const ftpClient = new ftp.Client(timeout * 1000);
        
        ftpClient.ftp.verbose = true;


        let config = {
            host: host,
            user: user,
            password: password,
            secure: secure, // set to 'true' if using FTPS
        }

        if (secure) {
            config.secureOptions = {
                rejectUnauthorized: false
            }
        }

        await ftpClient.access(config);

        httpStatusCode = 200
        body = {
            Data: ftpClient,
            Message: "FTP connection established successfully",
        }
    } catch (e) {
        console.error("Error establishing FTP connection:", e)
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
                Message: "FTP connection timed out",
            }
        } else if (e.code === 'ENOTFOUND') {
            httpStatusCode = 404
            body = {
                Code: e.code,
                Message: "FTP server not found",
            }
        } else if (e.code === 530) {
            httpStatusCode = 401
            body = {
                Code: "AuthenticationFailed",
                Message: "Invalid FTP credentials",
            }
        } else {
            body = {
                Code: e.code || 'Error',
                Message: e.message || "Failed to establish FTP connection",
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
 * @param {string} host - FTP server hostname to validate
 * @param {string} user - Username to validate
 * @param {string} password - Password to validate
 * @param {number} timeout - Timeout to validate
 * @returns {Object} Validation result with statusCode and body
 */
function Verification(host, user, password, timeout) {
    const Verification_host = Verifications_host(host)
    const Verification_user = Verifications_user(user)
    const Verification_password = Verifications_password(password)
    const Verification_timeout = Verifications_timeout(timeout)

    const errors = []

    if (Verification_host.statusCode !== 200) {
        errors.push(Verification_host.body.Message)
    }
    if (Verification_user.statusCode !== 200) {
        errors.push(Verification_user.body.Message)
    }
    if (Verification_password.statusCode !== 200) {
        errors.push(Verification_password.body.Message)
    }
    if (Verification_timeout.statusCode !== 200) {
        errors.push(Verification_timeout.body.Message)
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
 * @param {string} host - FTP server hostname to validate
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
 * Validates the user parameter
 * 
 * @param {string} user - Username to validate
 * @returns {Object} Validation result
 */
function Verifications_user(user) {
    if (!user || typeof user !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'user' parameter is required.",
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
 * Validates the timeout parameter
 * 
 * @param {number} timeout - Timeout value to validate
 * @returns {Object} Validation result
 */
function Verifications_timeout(timeout) {
    if (timeout === undefined || timeout === null || typeof timeout !== 'number') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'timeout' parameter is required and must be a number.",
            },
        }
    }

    if (timeout <= 0) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'timeout' parameter must be greater than 0.",
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
  Establishes an FTP connection to a server and returns a client
  instance for performing FTP operations.

* Use Cases:
  - Connect to FTP servers for file operations
  - Initialize FTP client for download/upload tasks
  - Establish secure or insecure FTP connections
  - Manage file transfers in automated workflows

* Function:
  CreateClient(host, user, password, timeout)
  - host: FTP server hostname or IP address
  - user: FTP username for authentication
  - password: FTP password for authentication
  - timeout: Connection timeout in seconds

* Response Structure:
  {
    "Data": <FTP Client Object>,
    "Message": "FTP connection established successfully"
  }

* FTP Client Object:
  The returned client is from the 'basic-ftp' library and includes
  methods such as:
  - list(path): List files in directory
  - downloadTo(destination, source): Download files
  - uploadFrom(source, destination): Upload files
  - remove(path): Delete files
  - cd(directory): Change directory
  - close(): Close connection

* Connection Settings:
  - Verbose mode: Enabled by default
  - Secure mode: Disabled (set secure: true for FTPS)
  - Timeout: Configurable in seconds (converted to milliseconds)

* Error Handling:
  - 400: Invalid parameters (missing or invalid values)
  - 401: Authentication failed (invalid credentials)
  - 404: FTP server not found
  - 500: General FTP connection error
  - 503: Cannot connect to FTP server (connection refused)
  - 504: Connection timeout

* Example Usage:
  ```javascript
  import { CreateClient } from './common/CreateClient.mjs';
  
  const host = process.env.FTP_HOST;
  const user = process.env.FTP_USER;
  const password = process.env.FTP_PASSWORD;
  const timeout = 30; // seconds
  
  const result = await CreateClient(host, user, password, timeout);
  
  if (result.statusCode === 200) {
    const ftpClient = result.body.Data;
    
    // List files in directory
    const files = await ftpClient.list('/uploads');
    console.log(files);
    
    // Close connection when done
    ftpClient.close();
  } else {
    console.error(result.body.Message);
  }
  ```

* Security Notes:
  - Never commit FTP credentials to version control
  - Store credentials in environment variables or secure vault
  - Use FTPS (secure: true) for sensitive data transfers
  - Always close FTP connections when operations are complete
  - Implement proper error handling for failed connections
  - Consider implementing connection pooling for high-frequency operations

* Dependencies:
  - basic-ftp: FTP client library (npm install basic-ftp)

=======================================================================
*/
