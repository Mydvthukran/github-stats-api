export async function renderStats(username, token) {

  const response = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      Authorization: `token ${token}`
    }
  })

  const data = await response.json()

  const createdDate = new Date(data.created_at).toDateString()

  return `
  <svg width="500" height="280" xmlns="http://www.w3.org/2000/svg">

    <style>
      .title { font: bold 22px sans-serif; fill: #58a6ff; }
      .text { font: 14px sans-serif; fill: #c9d1d9; }
      .label { font: bold 14px sans-serif; fill: #8b949e; }
    </style>

    <rect width="100%" height="100%" fill="#0d1117" rx="15"/>

    <image href="${data.avatar_url}" x="20" y="20" width="80" height="80" rx="40"/>

    <text x="120" y="50" class="title">
      ${data.login}
    </text>

    <text x="120" y="80" class="text">
      ${data.bio || "No bio available"}
    </text>

    <text x="20" y="130" class="label">Public Repos:</text>
    <text x="160" y="130" class="text">${data.public_repos}</text>

    <text x="20" y="160" class="label">Followers:</text>
    <text x="160" y="160" class="text">${data.followers}</text>

    <text x="20" y="190" class="label">Following:</text>
    <text x="160" y="190" class="text">${data.following}</text>

    <text x="20" y="220" class="label">Location:</text>
    <text x="160" y="220" class="text">${data.location || "N/A"}</text>

    <text x="20" y="250" class="label">Company:</text>
    <text x="160" y="250" class="text">${data.company || "N/A"}</text>

    <text x="260" y="130" class="label">GitHub ID:</text>
    <text x="380" y="130" class="text">${data.id}</text>

    <text x="260" y="160" class="label">Created:</text>
    <text x="380" y="160" class="text">${createdDate}</text>

  </svg>
  `
}
