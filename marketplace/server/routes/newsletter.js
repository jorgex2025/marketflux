const express = require('express');
const router = express.Router();
const { add, find, update } = require('../database/db');

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// POST /api/newsletter/subscribe - Suscribirse al newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    const existingSubscribers = await find('newsletter', { email });
    const existingSubscriber = existingSubscribers.find(s => s.email.toLowerCase() === email.toLowerCase());

    if (existingSubscriber) {
      if (existingSubscriber.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Ya estás suscrito al newsletter'
        });
      }

      await update('newsletter', existingSubscriber.id, { status: 'active' });

      return res.json({
        success: true,
        message: 'Te has resubscrito al newsletter exitosamente'
      });
    }

    const subscriber = await add('newsletter', {
      email,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Te has subscrito al newsletter exitosamente',
      data: subscriber
    });
  } catch (error) {
    console.error('Error al subscribirse al newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subscribirse al newsletter'
    });
  }
});

// POST /api/newsletter/unsubscribe - Cancelar suscripción
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    const existingSubscribers = await find('newsletter', { email });
    const existingSubscriber = existingSubscribers.find(s => s.email.toLowerCase() === email.toLowerCase());

    if (!existingSubscriber) {
      return res.status(404).json({
        success: false,
        message: 'No found una suscripción con este email'
      });
    }

    if (existingSubscriber.status === 'unsubscribed') {
      return res.status(400).json({
        success: false,
        message: 'Ya estás desubscripto del newsletter'
      });
    }

    await update('newsletter', existingSubscriber.id, { status: 'unsubscribed' });

    res.json({
      success: true,
      message: 'Te has desubscripto del newsletter exitosamente'
    });
  } catch (error) {
    console.error('Error al desubscribirse del newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desubscribirse del newsletter'
    });
  }
});

module.exports = router;
