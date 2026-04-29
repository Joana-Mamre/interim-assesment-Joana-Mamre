const Crypto = require('../models/Crypto');

exports.getAll = async (req, res) => {
  const cryptos = await Crypto.find();
  res.json(cryptos);
};

exports.getGainers = async (req, res) => {
  const gainers = await Crypto.find().sort({ change24h: -1 });
  res.json(gainers);
};

exports.getNew = async (req, res) => {
  const newListings = await Crypto.find().sort({ createdAt: -1 });
  res.json(newListings);
};

exports.addCrypto = async (req, res) => {
  try {
    const crypto = await Crypto.create(req.body);
    res.status(201).json({ message: 'Crypto added', crypto });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};