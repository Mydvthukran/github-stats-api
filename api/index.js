import { renderStats } from '../src/renderStats.js'

export default async function handler(req, res) {
  try {
    const username = req.query.username

    if (!username) {
      return res.status(400).send('Username is required')
    }

    const svg = await renderStats(username, process.env.PAT_1)

    res.setHeader('Content-Type', 'image/svg+xml')
    res.status(200).send(svg)
  } catch (err) {
    res.status(500).send('Something went wrong')
  }
}
