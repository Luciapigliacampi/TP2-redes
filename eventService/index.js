const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authorizeRole = require('./middlewares/authorizeRole');
const ROLES = require('./roles');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🎤 Event Service activo');
});

// Rutas protegidas por rol

// Crear evento - solo ORGANIZER y ADMIN
app.post('/crear-evento', authorizeRole(ROLES.ORGANIZER, ROLES.ADMIN), (req, res) => {
  res.json({ mensaje: '✅ Evento creado' });
});

// Ver programación - todos menos invitados
app.get('/ver-programacion', authorizeRole(ROLES.ASSISTANT, ROLES.SPEAKER, ROLES.ORGANIZER, ROLES.ADMIN), (req, res) => {
  res.json({ mensaje: '📅 Esta es la programación del evento' });
});

// Modificar evento - solo ORGANIZER y ADMIN
app.put('/modificar-evento', authorizeRole(ROLES.ORGANIZER, ROLES.ADMIN), (req, res) => {
  res.json({ mensaje: '✏️ Evento actualizado' });
});

// Panel admin
app.get('/admin-dashboard', authorizeRole(ROLES.ADMIN), (req, res) => {
  res.json({ mensaje: '👑 Panel completo de administración de eventos' });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`🚀 EventService corriendo en http://localhost:${PORT}`);
});