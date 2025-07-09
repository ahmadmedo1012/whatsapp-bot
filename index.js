const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // ✅ هذا هو المهم
app.use(express.json());

let sock;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { qr, connection } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log('✅ تم الاتصال بواتساب بنجاح');
    }
  });
}

startBot();

app.post('/send-order', async (req, res) => {
  const { username, amount, service } = req.body;

  if (!username || !amount) {
    return res.status(400).json({ message: 'بيانات ناقصة' });
  }

  const message = `🧾 طلب جديد:\n\n🕹️ الخدمة: ${service || "غير محددة"}\n🧑‍💻 الايدي / اسم المستخدم: ${username}\n💳 القيمة: ${amount} دينار\n\n📍 الطلب أُرسل تلقائيًا من الموقع.`;

  try {
    await sock.sendMessage("218910089975@s.whatsapp.net", { text: message });
    res.status(200).json({ message: "✅ تم إرسال الطلب بنجاح إلى واتسابك." });
  } catch (err) {
    console.error("❌ فشل الإرسال:", err);
    res.status(500).json({ message: "فشل في إرسال الطلب." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
});