const axios = require('axios');
const fs = require('fs');

async function download() {
  try {
    const url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_QRIS.svg/512px-Logo_QRIS.svg.png';
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    response.data.pipe(fs.createWriteStream('assets/qris_logo.png'));
    
    return new Promise((resolve, reject) => {
      response.data.on('end', () => {
        console.log('Download complete');
        resolve();
      });
      response.data.on('error', err => {
        reject(err);
      });
    });
  } catch (err) {
    console.error('Error downloading:', err.message);
  }
}

download();
