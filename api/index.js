export default async function handler(req, res) {
  const username = req.query.username;
  const token = process.env.PAT_1;

  const headers = {
    Authorization: `token ${token}`,
  };

  // USER DATA
  const user = await fetch(`https://api.github.com/users/${username}`, {
    headers,
  }).then((r) => r.json());

  // REPO DATA
  const repos = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100`,
    { headers }
  ).then((r) => r.json());

  let totalStars = 0;
  let totalForks = 0;
  let languages = {};

  repos.forEach((repo) => {
    totalStars += repo.stargazers_count;
    totalForks += repo.forks_count;

    if (repo.language) {
      languages[repo.language] =
        (languages[repo.language] || 0) + 1;
    }
  });

  res.status(200).json({
    name: user.name,
    bio: user.bio,
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
    publicGists: user.public_gists,
    stars: totalStars,
    forks: totalForks,
    createdAt: user.created_at,
    avatar: user.avatar_url,
    topLanguages: languages,
  });
}
