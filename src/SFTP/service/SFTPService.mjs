import * as GET from '../GET/index.mjs';
import * as SET from '../SET/index.mjs';
import { CreateClient } from '../common/CreateClient.mjs';

/**
 * Service class for managing SFTP connections and operations
 * Handles connection lifecycle, automatic reconnection, and provides convenient access to SFTP operations
 * 
 * @param {Object} config - SFTP connection configuration (required)
 * @param {string} config.host - SFTP server hostname (required)
 * @param {string} config.username - SFTP username (required)
 * @param {string} config.password - SFTP password (required)
 * @param {number} config.port - SFTP port number (required)
 * @returns {Object} Service instance or error response
 * 
 * @example
 * const sftpService = SFTPService.GetCreate({
 *   host: 'sftp.example.com',
 *   username: 'sftpuser',
 *   password: 'sftppass',
 *   port: 22
 * });
 * 
 * @example
 * const client = await sftpService.GetClient();
 * 
 * @example
 * const files = await sftpService.GetFileNamesFromPath('/uploads');
 * 
 * @example
 * const file = await sftpService.GetFile('/remote.txt', './local.txt');
 * 
 * @example
 * const upload = await sftpService.SetUploadFile('./local.txt', '/remote.txt');
 * 
 * @example
 * await sftpService.Close();
 */

export class SFTPService {
    /**
     * Private constructor - use SFTPService.GetCreate() instead
     * @private
     */
    constructor(config) {
        this._config = config;
        this._client = null;
        this._connected = false;
        this._createdAt = new Date().toISOString();
    }

    /**
     * Create a new SFTPService instance with connection configuration
     * 
     * @param {Object} config - SFTP connection configuration (required)
     * @param {string} config.host - SFTP server hostname (required)
     * @param {string} config.username - SFTP username (required)
     * @param {string} config.password - SFTP password (required)
     * @param {number} config.port - SFTP port number (required)
     * @returns {Object} Service instance or error response
     * 
     * @example
     * const service = SFTPService.GetCreate({
     *   host: 'sftp.example.com',
     *   username: 'admin',
     *   password: 'password123',
     *   port: 22
     * });
     * 
     * @example
     * const service = SFTPService.GetCreate({
     *   host: '192.168.1.100',
     *   username: 'sftpuser',
     *   password: 'secret',
     *   port: 2222
     * });
     */
    static GetCreate(config) {
        try {
            const Verifications = Verification(config);
            if (Verifications.statusCode !== 200) {
                return Verifications;
            }

            return new SFTPService(config);
        } catch (error) {
            return {
                statusCode: 500,
                headers: defaultHeaders(),
                body: {
                    Code: "InternalError",
                    Message: "An error occurred while creating the SFTP service.",
                    Error: error.message,
                },
            };
        }
    }

    /**
     * Get SFTP client connection, creating one if it doesn't exist
     * Automatically handles reconnection if connection is lost
     * 
     * @returns {Promise<Object>} Response object with SFTP client
     * 
     * @example
     * const clientResult = await service.GetClient();
     * if (clientResult.statusCode === 200) {
     *   const client = clientResult.body.Data;
     *   // Use client for SFTP operations
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
                        Message: "Using existing SFTP connection",
                    },
                };
            }

            // Create new connection
            const result = await CreateClient(
                this._config.host,
                this._config.username,
                this._config.password,
                this._config.port
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
                    Message: "An error occurred while getting SFTP client.",
                    Error: error.message,
                },
            };
        }
    }

    /**
     * List file names in a directory on the SFTP server
     * 
     * @param {string} path - Directory path to list (required)
     * @returns {Promise<Object>} Response object with file names list
     * 
     * @example
     * const result = await service.GetFileNamesFromPath('/uploads');
     * if (result.statusCode === 200) {
     *   const files = result.body.Data;
     *   files.forEach(file => console.log(file));
     * }
     * 
     * @example
     * const result = await service.GetFileNamesFromPath('/');
     */
    async GetFileNamesFromPath(path) {
        try {
            const clientResult = await this.GetClient();
            if (clientResult.statusCode !== 200) {
                return clientResult;
            }

            return await GET.FileNamesFromPath(this._client, path);
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
     * Download a file from the SFTP server to local path
     * 
     * @param {string} remotePath - Remote file path to download (required)
     * @param {string} localPath - Local file path to save (required)
     * @returns {Promise<Object>} Response object with download result
     * 
     * @example
     * const result = await service.GetFile('/uploads/data.csv', './data.csv');
     * if (result.statusCode === 200) {
     *   console.log('File downloaded successfully');
     * }
     * 
     * @example
     * const result = await service.GetFile('/backups/daily.zip', './backup.zip');
     */
    async GetFile(remotePath, localPath) {
        try {
            const clientResult = await this.GetClient();
            if (clientResult.statusCode !== 200) {
                return clientResult;
            }

            return await GET.File(this._client, remotePath, localPath);
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
     * Upload a file from local path to the SFTP server
     * 
     * @param {string} localPath - Local file path to upload (required)
     * @param {string} remotePath - Remote file path on server (required)
     * @returns {Promise<Object>} Response object with upload result
     * 
     * @example
     * const result = await service.SetUploadFile('./data.csv', '/uploads/data.csv');
     * if (result.statusCode === 200) {
     *   console.log('File uploaded successfully');
     * }
     * 
     * @example
     * const result = await service.SetUploadFile('./backup.zip', '/backups/daily.zip');
     */
    async SetUploadFile(localPath, remotePath) {
        try {
            const clientResult = await this.GetClient();
            if (clientResult.statusCode !== 200) {
                return clientResult;
            }

            return await SET.UploadFile(this._client, localPath, remotePath);
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
     * Delete a file from the SFTP server
     * 
     * @param {string} remotePath - Remote file path to delete (required)
     * @returns {Promise<Object>} Response object with delete result
     * 
     * @example
     * const result = await service.SetDeleteFile('/uploads/old-file.csv');
     * if (result.statusCode === 200) {
     *   console.log('File deleted successfully');
     * }
     * 
     * @example
     * const result = await service.SetDeleteFile('/temp/cache.tmp');
     */
    async SetDeleteFile(remotePath) {
        try {
            const clientResult = await this.GetClient();
            if (clientResult.statusCode !== 200) {
                return clientResult;
            }

            return await SET.DeleteFile(this._client, remotePath);
        } catch (error) {
            return {
                statusCode: 500,
                headers: defaultHeaders(),
                body: {
                    Code: "InternalError",
                    Message: "An error occurred while deleting file.",
                    Error: error.message,
                },
            };
        }
    }

    /**
     * Move or rename a file on the SFTP server
     * 
     * @param {string} oldPath - Current file path (required)
     * @param {string} newPath - New file path (required)
     * @returns {Promise<Object>} Response object with move result
     * 
     * @example
     * const result = await service.SetMoveFile('/uploads/old.csv', '/archive/old.csv');
     * if (result.statusCode === 200) {
     *   console.log('File moved successfully');
     * }
     * 
     * @example
     * const result = await service.SetMoveFile('/data.txt', '/renamed-data.txt');
     */
    async SetMoveFile(oldPath, newPath) {
        try {
            const clientResult = await this.GetClient();
            if (clientResult.statusCode !== 200) {
                return clientResult;
            }

            return await SET.MoveFile(this._client, oldPath, newPath);
        } catch (error) {
            return {
                statusCode: 500,
                headers: defaultHeaders(),
                body: {
                    Code: "InternalError",
                    Message: "An error occurred while moving file.",
                    Error: error.message,
                },
            };
        }
    }

    /**
     * Close the SFTP connection
     * Should be called when done with SFTP operations
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
                await this._client.end();
                this._client = null;
                this._connected = false;

                return {
                    statusCode: 200,
                    headers: defaultHeaders(),
                    body: {
                        Message: "SFTP connection closed successfully",
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
     *   console.log('SFTP is connected');
     * }
     */
    GetIsConnected() {
        return this._connected;
    }

    /**
     * Get the underlying SFTP client (for advanced operations)
     * Use with caution - modifying client directly may affect service state
     * 
     * @returns {Object|null} SFTP client object or null if not connected
     * 
     * @example
     * const client = service.GetRawClient();
     * if (client) {
     *   await client.mkdir('/some/directory');
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
            username: this._config.username,
            password: '***MASKED***',
            port: this._config.port,
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
    if (!config.username || typeof config.username !== 'string') {
        errors.push("The 'username' parameter is required and must be a string.");
    }
    if (!config.password || typeof config.password !== 'string') {
        errors.push("The 'password' parameter is required and must be a string.");
    }
    if (config.port === undefined || config.port === null || typeof config.port !== 'number') {
        errors.push("The 'port' parameter is required and must be a number.");
    } else if (config.port <= 0 || config.port > 65535) {
        errors.push("The 'port' parameter must be between 1 and 65535.");
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

export default SFTPService;

/*
=======================================================================
                             REFERENCE
=======================================================================

* Package Documentation:
  https://www.npmjs.com/package/ssh2-sftp-client

* Purpose:
  Service class that provides a unified interface for SFTP operations.
  Handles connection lifecycle, automatic reconnection, and provides
  convenient methods for common SFTP operations like listing files,
  downloading files, uploading files, deleting files, and moving files.

* Use Cases:
  - Create SFTP service instances with connection management
  - Automatically manage SFTP connections
  - List files in remote directories
  - Download files from SFTP server
  - Upload files to SFTP server
  - Delete files on SFTP server
  - Move/rename files on SFTP server
  - Perform multiple SFTP operations with single connection

* Creating Services:
  SFTPService.GetCreate(config)
  - config: { host, username, password, port }

* Key Methods:
  - GetClient(): Get/create SFTP client connection
  - GetFileNamesFromPath(path): List file names in directory
  - GetFile(remotePath, localPath): Download file
  - SetUploadFile(localPath, remotePath): Upload file
  - SetDeleteFile(remotePath): Delete file
  - SetMoveFile(oldPath, newPath): Move/rename file
  - Close(): Close SFTP connection
  - GetIsConnected(): Check connection status
  - GetRawClient(): Get underlying SFTP client
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
  - 503: Cannot connect to SFTP server
  - 504: Connection timeout

* Security Considerations:
  - Never expose SFTP credentials in logs or responses
  - Connections are managed internally
  - Use environment variables for credentials
  - Always close connections when done
  - Password is masked in GetConfig() method
  - Implement proper error handling
  - SFTP uses SSH protocol (encrypted by default)

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
  - SFTP default port is 22 (SSH standard)
  - All file operations are asynchronous

* Differences from FTP:
  - SFTP uses SSH protocol (encrypted)
  - FTP uses plain text (unless FTPS)
  - SFTP default port: 22
  - FTP default port: 21
  - SFTP requires SSH authentication
  - SFTP is generally more secure

=======================================================================
*/