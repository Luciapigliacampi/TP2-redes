// index.js
const express = require('express');
const mongoose = require('mongoose');
const basicAuth = require('basic-auth');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const User = require('./models/User');
const ROLES = require('./roles');
const authorizeRole = require('./middlewares/authorizeRole');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error en conexión a MongoDB:', err));

// Middleware de Basic Auth
function authBasic(req, res, next) {
  const credentials = basicAuth(req);
  if (!credentials || !credentials.name || !credentials.pass) {
    return res.status(401).json({ error: 'Credenciales inválidas (Basic Auth)' });
  }
  req.auth = credentials;
  next();
}

// Ruta: Registro
app.post('/register', authBasic, async (req, res) => {
  const { name: username, pass: password } = req.auth;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Usuario ya existe' });

    const secret = speakeasy.generateSecret({ name: `AuthApp (${username})` });

    const { role } = req.body;

    const newUser = new User({
      username,
      password,
      role: role,
      totpSecret: secret.base32,
    });

    await newUser.save();

    const qrImage = await qrcode.toDataURL(secret.otpauth_url);

    res.status(201).json({
      message: 'Usuario registrado',
      totpSecret: secret.base32,
      qrCode: qrImage,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en el registro' });
  }
});

// Ruta: Verificar TOTP y emitir JWT
app.post('/verify-totp', authBasic, async (req, res) => {
  const { name: username } = req.auth;
  const { token } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const verified = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token,
  });

  if (!verified) return res.status(401).json({ error: 'Código TOTP inválido' });

  const payload = { id: user._id, username: user.username, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '24h' });

  res.json({
    message: 'TOTP válido',
    accessToken,
    refreshToken,
  });
});

// Ruta: refresh
app.post('/refresh', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ error: 'Falta token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const newToken = jwt.sign({
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ accessToken: newToken });
  } catch (err) {
    res.status(403).json({ error: 'Refresh token inválido o expirado' });
  }
});

// Ruta protegida de prueba
app.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token no enviado' });

  const token = authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user });
  } catch (err) {
    res.status(403).json({ error: 'Token inválido o expirado' });
  }
});

app.get('/ver-programacion', authorizeRole(ROLES.ASSISTANT, ROLES.SPEAKER, ROLES.ORGANIZER, ROLES.ADMIN), (req, res) => {
  res.json({ mensaje: 'Acceso a programación' });
});

app.post('/inscribirse', authorizeRole(ROLES.ASSISTANT), (req, res) => {
  res.json({ mensaje: 'Te inscribiste correctamente' });
});

app.post('/crear-evento', authorizeRole(ROLES.ORGANIZER, ROLES.ADMIN), (req, res) => {
  res.json({ mensaje: 'Evento creado' });
});

app.put('/modificar-agenda', authorizeRole(ROLES.ORGANIZER, ROLES.ADMIN), (req, res) => {
  res.json({ mensaje: 'Agenda modificada' });
});

app.get('/mi-charla', authorizeRole(ROLES.SPEAKER), (req, res) => {
  res.json({ mensaje: 'Estas son tus presentaciones' });
});

app.get('/admin-dashboard', authorizeRole(ROLES.ADMIN), (req, res) => {
  res.json({ mensaje: 'Panel completo de administrador' });
});

app.listen(PORT, () => {
  console.log(`✅ AuthService corriendo en http://localhost:${PORT}`);
});
