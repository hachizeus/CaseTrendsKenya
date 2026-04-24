const fs = require('fs');
const path = require('path');

const optimizeImages = (directory) => {
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      optimizeImages(filePath);
    } else if (stats.isFile() && file.match(/\.(jpg|jpeg|png)$/i)) {
      const optimizedPath = path.join(directory, 'optimized', file);
      fs.renameSync(filePath, optimizedPath);
      console.log(`Optimized: ${filePath} -> ${optimizedPath}`);
    }
  });
};

const updateDatabasePaths = () => {
  // Mock database update logic
  console.log('Updating database paths...');
  // Replace this with actual database update queries
};

const main = () => {
  const imageDirectory = path.join(__dirname, '../public/images');

  if (!fs.existsSync(path.join(imageDirectory, 'optimized'))){
    fs.mkdirSync(path.join(imageDirectory, 'optimized'));
  }

  optimizeImages(imageDirectory);
  updateDatabasePaths();
};

main();