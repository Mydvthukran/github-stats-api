import fetch from "node-fetch";

export default async function handler(req, res) {

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username required" });
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
<svg width="450" height="260" xmlns="http://www.w3.org/2000/svg">

<rect width="100%" height="100%" rx="15" fill="#0d1117"/>

<image href="${user.avatarUrl}" x="20" y="20" height="60" width="60"/>

<text x="100" y="45" fill="#58a6ff" font-size="20">
${username}
</text>

<text x="20" y="110" fill="#c9d1d9">
Repos: ${user.repositories.totalCount}
</text>

<text x="20" y="135" fill="#c9d1d9">
Followers: ${user.followers.totalCount}
</text>

<text x="20" y="160" fill="#c9d1d9">
Following: ${user.following.totalCount}
</text>

<text x="200" y="110" fill="#c9d1d9">
Stars: ${stars}
</text>

<text x="200" y="135" fill="#c9d1d9">
Forks: ${forks}
</text>

<text x="200" y="160" fill="#c9d1d9">
Top Lang: ${topLang}
</text>

<text x="20" y="200" fill="#58a6ff">
Commits: ${user.contributionsCollection.totalCommitContributions}
</text>

<text x="200" y="200" fill="#58a6ff">
PRs: ${user.contributionsCollection.totalPullRequestContributions}
</text>

<text x="20" y="225" fill="#58a6ff">
Issues: ${user.contributionsCollection.totalIssueContributions}
</text>

<text x="200" y="225" fill="#58a6ff">
Contributions: ${user.contributionsCollection.contributionCalendar.totalContributions}
</text>

</svg>
`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(svg);

  } catch(err) {
    res.status(500).json({error:err.message});
  }
}
    
