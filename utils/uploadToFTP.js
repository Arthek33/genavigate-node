const { FTPClient } = require('basic-ftp');

const uploadToFTP = async (buffer, filename, pathOnHostinger) => {
  const client = new FTPClient();
  try {
    await client.access({
      host: process.env.HOSTINGER_FTP_HOST,
      user: process.env.HOSTINGER_FTP_USER,
      password: process.env.HOSTINGER_FTP_PASSWORD,
      secure: true,
    });
    await client.uploadFrom(buffer, `${pathOnHostinger}/${filename}`);
    return `https://${process.env.HOSTINGER_DOMAIN}/${pathOnHostinger}/${filename}`;
  } catch (error) {
    console.error('FTP Upload Error:', error);
    throw new Error('Failed to upload image');
  } finally {
    client.close();
  }
};

module.exports = uploadToFTP;
