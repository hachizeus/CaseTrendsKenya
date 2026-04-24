import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';

(async () => {
  try {
    // Optimize JPEG and PNG images
    await imagemin(['public/**/*.{jpg,png}'], {
      destination: 'public/optimized',
      plugins: [
        imageminMozjpeg({ quality: 75 }),
        imageminPngquant({ quality: [0.6, 0.8] }),
      ],
    });

    // Convert images to WebP format
    await imagemin(['public/**/*.{jpg,png}'], {
      destination: 'public/optimized',
      plugins: [imageminWebp({ quality: 75 })],
    });

    console.log('Images optimized and converted to WebP format!');
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
})();