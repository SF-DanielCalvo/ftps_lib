import * as GET from '../GET/index.mjs';
import * as SET from '../SET/index.mjs';
import { CreateClient } from '../common/CreateClient.mjs';

/**
 * Service class for managing FTP connections and operations
 * Handles connection lifecycle, automatic reconnection, and provides convenient access to FTP operations
 * 
 * @param {Object} config - FTP connection configuration (required)
 * @param {string} config.host - FTP server hostname (required)
 * @param {string} config.user - FTP username (required)
 * @param {string} config.password - FTP password (required)
 * @param {number} config.timeout - Connection timeout in seconds (required)
 * @returns {Object} Service instance or error response
 * 
 * @example
 * const ftpService = FTPService.GetCreate({
 *   host: 'ftp.example.com',
 *   user: 'ftpuser',
 *   password: 'ftppass',
 *   timeout: 30
 * });
 * 
 * @example
 * const client = await ftpService.GetClient();
 * 
 * @example
 * const files = await ftpService.GetListFiles('/uploads');
 * 
 * @example
 * const file = await ftpService.GetFile('./local.txt', '/remote.txt');
 * 
 * @example
 * const stream = await ftpService.GetFileStream('/data.csv');
 * 
 * @example
 * await ftpService.Close();
 */

export class FTPService {
    /**
     * Private constructor - use FTPService.GetCreate() instead
     * @private
     */
    constructor(config) {
        this._config = config;
        this._client = null;
        this._connected = false;
        this._createdAt = new Date().toISOString();
    }

    /**
     * Create a new FTPService instance with connection configuration
     * 
     * @param {Object} config - FTP connection configuration (required)
     * @param {string} config.host - FTP server hostname (required)
     * @param {string} config.user - FTP username (required)
     * @param {string} config.password - FTP password (required)
     * @param {number} config.secure - Use secure FTP connection (optional, default: false)
     * @param {number} config.timeout - Connection timeout in seconds (required)
     * @returns {Object} Service instance or error response
     * 
     * @example
     * const service = FTPService.GetCreate({
     *   host: 'ftp.example.com',
     *   user: 'admin',
     *   password: 'password123',
     *   timeout: 30
     * });
     * 
     * @example
     * const service = FTPService.GetCreate({
     *   host: '192.168.1.100',
     *   user: 'ftpuser',
     *   password: 'secret',
     *   timeout: 60
     * });
     
    static GetCreate(config) {
        try {
            const Verifications = Verification(config);
            if (Verifications.statusCode !== 200) {
                return Verifications;
            }

            return new FTPService(config);
        } catch (error) {
            return {
                statusCode: 500,
                headers: defaultHeaders(),
                body: {
                    Code: "InternalError",
                    Message: "An error occurred while creating the FTP service.",
                    Error: error.message,
                },
            };
        }
    }
    */
    /**
     * Get FTP client connection, creating one if it doesn't exist
     * Automatically handles reconnection if connection is lost
     * 
     * @returns {Promise<Object>} Response object with FTP client
     * 
     * @example
     * const clientResult = await service.GetClient();
     * if (clientResult.statusCode === 200) {
     *   const client = clientResult.body.Data;
     *   // Use client for FTP operations
     * }
     */
    async GetClient() {
        try {
            // If we have a connected client, return it
            if (this._client && this._connected) {
                return {
                    statusCode: 200,
                    headers: defaultHeaders(),
                    body: {
                        Data: this._client,
                        Message: "Using existing FTP connection",
                    },
                };
            }

            // Create new connection
            const result = await CreateClient(
                this._config.host,
                this._config.user,
                this._config.password,
                this._config.secure,
                this._config.timeout
            );

            if (result.statusCode === 200) {
                this._client = result.body.Data;
                this._connected = true;
            }

            return result;
        } catch (error) {
            return {
                statusCode: 500,
                headers: defaultHeaders(),
                body: {
                    Code: "InternalError",
                    Message: "An error occurred while getting FTP client.",
                    Error: error.message,
                },
            };
        }
    }

    /**
     * List files in a directory on the FTP server
     * 
     * @param {string} path - Directory path to list (required)
     * @returns {Promise<Object>} Response object with file list
     * 
     * @example
     * const result = await service.GetListFiles('/uploads');
     * if (result.statusCode === 200) {
     *   const files = result.body.Data;
     *   files.forEach(file => console.log(file.name));
     * }
     * 
     * @example
     * const result = await service.GetListFiles('/');
     */
    async GetListFiles(path) {
        try {
            const clientResult = await this.GetClient();
            if (clientResult.statusCode !== 200) {
                return clientResult;
            }

            return await GET.ListFiles(this._client, path);
        } catch (error) {
            return {
                statusCode: 500,
                headers: defaultHeaders(),
                body: {
                    Code: "InternalError",
                    Message: "An error occurred while listing files.",
                    Error: error.message,
                },
            };
        }
    }

    /**
     * Download a file from the FTP server to local path
     * 
     * @param {string} localPath - Local file path to save (required)
     * @param {string} remotePath - Remote file path to download (required)
     * @returns {Promise<Object>} Response object with download result
     * 
     * @example
     * const result = await service.GetFile('./data.csv', '/uploads/data.csv');
     * if (result.statusCode === 200) {
     *   console.log('File downloaded successfully');
     * }
     * 
     * @example
     * const result = await service.GetFile('./backup.zip', '/backups/daily.zip');
     */
    async GetFile(localPath, remotePath) {
        try {
            const clientResult = await this.GetClient();
            if (clientResult.statusCode !== 200) {
                return clientResult;
            }

            return await GET.File(this._client, localPath, remotePath);
        } catch (error) {
            return {
                statusCode: 500,
                headers: defaultHeaders(),
                body: {
                    Code: "InternalError",
                    Message: "An error occurred while downloading file.",
                    Error: error.message,
                },
            };
        }
    }

    /**
     * Upload a file to the FTP server from local path
     * 
     * @param {string} localPath - Local file path to upload (required)
     * @param {string} remotePath - Remote file path to save (required)
     * @returns {Promise<Object>} Response object with upload result
     * 
     * @example
     * const result = await service.UploadFile('./data.csv', '/uploads/data.csv');
     * if (result.statusCode === 200) {
     *   console.log('File uploaded successfully');
     * }
     */
    async UploadFile(localPath, remotePath) {
        try {
            const clientResult = await this.GetClient();
            if (clientResult.statusCode !== 200) {
                return clientResult;
            }

            return await SET.File(this._client, localPath, remotePath);
        } catch (error) {
            return {
                statusCode: 500,
                headers: defaultHeaders(),
                body: {
                    Code: "InternalError",
                    Message: "An error occurred while uploading file.",
                    Error: error.message,
                },
            };
        }
    }

    /**
     * Get a readable stream of a file from the FTP server
     * Useful for processing large files without saving to disk
     * 
     * @param {string} fileName - Remote file path (required)
     * @returns {Promise<Object>} Response object with readable stream
     * 
     * @example
     * const result = await service.GetFileStream('/uploads/data.csv');
     * if (result.statusCode === 200) {
     *   const stream = result.body.Data;
     *   stream.pipe(process.stdout);
     * }
     * 
     * @example
     * const result = await service.GetFileStream('/logs/app.log');
     * const stream = result.body.Data;
     * stream.on('data', chunk => console.log(chunk.toString()));
     */
    async GetFileStream(fileName) {
        try {
            const clientResult = await this.GetClient();
            if (clientResult.statusCode !== 200) {
                return clientResult;
            }

            return await GET.GetFileStream(this._client, fileName);
        } catch (error) {
            return {
                statusCode: 500,
                headers: defaultHeaders(),
                body: {
                    Code: "InternalError",
                    Message: "An error occurred while getting file stream.",
                    Error: error.message,
                },
            };
        }
    }

    /**
     * Close the FTP connection
     * Should be called when done with FTP operations
     * 
     * @returns {Promise<Object>} Response object with close result
     * 
     * @example
     * await service.Close();
     * 
     * @example
     * const result = await service.Close();
     * if (result.statusCode === 200) {
     *   console.log('Connection closed');
     * }
     */
    async Close() {
        try {
            if (this._client) {
                this._client.close();
                this._client = null;
                this._connected = false;

                return {
                    statusCode: 200,
                    headers: defaultHeaders(),
                    body: {
                        Message: "FTP connection closed successfully",
                    },
                };
            }

            return {
                statusCode: 200,
                headers: defaultHeaders(),
                body: {
                    Message: "No active connection to close",
                },
            };
        } catch (error) {
            return {
                statusCode: 500,
                headers: defaultHeaders(),
                body: {
                    Code: "InternalError",
                    Message: "An error occurred while closing connection.",
                    Error: error.message,
                },
            };
        }
    }

    /**
     * Check if the service has an active connection
     * 
     * @returns {boolean} True if connected, false otherwise
     * 
     * @example
     * if (service.GetIsConnected()) {
     *   console.log('FTP is connected');
     * }
     */
    GetIsConnected() {
        return this._connected;
    }

    /**
     * Get the underlying FTP client (for advanced operations)
     * Use with caution - modifying client directly may affect service state
     * 
     * @returns {Object|null} FTP client object or null if not connected
     * 
     * @example
     * const client = service.GetRawClient();
     * if (client) {
     *   await client.cd('/some/directory');
     * }
     */
    GetRawClient() {
        return this._client;
    }

    /**
     * Get service configuration
     * Password is masked for security
     * 
     * @returns {Object} Configuration object with masked password
     * 
     * @example
     * const config = service.GetConfig();
     * console.log('Connected to:', config.host);
     */
    GetConfig() {
        return {
            host: this._config.host,
            user: this._config.user,
            password: '***MASKED***',
            timeout: this._config.timeout,
        };
    }

    /**
     * Get service metadata
     * 
     * @returns {Object} Service metadata
     * 
     * @example
     * const metadata = service.GetMetadata();
     * console.log('Service created:', metadata.createdAt);
     * console.log('Connected:', metadata.connected);
     */
    GetMetadata() {
        return {
            connected: this._connected,
            createdAt: this._createdAt,
            config: this.GetConfig(),
        };
    }
}

//----------------------------------------------
//  VERIFICATIONS
//----------------------------------------------

function Verification(config) {
    const Verification_config = Verifications_config(config);

    const errors = [];

    if (Verification_config.statusCode !== 200) {
        if (Array.isArray(Verification_config.body.Message)) {
            errors.push(...Verification_config.body.Message);
        } else {
            errors.push(Verification_config.body.Message);
        }
    }

    if (errors.length > 0) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: errors,
            },
        };
    }

    return {
        statusCode: 200,
        headers: defaultHeaders(),
        body: {},
    };
}

function Verifications_config(config) {
    if (!config || typeof config !== 'object') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'config' parameter is required and must be an object.",
            },
        };
    }

    const errors = [];

    if (!config.host || typeof config.host !== 'string') {
        errors.push("The 'host' parameter is required and must be a string.");
    }
    if (!config.user || typeof config.user !== 'string') {
        errors.push("The 'user' parameter is required and must be a string.");
    }
    if (!config.password || typeof config.password !== 'string') {
        errors.push("The 'password' parameter is required and must be a string.");
    }
    if (config.timeout === undefined || config.timeout === null || typeof config.timeout !== 'number') {
        errors.push("The 'timeout' parameter is required and must be a number.");
    } else if (config.timeout <= 0) {
        errors.push("The 'timeout' parameter must be greater than 0.");
    }

    if (errors.length > 0) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: errors,
            },
        };
    }

    return {
        statusCode: 200,
        headers: defaultHeaders(),
        body: {},
    };
}

//----------------------------------------------
//  DEFAULT RESPONSE HEADERS
//----------------------------------------------

function defaultHeaders() {
    return {
        "Content-Type": "application/json",
    };
}

export default FTPService;

/*
=======================================================================
                             REFERENCE
=======================================================================

* Package Documentation:
  https://www.npmjs.com/package/basic-ftp

* Purpose:
  Service class that provides a unified interface for FTP operations.
  Handles connection lifecycle, automatic reconnection, and provides
  convenient methods for common FTP operations like listing files,
  downloading files, and streaming file content.

* Use Cases:
  - Create FTP service instances with connection pooling
  - Automatically manage FTP connections
  - List files in remote directories
  - Download files from FTP server
  - Stream files without saving to disk
  - Perform multiple FTP operations with single connection

* Creating Services:
  FTPService.GetCreate(config)
  - config: { host, user, password, timeout }

* Key Methods:
  - GetClient(): Get/create FTP client connection
  - GetListFiles(path): List files in directory
  - GetFile(localPath, remotePath): Download file
  - GetFileStream(fileName): Get file as stream
  - Close(): Close FTP connection
  - GetIsConnected(): Check connection status
  - GetRawClient(): Get underlying FTP client
  - GetConfig(): Get configuration (password masked)
  - GetMetadata(): Get service metadata

* Response Format:
  All methods return:
  {
    statusCode: number,
    headers: { "Content-Type": "application/json" },
    body: {
      Data: any,           // Success data
      Code: string,        // Error code
      Message: string,     // Error message
      Error: string        // Technical error details
    }
  }

* Error Handling:
  - 400: Invalid parameters or validation errors
  - 401: Authentication failed
  - 403: Permission denied
  - 404: File or directory not found
  - 500: Internal server errors
  - 503: Cannot connect to FTP server
  - 504: Connection timeout

* Security Considerations:
  - Never expose FTP credentials in logs or responses
  - Connections are managed internally
  - Use environment variables for credentials
  - Always close connections when done
  - Password is masked in GetConfig() method
  - Implement proper error handling

* Connection Management:
  - Connection is created lazily on first operation
  - Connection is reused for multiple operations
  - Manual reconnection not required
  - Always call Close() when finished
  - Check connection status with GetIsConnected()

* Important Notes:
  - Service manages one connection at a time
  - Connection is reused across operations
  - Client automatically reconnects if needed
  - Always close connection to free resources
  - For concurrent operations, create multiple service instances
  - Stream operations require proper stream handling
  - Large files are handled efficiently by streams

=======================================================================
*/
