export default async function handler(req, res) {
  const { username } = req.query;

  const response = await fetch(
    `https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=radical`,
    {
      headers: {
        Authorization: `token ${process.env.PAT_1}`,
      },
    }
  );

  const svg = await response.text();

  res.setHeader("Content-Type", "image/svg+xml");
  res.status(200).send(svg);
}
