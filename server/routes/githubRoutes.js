const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

const githubAxios = () => axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
  }
});

router.get('/:username', protect, async (req, res) => {
  try {
    const { username } = req.params;
    const gh = githubAxios();

    const [userRes, reposRes, eventsRes] = await Promise.all([
      gh.get(`/users/${username}`),
      gh.get(`/users/${username}/repos?sort=updated&per_page=5`),
      gh.get(`/users/${username}/events/public?per_page=10`)
    ]);

    const commits = eventsRes.data
      .filter(e => e.type === 'PushEvent')
      .slice(0, 5)
      .map(e => ({
        repo: e.repo.name,
        message: e.payload.commits?.[0]?.message || 'No message',
        date: e.created_at,
        sha: e.payload.commits?.[0]?.sha?.slice(0, 7)
      }));

    const prs = eventsRes.data
      .filter(e => e.type === 'PullRequestEvent')
      .slice(0, 3)
      .map(e => ({
        repo: e.repo.name,
        title: e.payload.pull_request?.title,
        action: e.payload.action,
        date: e.created_at
      }));

    res.json({
      profile: {
        name: userRes.data.name,
        login: userRes.data.login,
        avatar: userRes.data.avatar_url,
        bio: userRes.data.bio,
        followers: userRes.data.followers,
        following: userRes.data.following,
        public_repos: userRes.data.public_repos
      },
      repos: reposRes.data.map(r => ({
        name: r.name,
        description: r.description,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        url: r.html_url,
        updated: r.updated_at
      })),
      commits,
      prs
    });
  } catch (err) {
    console.error('GitHub error:', err.message);
    res.status(500).json({ error: 'Failed to fetch GitHub data' });
  }
});

module.exports = router;
