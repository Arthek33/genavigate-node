const ftp = require('basic-ftp');
const { Readable } = require('stream');

const uploadToFTP = async (buffer, filename, pathOnHostinger) => {
  const client = new ftp.Client();
  client.timeout = 30000; // Increase timeout
  // client.ftp.verbose = true;

  try {
    await client.access({
      host: process.env.HOSTINGER_FTP_HOST, // Use IP address
      port: process.env.HOSTINGER_FTP_PORT, // Explicitly set the port
      user: process.env.HOSTINGER_FTP_USER,
      password: process.env.HOSTINGER_FTP_PASSWORD,
      secure: false, // For FTPS
    });
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    await client.uploadFrom(bufferStream, `${pathOnHostinger}/${filename}`);
    return `https://${process.env.HOSTINGER_DOMAIN}/${pathOnHostinger}/${filename}`;
  } catch (error) {
    console.error('FTP Upload Error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  } finally {
    client.close();
  }
};

module.exports = uploadToFTP;
