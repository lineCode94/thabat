const iconv = require('iconv-lite');
const str = 'Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø£ÙˆÙ„';
const buf = iconv.encode(str, 'win1252');
console.log(iconv.decode(buf, 'utf8'));
