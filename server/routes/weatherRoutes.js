const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const city = req.query.city || req.user.city || 'Hyderabad';
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=5`;
    const { data } = await axios.get(url);

    const current = data.list[0];
    const response = {
      city: data.city.name,
      country: data.city.country,
      temperature: Math.round(current.main.temp),
      feels_like: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      wind_speed: current.wind.speed,
      forecast: data.list.slice(1, 5).map(item => ({
        time: item.dt_txt,
        temp: Math.round(item.main.temp),
        icon: item.weather[0].icon,
        description: item.weather[0].description
      }))
    };

    res.json(response);
  } catch (err) {
    console.error('Weather error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

module.exports = router;
