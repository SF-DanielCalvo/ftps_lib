/**
 * Upload a file to the FTP server from a local path
 * 
 * @param {Object} ftpClient - FTP Client object from StartConnection (required)
 * @param {string} localPath - Local file path of the file to be uploaded (required)
 * @param {string} remotePath - Remote file path on the FTP server where the file will be saved (required)
 * @returns {Promise<Object>} Response object with upload result
 * 
 * @example
 * const result = await UploadFile(ftpClient, './data.csv', '/uploads/data.csv');
 * if (result.statusCode === 200) {
 *   console.log('File uploaded successfully');
 * }
 */
export async function UploadFile(ftpClient, localPath, remotePath) {
    try {
        const Verifications = Verification(ftpClient, localPath, remotePath)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_UploadFile(ftpClient, localPath, remotePath)

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
 * Uploads file to FTP server from local file system
 * 
 * @param {Object} ftpClient - FTP Client object
 * @param {string} localPath - Local file path
 * @param {string} remotePath - Remote file path
 * @returns {Object} Response object with upload result
 */
async function Call_UploadFile(ftpClient, localPath, remotePath) {
    let httpStatusCode
    let body

    try {
        const result = await ftpClient.uploadFrom(localPath, remotePath);

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
                Message: "Cannot connect to FTP server",
            }
        } else if (e.code === 'ETIMEDOUT') {
            httpStatusCode = 504
            body = {
                Code: e.code,
                Message: "FTP request timed out",
            }
        } else if (e.code === 550) {
            httpStatusCode = 403
            body = {
                Code: "PermissionDenied",
                Message: `Permission denied or path invalid: ${remotePath}`,
            }
        } else if (e.code === 'ENOENT') {
            httpStatusCode = 404
            body = {
                Code: e.code,
                Message: `Local file does not exist: ${localPath}`,
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
        "Access-Control-Allow-Methods": "POST,OPTIONS",
    }
}
