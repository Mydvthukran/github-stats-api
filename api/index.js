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
          languages(first:10){
            edges{
              size
              node{ name }
            }
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
    let langData = {};
    let totalBytes = 0;

    user.repositories.nodes.forEach(repo => {

      stars += repo.stargazerCount;
      forks += repo.forkCount;

      repo.languages.edges.forEach(lang=>{
        totalBytes += lang.size;
        langData[lang.node.name] =
        (langData[lang.node.name]||0)+lang.size;
      });
    });

    let langs = Object.entries(langData)
      .map(([name,size])=>({
        name,
        percent:(size/totalBytes*100).toFixed(1)
      }))
      .sort((a,b)=>b.percent-a.percent)
      .slice(0,5);

    let bars="";
    let y=240;

    langs.forEach(l=>{
      bars+=`
      <text x="20" y="${y}" fill="#c9d1d9" font-size="13">
      ${l.name} ${l.percent}%
      </text>

      <rect x="150" y="${y-12}" width="200"
      height="8" rx="4" fill="#30363d"/>

      <rect x="150" y="${y-12}"
      width="${l.percent*2}" height="8"
      rx="4" fill="#58a6ff"/>
      `;
      y+=20;
    });

    const svg=`
<svg width="450" height="380"
xmlns="http://www.w3.org/2000/svg">

<style>
.card{fill:#0d1117;stroke:#30363d}
.title{fill:#58a6ff;font-size:20px;font-family:Segoe UI}
.text{fill:#c9d1d9;font-size:14px;font-family:Segoe UI}
</style>

<rect class="card" width="100%" height="100%" rx="20"/>

<image href="${user.avatarUrl}" x="20" y="20"
height="70" width="70"/>

<text x="110" y="50" class="title">
${username}
</text>

<text x="20" y="120" class="text">
Repos: ${user.repositories.totalCount}
</text>

<text x="20" y="145" class="text">
Followers: ${user.followers.totalCount}
</text>

<text x="20" y="170" class="text">
Following: ${user.following.totalCount}
</text>

<text x="230" y="120" class="text">
Stars: ${stars}
</text>

<text x="230" y="145" class="text">
Forks: ${forks}
</text>

<text x="20" y="200" fill="#58a6ff">
Commits:
${user.contributionsCollection.totalCommitContributions}
</text>

<text x="230" y="200" fill="#58a6ff">
PRs:
${user.contributionsCollection.totalPullRequestContributions}
</text>

<text x="20" y="225" fill="#58a6ff">
Issues:
${user.contributionsCollection.totalIssueContributions}
</text>

<text x="230" y="225" fill="#58a6ff">
Total:
${user.contributionsCollection.contributionCalendar.totalContributions}
</text>

${bars}

</svg>
`;

    res.setHeader("Content-Type","image/svg+xml");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Cache-Control","public,max-age=3600");

    res.status(200).send(svg);

  } catch(err){
    res.status(500).send(err.message);
  }
}
