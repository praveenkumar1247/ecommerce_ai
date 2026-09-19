const fs = require('fs');
const path = require('path');

/**
 * Safely deletes a file from the uploads directory given its public URL/path
 * Example path: /uploads/products/apex-pro-headphones-1.svg
 */
const deleteFileByUrl = (fileUrl) => {
  if (!fileUrl) return;
  try {
    // Strip leading slash
    const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    const fullPath = path.join(__dirname, '../../', relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted file: ${fullPath}`);
    }
  } catch (error) {
    console.error(`Failed to delete file for url: ${fileUrl}`, error.message);
  }
};

module.exports = {
  deleteFileByUrl,
};
