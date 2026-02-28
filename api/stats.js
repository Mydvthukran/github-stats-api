import fetch from "node-fetch";

export default async function handler(req, res) {
  const { username } = req.query;
  if (!username) return res.status(400).send("Username required");

  const response = await fetch(
    `https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=radical`
  );

  const svg = await response.text();
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).send(svg);
}
