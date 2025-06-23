const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const authorizeRole = require('./middlewares/authorizeRole');
const ROLES = require('./roles');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('📝 Registration Service activo');
});

// Ruta para que los asistentes se inscriban
app.post('/inscribirse', authorizeRole(ROLES.ASSISTANT), (req, res) => {
  const { eventoId } = req.body;
  res.json({
    mensaje: `Usuario ${req.user.username} inscrito al evento ${eventoId}`,
  });
});

// Ruta para que organizadores y admins vean inscripciones
app.get('/inscripciones', authorizeRole(ROLES.ORGANIZER, ROLES.ADMIN), (req, res) => {
  res.json({
    mensaje: `Listado de inscripciones visible para ${req.user.username}`,
  });
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`🚀 RegistrationService corriendo en http://localhost:${PORT}`);
});
