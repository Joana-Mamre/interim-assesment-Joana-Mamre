const mongoose = require('mongoose');
const cryptoSchema = new mongoose.Schema({
  name: String,
  symbol: String,
  price: Number,
  image: String,
  change24h: Number,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Crypto', cryptoSchema);