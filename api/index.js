import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { username } = req.query;

    if (!username) {
      res.status(400).send("Username required");
      return;
    }

    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `token ${process.env.PAT_1}`,
      },
    });

    const user = await response.json();

    const svg = `
    <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { fill: #58a6ff; font-size: 18px; font-family: Arial; }
        .text { fill: #c9d1d9; font-size: 14px; font-family: Arial; }
      </style>
      <rect width="100%" height="100%" fill="#0d1117" rx="15"/>
      <text x="20" y="40" class="title">${user.login}</text>
      <text x="20" y="70" class="text">Repos: ${user.public_repos}</text>
      <text x="20" y="100" class="text">Followers: ${user.followers}</text>
      <text x="20" y="130" class="text">Following: ${user.following}</text>
      <text x="20" y="160" class="text">Stars: ${user.public_gists}</text>
    </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(svg);

  } catch (error) {
    res.status(500).send("Error generating SVG");
  }
}
