import fetch from "node-fetch";

export default async function handler(req, res) {

  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ error: "Username required" });
  }

  const token = process.env.PAT_1;

  if (!token) {
    return res.status(500).json({ error: "PAT_1 not found" });
  }

  try {

    const response = await fetch(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Authorization: `token ${token}`
        }
      }
    );

    const data = await response.json();

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

}
