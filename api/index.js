import fetch from "node-fetch";

export default async function handler(req, res) {

  const { username } = req.query;

  if (!username) {
    return res.status(400).send("Username required");
  }

  const query = `
  query($login:String!) {
    user(login:$login) {
      name
      avatarUrl
      followers { totalCount }
      following { totalCount }

      repositories(first:100, ownerAffiliations: OWNER) {
        totalCount
        nodes {
          stargazerCount
          forkCount
          languages(first:1) {
            nodes { name }
          }
        }
      }

      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        contributionCalendar {
          totalContributions
        }
      }
    }
  }`;

  try {

    const result = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { login: username }
      })
    });

    const json = await result.json();

    if (!json.data) {
      return res.status(500).send("GitHub API Error");
    }

    const user = json.data.user;

    let stars = 0;
    let forks = 0;
    let langs = {};

    user.repositories.nodes.forEach(repo => {
      stars += repo.stargazerCount;
      forks += repo.forkCount;

      const lang = repo.languages.nodes[0]?.name;
      if (lang) langs[lang] = (langs[lang] || 0) + 1;
    });

    const topLang = Object.keys(langs).reduce(
      (a,b)=> langs[a]>langs[b]?a:b,
      "None"
    );

    const svg = `
<svg width="500" height="280" xmlns="http://www.w3.org/2000/svg">

<rect width="100%" height="100%" rx="20" fill="#0d1117"/>

<image href="${user.avatarUrl}" x="20" y="20" height="70" width="70"/>

<text x="110" y="50" fill="#58a6ff" font-size="22">
${username}
</text>

<text x="20" y="120" fill="#c9d1d9">
Repos: ${user.repositories.totalCount}
</text>

<text x="20" y="150" fill="#c9d1d9">
Followers: ${user.followers.totalCount}
</text>

<text x="20" y="180" fill="#c9d1d9">
Following: ${user.following.totalCount}
</text>

<text x="260" y="120" fill="#c9d1d9">
Stars: ${stars}
</text>

<text x="260" y="150" fill="#c9d1d9">
Forks: ${forks}
</text>

<text x="260" y="180" fill="#c9d1d9">
Top Lang: ${topLang}
</text>

<text x="20" y="220" fill="#58a6ff">
Commits: ${user.contributionsCollection.totalCommitContributions}
</text>

<text x="260" y="220" fill="#58a6ff">
PRs: ${user.contributionsCollection.totalPullRequestContributions}
</text>

<text x="20" y="250" fill="#58a6ff">
Issues: ${user.contributionsCollection.totalIssueContributions}
</text>

<text x="260" y="250" fill="#58a6ff">
Total Contributions: ${user.contributionsCollection.contributionCalendar.totalContributions}
</text>

</svg>
`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(svg);

  } catch(err) {
    res.status(500).send(err.message);
  }
}
