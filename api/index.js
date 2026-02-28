import fetch from "node-fetch";

export default async function handler(req, res) {

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username not provided" });
  }

  const headers = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
  };

  try {

    // 🔵 USER BASIC DATA
    const userRes = await fetch(
      `https://api.github.com/users/${username}`,
      { headers }
    );

    const user = await userRes.json();


    // 🔵 FETCH ALL REPOS
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100`,
      { headers }
    );

    const repos = await reposRes.json();


    // 🔵 CALCULATIONS
    let totalStars = 0;
    let totalForks = 0;
    let languages = {};

    repos.forEach(repo => {

      totalStars += repo.stargazers_count;
      totalForks += repo.forks_count;

      if (repo.language) {
        languages[repo.language] =
          (languages[repo.language] || 0) + 1;
      }

    });


    // 🔵 TOP LANGUAGE
    const topLang = Object.keys(languages).reduce(
      (a, b) => languages[a] > languages[b] ? a : b,
      "None"
    );


    // 🔵 SVG CARD
    const svg = `
<svg width="420" height="200" xmlns="http://www.w3.org/2000/svg">

<rect width="100%" height="100%" rx="15" fill="#0d1117"/>

<image href="${user.avatar_url}" x="20" y="20" height="60" width="60"/>

<text x="100" y="45" fill="#58a6ff" font-size="20" font-family="Arial">
${user.login}
</text>

<text x="20" y="100" fill="#c9d1d9" font-size="14">
Repos: ${repos.length}
</text>

<text x="20" y="125" fill="#c9d1d9" font-size="14">
Followers: ${user.followers}
</text>

<text x="20" y="150" fill="#c9d1d9" font-size="14">
Following: ${user.following}
</text>

<text x="200" y="100" fill="#c9d1d9" font-size="14">
Stars: ${totalStars}
</text>

<text x="200" y="125" fill="#c9d1d9" font-size="14">
Forks: ${totalForks}
</text>

<text x="200" y="150" fill="#c9d1d9" font-size="14">
Top Lang: ${topLang}
</text>

</svg>
`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(svg);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
