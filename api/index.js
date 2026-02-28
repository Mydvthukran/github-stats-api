import fetch from "node-fetch";

function escapeXML(str=""){
  return String(str)
  .replace(/&/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;");
}

export default async function handler(req,res){

  const { username } = req.query;
  if(!username) return res.status(400).send("Username required");

  const query=`
  query($login:String!){
    user(login:$login){
      avatarUrl
      followers{totalCount}
      following{totalCount}
      repositories(first:100,ownerAffiliations:OWNER){
        totalCount
        nodes{
          stargazerCount
          forkCount
          languages(first:10){
            edges{
              size
              node{name}
            }
          }
        }
      }
      contributionsCollection{
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        contributionCalendar{
          totalContributions
        }
      }
    }
  }`;

  try{

    const result=await fetch("https://api.github.com/graphql",{
      method:"POST",
      headers:{
        Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        query,
        variables:{login:username}
      })
    });

    const json=await result.json();
    const user=json.data.user;

    let stars=0;
    let forks=0;
    let langs={};
    let total=0;

    user.repositories.nodes.forEach(repo=>{
      stars+=repo.stargazerCount;
      forks+=repo.forkCount;

      repo.languages.edges.forEach(l=>{
        total+=l.size;
        langs[l.node.name]=(langs[l.node.name]||0)+l.size;
      });
    });

    let topLangs=Object.entries(langs)
    .map(([name,size])=>({
      name:escapeXML(name),
      percent:((size/total)*100).toFixed(1)
    }))
    .sort((a,b)=>b.percent-a.percent)
    .slice(0,5);

    let bars="";
    let y=240;

    topLangs.forEach(l=>{
      bars+=`
<text x="20" y="${y}" fill="#c9d1d9" font-size="13">
${l.name} ${l.percent}%
</text>

<rect x="160" y="${y-12}" width="200"
height="8" rx="4" fill="#30363d"/>

<rect x="160" y="${y-12}"
width="${l.percent*2}" height="8"
rx="4" fill="#58a6ff"/>
`;
      y+=20;
    });

const svg=`
<svg width="450" height="380"
xmlns="http://www.w3.org/2000/svg">

<style>
.title{fill:#58a6ff;font-size:20px;font-family:Segoe UI}
.text{fill:#c9d1d9;font-size:14px;font-family:Segoe UI}
</style>

<rect width="100%" height="100%"
rx="20" fill="#0d1117"/>

<image href="${escapeXML(user.avatarUrl)}"
x="20" y="20" height="70" width="70"/>

<text x="110" y="50" class="title">
${escapeXML(username)}
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
res.setHeader("Cache-Control","public,max-age=3600");
res.status(200).send(svg);

}catch(e){
res.status(500).send(e.message);
}
}
