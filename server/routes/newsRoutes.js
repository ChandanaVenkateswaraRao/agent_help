const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const category = req.query.category || 'technology';
    const url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`;
    const { data } = await axios.get(url);

    const articles = data.articles
      .filter(a => a.title && a.urlToImage)
      .slice(0, 8)
      .map(a => ({
        title: a.title,
        description: a.description,
        url: a.url,
        image: a.urlToImage,
        source: a.source.name,
        publishedAt: a.publishedAt
      }));

    res.json({ articles });
  } catch (err) {
    console.error('News error:', err.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// AI-specific news
router.get('/ai', protect, async (req, res) => {
  try {
    const url = `https://newsapi.org/v2/everything?q=artificial+intelligence+OR+OpenAI+OR+machine+learning&language=en&sortBy=publishedAt&pageSize=6&apiKey=${process.env.NEWS_API_KEY}`;
    const { data } = await axios.get(url);

    const articles = data.articles
      .filter(a => a.title && a.urlToImage)
      .slice(0, 6)
      .map(a => ({
        title: a.title,
        description: a.description,
        url: a.url,
        image: a.urlToImage,
        source: a.source.name,
        publishedAt: a.publishedAt
      }));

    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch AI news' });
  }
});

module.exports = router;
