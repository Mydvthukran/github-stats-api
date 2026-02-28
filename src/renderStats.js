import fetch from "node-fetch";

export async function renderStats(username, token) {
  const [userRes, repoRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, {
      headers: { Authorization: `token ${token}` },
    }),
    fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
      headers: { Authorization: `token ${token}` },
    }),
  ]);

  const user  = await userRes.json();
  const repos = await repoRes.json();

  let totalStars = 0;
  let totalForks = 0;
  let languages  = {};

  repos.forEach((repo) => {
    totalStars += repo.stargazers_count;
    totalForks += repo.forks_count;
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
    }
  });

  const topLang     = Object.keys(languages).sort((a, b) => languages[b] - languages[a])[0] || "N/A";
  const createdDate = new Date(user.created_at).toDateString();

  return `
<svg width="500" height="320" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 22px sans-serif; fill: #58a6ff; }
    .text  { font: 14px sans-serif;      fill: #c9d1d9; }
    .label { font: bold 14px sans-serif; fill: #8b949e; }
  </style>
  <rect width="100%" height="100%" fill="#0d1117" rx="15"/>
  <text x="20"  y="50"  class="title">${user.login}</text>
  <text x="20"  y="75"  class="text">${user.bio || "No bio available"}</text>
  <text x="20"  y="120" class="label">Repos:</text>
  <text x="120" y="120" class="text">${user.public_repos}</text>
  <text x="20"  y="150" class="label">Followers:</text>
  <text x="120" y="150" class="text">${user.followers}</text>
  <text x="20"  y="180" class="label">Stars:</text>
  <text x="120" y="180" class="text">${totalStars}</text>
  <text x="20"  y="210" class="label">Forks:</text>
  <text x="120" y="210" class="text">${totalForks}</text>
  <text x="260" y="120" class="label">Top Lang:</text>
  <text x="380" y="120" class="text">${topLang}</text>
  <text x="260" y="150" class="label">Following:</text>
  <text x="380" y="150" class="text">${user.following}</text>
  <text x="260" y="180" class="label">Created:</text>
  <text x="380" y="180" class="text">${createdDate}</text>
</svg>`;
}
