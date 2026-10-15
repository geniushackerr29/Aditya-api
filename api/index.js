// language: JavaScript, file: api/index.js, target: Node 18+, Vercel
// *Genius API Hub — 15 upstreams, single file*

const BRAND = {
  developer: "Developer Genius Hacker",
  youtube: "YouTube Genius Hacker 29",
  name: "Genius API Hub",
  version: "1.0.0",
};

const SERVICES = {
  player: {
    build: (q) => `https://infoooooo-v6v5.vercel.app/accinfo?uid=${q.uid}&region=${q.region || "ind"}`,
    params: ["uid", "region?"],
    desc: "Free Fire player info",
  },
  guild: {
    build: (q) => `https://guild-info-danger.vercel.app/guild?guild_id=${q.guild_id}&region=${q.region || "ind"}`,
    params: ["guild_id", "region?"],
    desc: "Free Fire guild info",
  },
  insta: {
    build: (q) => `https://kallu-insta-info-api.vercel.app/api/insta/${encodeURIComponent(q.username || "")}`,
    params: ["username"],
    desc: "Instagram profile info",
  },
  yt: {
    build: (q) => `https://kallu-youtube-info-api.vercel.app/api/yt?channel=${encodeURIComponent(q.channel || "")}`,
    params: ["channel"],
    desc: "YouTube channel info",
    shape: (d) => ({
      channel_name: d.channel_name,
      subscribers: Number(d.subscribers || 0),
      views: Number(d.views || 0),
      videos: Number(d.videos || 0),
      country: d.country,
      created_at: d.created_at,
    }),
  },
  tiktok: {
    build: (q) => `https://tiktok-api-mafia-ayan.vercel.app/tkinfo?username=${encodeURIComponent(q.username || "")}`,
    params: ["username"],
    desc: "TikTok profile info",
    shape: (d) => ({
      name: d.name,
      username: d.username,
      followers: d.followers,
      following: d.following,
      hearts: d.hearts,
      videos: d.videos,
      verified: d.open_favorite,
      signature: d.signature,
    }),
  },
  phone: {
    build: (q) => `https://ph-ng-pi.vercel.app/?number=${q.number}`,
    params: ["number"],
    desc: "Phone number lookup",
    shape: (d) => ({
      country: d.fields?.Country,
      sim: d.fields?.["SIM card"],
      connection: d.fields?.Connection,
      state: d.fields?.["Mobile State"],
      city: d.fields?.["Refrence City"],
      language: d.fields?.Language,
      owner: d.fields?.["Owner Name"],
      complaints: d.fields?.Complaints,
    }),
  },
  pincode: {
    build: (q) => `https://pincode-ng.vercel.app/lookup?pincode=${q.pincode}`,
    params: ["pincode"],
    desc: "Indian pincode lookup",
  },
  like: {
    build: (q) => `https://stargvhuuvjpy.vercel.app/like?uid=${q.uid}&server_name=${q.server_name || "ind"}`,
    params: ["uid", "server_name?"],
    desc: "Send likes to FF UID",
  },
  add: {
    build: (q) => `https://kallu-friend-management.vercel.app/adding_friend?uid=${q.uid}&password=${q.password}&friend_uid=${q.friend_uid}`,
    params: ["uid", "password", "friend_uid"],
    desc: "Send friend request",
  },
  remove: {
    build: (q) => `https://kallu-friend-management.vercel.app/remove_friend?uid=${q.uid}&password=${q.password}&friend_uid=${q.friend_uid}`,
    params: ["uid", "password", "friend_uid"],
    desc: "Remove friend",
  },
  friends: {
    build: (q) => `https://danger-friend-manager.vercel.app/get_friends_list?uid=${q.uid}&password=${q.password}`,
    params: ["uid", "password"],
    desc: "Get friends list",
    timeout: 15000,
    retry: true,
  },
  join: {
    build: (q) => `https://guild-info-danger.vercel.app/join?guild_id=${q.guild_id}&uid=${q.uid}&password=${q.password}`,
    params: ["guild_id", "uid", "password"],
    desc: "Join guild",
  },
  leave: {
    build: (q) => `https://guild-info-danger.vercel.app/leave?guild_id=${q.guild_id}&uid=${q.uid}&password=${q.password}`,
    params: ["guild_id", "uid", "password"],
    desc: "Leave guild",
  },
  ai: {
    build: (q) => `https://text.pollinations.ai/${encodeURIComponent(q.q || "")}`,
    params: ["q"],
    desc: "AI chat (pollinations)",
    plainText: true,
  },
  ghost: {
    build: (q) => `http://n4.nexcloud.in:2036/kx?teamcode=${q.teamcode}&ghostname=${encodeURIComponent(q.ghostname || "")}`,
    params: ["teamcode", "ghostname"],
    desc: "Ghost join (self-hosted)",
    timeout: 12000,
  },
};

const DEFAULT_TIMEOUT = 10000;

function ok(svc, data, upstream_status, url) {
  return {
    success: true,
    service: svc,
    brand: BRAND,
    data,
    meta: { upstream_status, url, served_at: new Date().toISOString() },
  };
}

function fail(svc, error, detail, upstream_status, url) {
  return {
    success: false,
    service: svc,
    brand: BRAND,
    error,
    detail: detail || null,
    meta: { upstream_status: upstream_status || null, url: url || null, served_at: new Date().toISOString() },
  };
}

// robust query parser — req.query Vercel pe unreliable, req.url se fallback
function parseQuery(req) {
  let q = req.query || {};
  if (Object.keys(q).length === 0 && req.url && req.url.includes("?")) {
    const idx = req.url.indexOf("?");
    const search = req.url.slice(idx);
    q = Object.fromEntries(new URLSearchParams(search).entries());
  }
  return q;
}

async function fetchOnce(url, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; GeniusApiHub/1.0)", accept: "application/json, text/plain, */*" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();

  const q = parseQuery(req);

  // svc from ?svc= OR from /api/svc/<name> path
  const pathSvc = (req.url || "").match(/\/api\/svc\/([^?/]+)/);
  const svc = String(q.svc || (pathSvc ? pathSvc[1] : "")).toLowerCase();

  // landing
  if (!svc) {
    const list = Object.entries(SERVICES).map(([k, s]) => ({
      service: k,
      desc: s.desc,
      params: s.params,
      example: `/api/hub?svc=${k}&${s.params.filter((p) => !p.endsWith("?")).map((p) => `${p}=VALUE`).join("&")}`,
    }));
    return res.status(200).json({
      success: true,
      brand: BRAND,
      endpoints: { hub: "/api/hub?svc=<service>&<params>", pathStyle: "/api/svc/<service>?<params>" },
      services: list,
      meta: { total: list.length, served_at: new Date().toISOString() },
    });
  }

  const spec = SERVICES[svc];
  if (!spec) {
    return res.status(400).json(fail(svc, "unknown service", `available: ${Object.keys(SERVICES).join(", ")}`));
  }

  for (const p of spec.params) {
    const required = !p.endsWith("?");
    const key = p.replace("?", "");
    if (required && (q[key] === undefined || q[key] === "")) {
      return res.status(400).json(fail(svc, `missing param: ${key}`, `params: ${spec.params.join(", ")}`));
    }
  }

  let url;
  try {
    url = spec.build(q);
  } catch (e) {
    return res.status(400).json(fail(svc, "bad params", e.message));
  }

  const timeout = spec.timeout || DEFAULT_TIMEOUT;

  try {
    let upstream;
    try {
      upstream = await fetchOnce(url, timeout);
    } catch (e) {
      if (spec.retry && e.name !== "AbortError") {
        await new Promise((r) => setTimeout(r, 400));
        upstream = await fetchOnce(url, timeout);
      } else throw e;
    }

    const raw = await upstream.text();

    if (spec.plainText) {
      return res.status(upstream.status).json(ok(svc, raw, upstream.status, url));
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json(fail(svc, "upstream returned non-JSON", raw.slice(0, 300), upstream.status, url));
    }

    const data = spec.shape ? spec.shape(parsed) : parsed;
    return res.status(upstream.status).json(ok(svc, data, upstream.status, url));
  } catch (e) {
    const aborted = e.name === "AbortError";
    return res.status(aborted ? 504 : 502).json(
      fail(svc, aborted ? "upstream timeout" : "upstream failed", e.message, null, url)
    );
  }
}
