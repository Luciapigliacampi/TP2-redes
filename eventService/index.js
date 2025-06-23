const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const authorizeRole = require('./middlewares/authorizeRole');
const authenticateJWT = require('./middlewares/authenticateJWT'); // ✅ Middleware que valida JWT
const ROLES = require('./roles');
const Event = require('./models/Event');

const app = express();
app.use(cors());
app.use(express.json());

// 📦 Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

// ✅ Ruta de prueba simple
app.get('/', (req, res) => {
  res.send('🎤 Event Service activo');
});

// ==========================
// 📅 ENDPOINTS DE EVENTOS
// ==========================

// Crear evento - solo organizadores y admin
app.post('/events', authenticateJWT, authorizeRole(['organizador', 'administrador']), async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(400).json({ error: 'Error al crear evento', details: err.message });
  }
});

// Obtener todos los eventos - público general
app.get('/events', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
});

// Obtener un evento por ID
app.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener evento' });
  }
});

// Editar evento - solo organizadores y admin
app.put('/events/:id', authenticateJWT, authorizeRole(['organizador', 'administrador']), async (req, res) => {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Error al actualizar evento', details: err.message });
  }
});

// Eliminar evento - solo admin
app.delete('/events/:id', authenticateJWT, authorizeRole(['administrador']), async (req, res) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json({ message: 'Evento eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
});

// ==========================
// 🔐 RUTAS DE PRUEBA DE ROLES
// ==========================

// Crear evento (solo ORGANIZER y ADMIN)
app.post('/crear-evento', authenticateJWT, authorizeRole([ROLES.ORGANIZER, ROLES.ADMIN]), (req, res) => {
  res.json({ mensaje: '✅ Evento creado (ruta de prueba)' });
});

// Ver programación (todos menos invitados)
app.get('/ver-programacion', authenticateJWT, authorizeRole([ROLES.ASSISTANT, ROLES.SPEAKER, ROLES.ORGANIZER, ROLES.ADMIN]), (req, res) => {
  res.json({ mensaje: '📅 Esta es la programación del evento (ruta de prueba)' });
});

// Mod

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`🚀 EventService corriendo en http://localhost:${PORT}`);
});