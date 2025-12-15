import { PassThrough } from 'stream';

/**
 * Get a readable stream of a file from the FTP server
 * 
 * @param {Object} ftpClient - FTP Client object from StartConnection (required)
 * @param {string} fileName - Remote file path to download (required)
 * @returns {Promise<Object>} Response object with file stream
 * 
 * @example
 * const result = await GetFileStream(ftpClient, '/uploads/data.csv');
 * if (result.statusCode === 200) {
 *   const stream = result.body.Data;
 *   stream.pipe(process.stdout); // or pipe to another destination
 * }
 */
export async function GetFileStream(ftpClient, fileName) {
    try {
        const Verifications = Verification(ftpClient, fileName)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_GetFileStream(ftpClient, fileName)

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
//  FUNCTION: Get File Stream
//----------------------------------------------
/**
 * Downloads file from FTP server as a stream
 * 
 * @param {Object} ftpClient - FTP Client object
 * @param {string} fileName - Remote file path
 * @returns {Object} Response object with file stream
 */
async function Call_GetFileStream(ftpClient, fileName) {
    let httpStatusCode
    let body

    try {
        const passThrough = new PassThrough();
        await ftpClient.downloadTo(passThrough, fileName, 0);

        httpStatusCode = 200
        body = {
            Data: passThrough,
            Message: "File stream obtained successfully",
        }
    } catch (e) {
        console.error("Error getting file stream:", e)
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
                Message: `File not found: ${fileName}`,
            }
        } else {
            body = {
                Code: e.code || 'Error',
                Message: e.message || "Failed to get file stream",
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
 * @param {string} fileName - File name to validate
 * @returns {Object} Validation result with statusCode and body
 */
function Verification(ftpClient, fileName) {
    const Verification_ftpClient = Verifications_ftpClient(ftpClient)
    const Verification_fileName = Verifications_fileName(fileName)

    const errors = []

    if (Verification_ftpClient.statusCode !== 200) {
        errors.push(Verification_ftpClient.body.Message)
    }
    if (Verification_fileName.statusCode !== 200) {
        errors.push(Verification_fileName.body.Message)
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
 * Validates the fileName parameter
 * 
 * @param {string} fileName - File name to validate
 * @returns {Object} Validation result
 */
function Verifications_fileName(fileName) {
    if (!fileName || typeof fileName !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'fileName' parameter is required.",
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
  Downloads a file from an FTP server as a readable stream for
  processing without saving to disk.

* Use Cases:
  - Stream large files to avoid memory issues
  - Process file content on-the-fly
  - Pipe data directly to another service or API
  - Parse CSV/JSON files without intermediate storage
  - Upload to cloud storage (S3, Azure Blob, etc.)

* Function:
  GetFileStream(ftpClient, fileName)
  - ftpClient: FTP Client object from StartConnection
  - fileName: Remote file path (e.g., '/uploads/data.csv')

* Response Structure:
  {
    "Data": <PassThrough Stream>,
    "Message": "File stream obtained successfully"
  }

* Stream Object:
  The returned stream is a Node.js PassThrough stream that can be:
  - Piped to other streams (e.g., fs.createWriteStream)
  - Read with event listeners ('data', 'end', 'error')
  - Passed to stream processing libraries
  - Used with stream.pipeline for complex workflows

* Error Handling:
  - 400: Invalid parameters (missing ftpClient or fileName)
  - 404: File not found (FTP error 550)
  - 500: General FTP error or stream error
  - 503: Cannot connect to FTP server
  - 504: Request timeout

* Example Usage:
  
  1. Basic stream to file:
  ```javascript
  import fs from 'fs';
  import { StartConnection } from '../common/StartConnection.mjs';
  import { GetFileStream } from './FileStream.mjs';
  
  const connResult = await StartConnection(host, user, password, 30);
  const ftpClient = connResult.body.Data;
  
  const result = await GetFileStream(ftpClient, '/uploads/data.csv');
  
  if (result.statusCode === 200) {
    const stream = result.body.Data;
    const writeStream = fs.createWriteStream('./local-data.csv');
    stream.pipe(writeStream);
    
    writeStream.on('finish', () => {
      console.log('File downloaded successfully');
      ftpClient.close();
    });
  }
  ```
  
  2. Process stream data:
  ```javascript
  const result = await GetFileStream(ftpClient, '/data/logs.txt');
  
  if (result.statusCode === 200) {
    const stream = result.body.Data;
    let data = '';
    
    stream.on('data', (chunk) => {
      data += chunk.toString();
    });
    
    stream.on('end', () => {
      console.log('Total data:', data.length, 'bytes');
      ftpClient.close();
    });
    
    stream.on('error', (err) => {
      console.error('Stream error:', err);
    });
  }
  ```
  
  3. Upload to S3:
  ```javascript
  import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
  
  const s3Client = new S3Client({ region: 'us-east-1' });
  const result = await GetFileStream(ftpClient, '/uploads/report.pdf');
  
  if (result.statusCode === 200) {
    const stream = result.body.Data;
    
    const uploadParams = {
      Bucket: 'my-bucket',
      Key: 'reports/report.pdf',
      Body: stream,
    };
    
    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log('Uploaded to S3');
    ftpClient.close();
  }
  ```
  
  4. Parse CSV on-the-fly:
  ```javascript
  import { parse } from 'csv-parse';
  
  const result = await GetFileStream(ftpClient, '/data/export.csv');
  
  if (result.statusCode === 200) {
    const stream = result.body.Data;
    const parser = parse({ columns: true });
    
    stream.pipe(parser);
    
    parser.on('data', (row) => {
      console.log('Row:', row);
    });
    
    parser.on('end', () => {
      console.log('CSV parsing complete');
      ftpClient.close();
    });
  }
  ```

* Performance Notes:
  - Streams are memory-efficient for large files
  - Download starts at byte offset 0
  - PassThrough stream allows multiple pipes
  - Consider implementing backpressure handling for high-volume data
  - Stream remains open until explicitly closed or error occurs

* Important:
  - Always handle stream errors to prevent crashes
  - Close FTP connection when stream processing is complete
  - For large files, streams are preferable to loading entire file in memory
  - Stream may be consumed only once unless using PassThrough to multiple destinations

=======================================================================
*/
