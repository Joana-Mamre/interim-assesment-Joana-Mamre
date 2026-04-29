const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://your-frontend-url.com', credentials: true }));

mongoose.connect(process.env.MONGO_URI).then(() => console.log('DB connected'));

app.use('/auth', require('./routes/authRoutes'));
app.use('/profile', require('./routes/userRoutes'));
app.use('/crypto', require('./routes/cryptoRoutes'));

app.listen(3000, () => console.log('Server running'));