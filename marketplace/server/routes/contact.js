const express = require('express');
const router = express.Router();
const { add, getAll } = require('../database/db');
const { optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Los campos nombre, email y mensaje son requeridos'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del email es inválido'
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje debe tener al menos 10 caracteres'
      });
    }

    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject ? subject.trim() : '',
      message: message.trim(),
      status: 'pending',
      userId: req.user ? req.user.id : null
    };

    const contact = await add('contacts', contactData);

    res.status(201).json({
      success: true,
      message: 'Mensaje de contacto enviado exitosamente',
      data: contact
    });
  } catch (error) {
    console.error('Error al enviar mensaje de contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el mensaje'
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const contacts = await getAll('contacts');
    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error('Error al obtener contactos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los contactos'
    });
  }
});

module.exports = router;