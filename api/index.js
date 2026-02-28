res.setHeader("Content-Type", "image/svg+xml");

const svg = `
<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml"
      style="font-family:Arial;padding:10px;
      background:#0d1117;color:white;border-radius:10px;">
      
      <h3>${data.login}</h3>
      <p>Repos: ${data.public_repos}</p>
      <p>Followers: ${data.followers}</p>
      <p>Following: ${data.following}</p>
      <p>Stars: ${stars}</p>
      <p>Forks: ${forks}</p>
      
    </div>
  </foreignObject>
</svg>
`;

res.status(200).send(svg);
