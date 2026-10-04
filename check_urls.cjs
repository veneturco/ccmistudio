const https = require('https');
const options = {
  hostname: 'ccmistudio.onrender.com',
  port: 443,
  path: '/templates/orden_lab_p1_bg.jpg',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};
https.get(options, (res) => {
  console.log('statusCode:', res.statusCode);
});