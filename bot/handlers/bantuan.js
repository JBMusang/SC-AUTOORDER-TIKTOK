const { escapeHTML, editMain } = require('../utils');
const storeName = process.env.STORE_NAME || 'PanzzStore';

async function handleBantuan(bot, chatId, messageId) {
  const adminUsername = process.env.ADMIN_USERNAME || 'panzzstore_admin';

  const text = `🆘 <b>Pusat Informasi & FAQ ${escapeHTML(storeName)}</b>

💬 <b>Pertanyaan Umum (FAQ):</b>

📌 <b>Q: Apa bedanya Akun Muda & Akun Tua?</b>
💡 <i>A: Akun muda adalah akun fresh yang baru dibuat. Akun tua adalah akun berumur yang lebih tahan terhadap pembatasan/limit.</i>

📌 <b>Q: Bagaimana dengan sistem Garansi?</b>
💡 <i>A: Akun bergaransi mendapatkan proteksi klaim jika akun dinonaktifkan secara sepihak dalam masa garansi aktif.</i>

📌 <b>Q: Berapa lama akun terkirim?</b>
💡 <i>A: Sistem kami 100% otomatis. Akun akan terkirim instan dalam waktu 1-3 detik setelah transaksi Anda dikonfirmasi.</i>

---
📞 <i>Butuh bantuan lebih lanjut? Hubungi Admin kami langsung:</i> @${escapeHTML(adminUsername)}`;

  const keyboard = {
    inline_keyboard: [
      [{ text: '📞 Hubungi Admin', url: `https://t.me/${adminUsername}` }],
      [{ text: '🔙 Menu Utama',   callback_data: 'back_menu' }],
    ],
  };

  await editMain(bot, chatId, text, keyboard, messageId);
}

module.exports = { handleBantuan };
