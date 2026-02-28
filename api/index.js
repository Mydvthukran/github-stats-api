import fetch from "node-fetch";

function esc(str = "") {
  return str
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

export default async function handler(req,res){

const {username}=req.query;
if(!username)return res.status(400).send("Username Required");

const query=`
query($login:String!){
user(login:$login){

name
bio
location
company
avatarUrl
followers{totalCount}
following{totalCount}

repositories(first:100,ownerAffiliations:OWNER){
totalCount
nodes{
stargazerCount
forkCount
languages(first:1){
nodes{name}
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

const r=await fetch("https://api.github.com/graphql",{
method:"POST",
headers:{
Authorization:\`Bearer \${process.env.GITHUB_TOKEN}\`,
"Content-Type":"application/json"
},
body:JSON.stringify({query,variables:{login:username}})
});

const json=await r.json();
const u=json.data.user;

let stars=0;
let forks=0;
let langs={};

u.repositories.nodes.forEach(repo=>{
stars+=repo.stargazerCount;
forks+=repo.forkCount;
const l=repo.languages.nodes[0]?.name;
if(l)langs[l]=(langs[l]||0)+1;
});

const topLang=Object.keys(langs).sort(
(a,b)=>langs[b]-langs[a]
)[0]||"None";

const svg=`
<svg width="460" height="280" xmlns="http://www.w3.org/2000/svg">

<rect width="100%" height="100%" rx="18" fill="#0d1117"/>

<image href="${u.avatarUrl}" x="20" y="20" height="70" width="70"/>

<text x="105" y="45" fill="#58a6ff" font-size="22" font-weight="bold">
${esc(u.name||username)}
</text>

<text x="105" y="70" fill="#8b949e" font-size="12">
${esc(u.bio||"No bio")}
</text>

<text x="20" y="120" fill="#c9d1d9">Repos: ${u.repositories.totalCount}</text>
<text x="20" y="145" fill="#c9d1d9">Followers: ${u.followers.totalCount}</text>
<text x="20" y="170" fill="#c9d1d9">Following: ${u.following.totalCount}</text>

<text x="240" y="120" fill="#c9d1d9">Stars: ${stars}</text>
<text x="240" y="145" fill="#c9d1d9">Forks: ${forks}</text>
<text x="240" y="170" fill="#c9d1d9">Top Lang: ${esc(topLang)}</text>

<text x="20" y="210" fill="#58a6ff">
Commits: ${u.contributionsCollection.totalCommitContributions}
</text>

<text x="240" y="210" fill="#58a6ff">
PRs: ${u.contributionsCollection.totalPullRequestContributions}
</text>

<text x="20" y="235" fill="#58a6ff">
Issues: ${u.contributionsCollection.totalIssueContributions}
</text>

<text x="240" y="235" fill="#58a6ff">
Contributions: ${u.contributionsCollection.contributionCalendar.totalContributions}
</text>

<text x="20" y="260" fill="#8b949e" font-size="12">
${esc(u.location||"")}  ${esc(u.company||"")}
</text>

</svg>
`;

res.setHeader("Content-Type","image/svg+xml");
res.status(200).send(svg);

}catch(e){
res.status(500).send("Server Error");
}
}
