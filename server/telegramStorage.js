const fs = require('fs');
const axios = require('axios');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

// HTTPS Agent dipaksa menggunakan IPv4 (family: 4) dan Keep-Alive untuk performa super cepat & menghindari TLS disconnect
const httpsAgent = new https.Agent({
  keepAlive: true,
  family: 4
});

/**
 * Upload sebuah file dari lokal ke Telegram Private Channel menggunakan Axios.
 * @param {string} filePath - Path lokal file
 * @param {string} fileName - Nama file
 * @returns {Promise<string>} telegramFileId
 */
async function uploadFileToTelegram(filePath, fileName, retries = 5) {
  const channelId = process.env.STORAGE_CHANNEL_ID;
  if (!channelId) {
    throw new Error('STORAGE_CHANNEL_ID belum diset di .env');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const form = new FormData();
      form.append('chat_id', channelId);
      form.append('document', fs.createReadStream(filePath), {
        filename: fileName,
        contentType: 'application/octet-stream'
      });
      form.append('caption', `📦 File Account: ${fileName}\n📅 Date: ${new Date().toISOString()}`);

      const res = await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendDocument`,
        form,
        {
          headers: form.getHeaders(),
          httpsAgent,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      if (!res.data || !res.data.ok) {
        throw new Error('Gagal mengunggah file ke Telegram: ' + JSON.stringify(res.data));
      }

      const telegramFileId = res.data.result.document.file_id;
      console.log(`✅ Telegram Storage Upload: ${fileName} → File ID: ${telegramFileId}`);
      return telegramFileId;
    } catch (err) {
      const errorMsg = err.response?.data?.description || err.message;
      if (errorMsg.includes('429') || errorMsg.includes('too many requests')) {
        const match = errorMsg.match(/retry after (\d+)/i);
        const waitSeconds = match ? parseInt(match[1]) : 10;
        console.log(`⏳ Limit Telegram (429) untuk ${fileName}. Menunggu ${waitSeconds} detik (Percobaan ${attempt}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, (waitSeconds + 1) * 1000));
      } else {
        throw new Error(errorMsg);
      }
    }
  }
  throw new Error(`Gagal upload ${fileName} setelah ${retries} percobaan karena limit Telegram.`);
}

/**
 * Mendownload file dari Telegram menggunakan Axios (dipaksa IPv4) berdasarkan file_id, simpan ke lokal.
 * @param {string} fileId - Telegram file_id
 * @param {string} destPath - Path tujuan untuk menyimpan file lokal
 * @returns {Promise<void>}
 */
async function downloadFileFromTelegram(fileId, destPath) {
  // Cek apakah file ada di cache lokal
  const localCachePath = path.join(__dirname, '../storage/accounts/', fileId);
  if (fs.existsSync(localCachePath)) {
    console.log(`⚡ Cache hit: ${fileId} found locally!`);
    fs.copyFileSync(localCachePath, destPath);
    return;
  }

  // Dapatkan URL file dari API Telegram menggunakan Axios (dipaksa IPv4 agar tidak hang)
  const getFileRes = await axios({
    method: 'GET',
    url: `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile`,
    params: { file_id: fileId },
    httpsAgent
  });

  if (!getFileRes.data || !getFileRes.data.ok) {
    throw new Error('Gagal mendapatkan informasi file dari Telegram: ' + JSON.stringify(getFileRes.data));
  }

  const filePath = getFileRes.data.result.file_path;
  const fileLink = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`;
  
  // Download file menggunakan Axios
  const response = await axios({
    method: 'GET',
    url: fileLink,
    responseType: 'stream',
    httpsAgent
  });

  return new Promise((resolve, reject) => {
    const dest = fs.createWriteStream(destPath);
    response.data.pipe(dest);
    
    dest.on('finish', () => {
      // Simpan salinan ke cache lokal agar ke depannya instan
      try {
        const localAccountsDir = path.dirname(localCachePath);
        if (!fs.existsSync(localAccountsDir)) {
          fs.mkdirSync(localAccountsDir, { recursive: true });
        }
        fs.copyFileSync(destPath, localCachePath);
      } catch (_) {}
      resolve();
    });
    dest.on('error', (err) => reject(err));
    response.data.on('error', (err) => reject(err));
  });
}

module.exports = {
  uploadFileToTelegram,
  downloadFileFromTelegram,
};
