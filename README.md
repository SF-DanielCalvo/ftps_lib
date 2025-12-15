# ftps_lib

FTP and SFTP client library with service classes.

## Installation

```bash
npm install github:yourusername/ftps_lib
```

## Features

- FTP operations
- SFTP operations
- Service classes for connection management

## Usage

```javascript
import { ftp, sftp, SFTPService_Class, FTPService_Class } from 'ftps_lib'

// Direct operations
await ftp.upload(file)
await sftp.download(file)

// Using service classes
const sftpService = new SFTPService_Class(config)
await sftpService.connect()
```

## License

ISC
