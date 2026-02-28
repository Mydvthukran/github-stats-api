import fetch from "node-fetch";

// Official GitHub language colors
const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
  Java: "#b07219", "C++": "#f34b7d", C: "#555555", "C#": "#178600",
  Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516", PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", HTML: "#e34c26",
  CSS: "#563d7c", Shell: "#89e051", Scala: "#c22d40", R: "#198CE7",
  Vue: "#41b883", Svelte: "#ff3e00", Lua: "#000080", Perl: "#0298c3",
  Haskell: "#5e5086", Elixir: "#6e4a7e", Clojure: "#db5855",
  Terraform: "#7b42bc", Dockerfile: "#384d54", YAML: "#cb171e",
  Markdown: "#083fa1", Nix: "#7e7eff", Vim: "#199f4b", SCSS: "#c6538c",
  "Jupyter Notebook": "#DA5B0B", PowerShell: "#012456",
};

const FALLBACK_COLORS = [
  "#79c0ff","#56d364","#ffa657","#ff7b72","#d2a8ff",
  "#f0883e","#6e7681","#e3b341","#39d353","#bc8cff",
  "#58a6ff","#ff9f43","#26de81","#fd79a8","#fdcb6e",
];

function escapeXML(str = "") {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function getBase64Avatar(url) {
  try {
    const res = await fetch(url);
    const buffer = await res.buffer();
    const mime = res.headers.get("content-type") || "image/png";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch { return null; }
}

export default async function handler(req, res) {
  const { username } = req.query;
  if (!username) return res.status(400).send("Username required");

  const query = `
  query($login: String!) {
    user(login: $login) {
      avatarUrl name bio
      followers { totalCount }
      following  { totalCount }
      repositories(first: 100, ownerAffiliations: OWNER) {
        totalCount
        nodes {
          stargazerCount forkCount
          languages(first: 20) {
            edges { size node { name color } }
          }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        contributionCalendar { totalContributions }
      }
    }
  }`;

  try {
    const result = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { login: username } }),
    });
    const json = await result.json();
    if (json.errors) return res.status(400).send(json.errors[0].message);
    if (!json.data?.user) return res.status(404).send(`User "${username}" not found`);

    const user = json.data.user;
    let stars = 0, forks = 0, langs = {}, langColors = {}, total = 0;

    user.repositories.nodes.forEach((repo) => {
      stars += repo.stargazerCount;
      forks += repo.forkCount;
      repo.languages.edges.forEach((l) => {
        const name = l.node.name;
        total += l.size;
        langs[name] = (langs[name] || 0) + l.size;
        if (!langColors[name]) langColors[name] = l.node.color || LANG_COLORS[name] || null;
      });
    });

    // Assign fallback colors
    let colorIdx = 0;
    Object.keys(langs).forEach((name) => {
      if (!langColors[name]) langColors[name] = FALLBACK_COLORS[colorIdx++ % FALLBACK_COLORS.length];
    });

    const allLangs = Object.entries(langs)
      .map(([name, size]) => ({
        name, color: langColors[name],
        percent: (size / total) * 100,
        pStr: ((size / total) * 100).toFixed(1),
      }))
      .sort((a, b) => b.percent - a.percent);

    const avatarBase64 = await getBase64Avatar(user.avatarUrl);
    const cc  = user.contributionsCollection;
    const W   = 480;
    const PAD = 22;
    const displayName = escapeXML(user.name || username);
    const bio = escapeXML((user.bio || "").slice(0, 58));

    // ── Section Y positions ──────────────────────────────────────
    const HEADER_H   = 96;
    const STATS_Y    = HEADER_H + 16;
    const STATS_H    = 60;
    const DIV1_Y     = STATS_Y + STATS_H + 4;
    const CONTRIB_Y  = DIV1_Y + 12;
    const CONTRIB_H  = 46;
    const DIV2_Y     = CONTRIB_Y + CONTRIB_H + 4;
    const LANG_HDR_Y = DIV2_Y + 18;
    const BAR_Y      = LANG_HDR_Y + 16;
    const BAR_H      = 12;
    const LEG_Y      = BAR_Y + BAR_H + 18;
    const COLS       = 2;
    const ROW_H      = 22;
    const ROWS       = Math.ceil(allLangs.length / COLS);
    const TOTAL_H    = LEG_Y + ROWS * ROW_H + PAD;
    const BAR_W      = W - PAD * 2;
    const COL_W      = BAR_W / COLS;

    // ── Multicolor language bar ───────────────────────────────────
    let bx = PAD;
    const langBarSegs = allLangs.map((l) => {
      const sw = Math.max((l.percent / 100) * BAR_W, 1.5);
      const s  = `<rect x="${bx.toFixed(2)}" y="${BAR_Y}" width="${sw.toFixed(2)}" height="${BAR_H}" fill="${l.color}"/>`;
      bx += sw;
      return s;
    }).join("");

    // ── Legend ────────────────────────────────────────────────────
    const legend = allLangs.map((l, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const lx  = PAD + col * COL_W;
      const ly  = LEG_Y + row * ROW_H + 8;
      return `
        <circle cx="${lx + 6}" cy="${ly - 2}" r="4.5" fill="${l.color}"/>
        <text x="${lx + 17}" y="${ly + 2}" fill="#c9d1d9" font-size="11.5" font-family="'Segoe UI',system-ui,sans-serif">${escapeXML(l.name)}</text>
        <text x="${lx + COL_W - 4}" y="${ly + 2}" fill="#6e7681" font-size="11" font-family="'Segoe UI',system-ui,sans-serif" text-anchor="end">${l.pStr}%</text>
      `;
    }).join("");

    // ── Contribution segments ─────────────────────────────────────
    const totalC  = cc.contributionCalendar.totalContributions;
    const CBAR_Y  = CONTRIB_Y + 26;
    let cx2 = PAD;
    const cSegs = [
      { pct: totalC ? cc.totalCommitContributions / totalC * 100 : 0,           color: "#58a6ff" },
      { pct: totalC ? cc.totalPullRequestContributions / totalC * 100 : 0,      color: "#56d364" },
      { pct: totalC ? cc.totalIssueContributions / totalC * 100 : 0,            color: "#ffa657" },
      { pct: Math.max(0, 100
          - (totalC ? cc.totalCommitContributions / totalC * 100 : 0)
          - (totalC ? cc.totalPullRequestContributions / totalC * 100 : 0)
          - (totalC ? cc.totalIssueContributions / totalC * 100 : 0)),           color: "#21262d" },
    ].map(({ pct, color }) => {
      const sw = Math.max((pct / 100) * BAR_W, 1);
      const s  = `<rect x="${cx2.toFixed(2)}" y="${CBAR_Y}" width="${sw.toFixed(2)}" height="8" fill="${color}"/>`;
      cx2 += sw;
      return s;
    }).join("");

    // ── Stats ─────────────────────────────────────────────────────
    const statItems = [
      { label: "Repos",   val: user.repositories.totalCount },
      { label: "Stars",   val: stars },
      { label: "Forks",   val: forks },
      { label: "Commits", val: cc.totalCommitContributions },
      { label: "PRs",     val: cc.totalPullRequestContributions },
      { label: "Issues",  val: cc.totalIssueContributions },
    ];
    const SCOL_W = BAR_W / statItems.length;
    const statsHTML = statItems.map(({ label, val }, i) => {
      const sx = PAD + i * SCOL_W + SCOL_W / 2;
      return `
        <text x="${sx}" y="${STATS_Y + 24}" fill="#e6edf3" font-size="15" font-weight="700" font-family="'Segoe UI',system-ui,sans-serif" text-anchor="middle">${val.toLocaleString()}</text>
        <text x="${sx}" y="${STATS_Y + 42}" fill="#6e7681" font-size="10.5" font-family="'Segoe UI',system-ui,sans-serif" text-anchor="middle">${label}</text>
      `;
    }).join("");
    const statDividers = [1,2,3,4,5].map(i =>
      `<line x1="${(PAD + i * SCOL_W).toFixed(1)}" y1="${STATS_Y + 6}" x2="${(PAD + i * SCOL_W).toFixed(1)}" y2="${STATS_Y + 50}" stroke="#21262d" stroke-width="1"/>`
    ).join("");

    const AV = 64;

    const svg = `<svg width="${W}" height="${TOTAL_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="av"><circle cx="${PAD + AV/2}" cy="${PAD + AV/2}" r="${AV/2}"/></clipPath>
    <clipPath id="lb"><rect x="${PAD}" y="${BAR_Y}" width="${BAR_W}" height="${BAR_H}" rx="6"/></clipPath>
    <clipPath id="cb"><rect x="${PAD}" y="${CBAR_Y}" width="${BAR_W}" height="8" rx="4"/></clipPath>
    <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%"   stop-color="#0d1117"/>
      <stop offset="100%" stop-color="#131920"/>
    </linearGradient>
  </defs>

  <!-- Card -->
  <rect width="${W}" height="${TOTAL_H}" rx="16" fill="url(#bg)"/>
  <rect width="${W}" height="${TOTAL_H}" rx="16" fill="none" stroke="#30363d" stroke-width="1"/>
  <!-- Top accent bar -->
  <rect x="0" y="0" width="${W}" height="3" rx="16" fill="#58a6ff" opacity="0.8"/>

  <!-- ── HEADER ── -->
  ${avatarBase64
    ? `<image href="${avatarBase64}" x="${PAD}" y="${PAD}" width="${AV}" height="${AV}" clip-path="url(#av)"/>
       <circle cx="${PAD+AV/2}" cy="${PAD+AV/2}" r="${AV/2+1}" fill="none" stroke="#58a6ff" stroke-width="1.5" opacity="0.45"/>`
    : `<circle cx="${PAD+AV/2}" cy="${PAD+AV/2}" r="${AV/2}" fill="#21262d" stroke="#30363d" stroke-width="1.5"/>`
  }
  <text x="${PAD+AV+14}" y="${PAD+22}" fill="#e6edf3" font-size="17" font-weight="700" font-family="'Segoe UI',system-ui,sans-serif">${displayName}</text>
  <text x="${PAD+AV+14}" y="${PAD+40}" fill="#58a6ff" font-size="12" font-family="'Segoe UI',system-ui,sans-serif">@${escapeXML(username)}</text>
  ${bio ? `<text x="${PAD+AV+14}" y="${PAD+58}" fill="#8b949e" font-size="11.5" font-family="'Segoe UI',system-ui,sans-serif">${bio}</text>` : ""}

  <!-- ── STATS ── -->
  <rect x="${PAD}" y="${STATS_Y - 2}" width="${BAR_W}" height="${STATS_H + 4}" rx="8" fill="#0d1117" opacity="0.5"/>
  ${statsHTML}
  ${statDividers}

  <!-- ── CONTRIBUTIONS ── -->
  <line x1="${PAD}" y1="${DIV1_Y}" x2="${W-PAD}" y2="${DIV1_Y}" stroke="#21262d" stroke-width="1"/>
  <text x="${PAD}"    y="${CONTRIB_Y+14}" fill="#8b949e" font-size="11" font-family="'Segoe UI',system-ui,sans-serif">Activity</text>
  <text x="${PAD+52}" y="${CONTRIB_Y+14}" fill="#e6edf3" font-size="11" font-weight="600" font-family="'Segoe UI',system-ui,sans-serif">${totalC.toLocaleString()} contributions</text>
  <!-- legend -->
  <circle cx="${W-162}" cy="${CONTRIB_Y+10}" r="3.5" fill="#58a6ff"/>
  <text   x="${W-155}" y="${CONTRIB_Y+14}" fill="#6e7681" font-size="10" font-family="'Segoe UI',system-ui,sans-serif">Commits</text>
  <circle cx="${W-98}"  cy="${CONTRIB_Y+10}" r="3.5" fill="#56d364"/>
  <text   x="${W-91}"  y="${CONTRIB_Y+14}" fill="#6e7681" font-size="10" font-family="'Segoe UI',system-ui,sans-serif">PRs</text>
  <circle cx="${W-55}"  cy="${CONTRIB_Y+10}" r="3.5" fill="#ffa657"/>
  <text   x="${W-48}"  y="${CONTRIB_Y+14}" fill="#6e7681" font-size="10" font-family="'Segoe UI',system-ui,sans-serif">Issues</text>
  <g clip-path="url(#cb)">${cSegs}</g>
  <rect x="${PAD}" y="${CBAR_Y}" width="${BAR_W}" height="8" rx="4" fill="none" stroke="#ffffff08" stroke-width="1"/>

  <!-- ── LANGUAGES ── -->
  <line x1="${PAD}" y1="${DIV2_Y}" x2="${W-PAD}" y2="${DIV2_Y}" stroke="#21262d" stroke-width="1"/>
  <text x="${PAD}"    y="${LANG_HDR_Y}" fill="#e6edf3" font-size="13" font-weight="700" font-family="'Segoe UI',system-ui,sans-serif">Languages</text>
  <text x="${W-PAD}" y="${LANG_HDR_Y}" fill="#6e7681" font-size="11" font-family="'Segoe UI',system-ui,sans-serif" text-anchor="end">${allLangs.length} detected</text>
  <g clip-path="url(#lb)">${langBarSegs}</g>
  <rect x="${PAD}" y="${BAR_Y}" width="${BAR_W}" height="${BAR_H}" rx="6" fill="none" stroke="#ffffff08" stroke-width="1"/>
  ${legend}
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(svg);

  } catch (e) {
    const errSvg = `<svg width="480" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="12" fill="#161b22"/>
      <rect width="100%" height="100%" rx="12" fill="none" stroke="#f85149" stroke-width="1"/>
      <text x="20" y="30" fill="#f85149" font-size="13" font-family="monospace">Error: ${escapeXML(e.message)}</text>
      <text x="20" y="55" fill="#8b949e" font-size="11" font-family="monospace">Check GITHUB_TOKEN is set in Vercel env vars</text>
    </svg>`;
    res.setHeader("Content-Type", "image/svg+xml");
    res.status(500).send(errSvg);
  }
}
