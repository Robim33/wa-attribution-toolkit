type Env = {
	DB: D1Database;
	N8N_WEBHOOK_URL?: string;
	SHLINK_API_URL?: string;
	SHLINK_API_KEY?: string;
	DEFAULT_WHATSAPP_PHONE?: string;
	DEFAULT_REDIRECT_URL?: string;
	ADMIN_TOKEN?: string;
};

type LeadPayload = {
	click_id?: string;
	name?: string;
	phone?: string;
	email?: string;
	metadata?: Record<string, unknown>;
};

type LinkPayload = {
	target_url?: string;
	title?: string;
	campaign?: string;
	tags?: string[];
};

const TRACKING_PARAMS = [
	"utm_source",
	"utm_medium",
	"utm_campaign",
	"utm_content",
	"utm_term",
	"fbclid",
	"gclid",
	"ttclid",
	"msclkid",
];

function json(data: unknown, init: ResponseInit = {}) {
	return new Response(JSON.stringify(data, null, 2), {
		...init,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"access-control-allow-origin": "*",
			"access-control-allow-methods": "GET,POST,OPTIONS",
			"access-control-allow-headers": "content-type,authorization",
			...init.headers,
		},
	});
}

function html(body: string, init: ResponseInit = {}) {
	return new Response(body, {
		...init,
		headers: {
			"content-type": "text/html; charset=utf-8",
			...init.headers,
		},
	});
}

function createClickId() {
	return crypto.randomUUID();
}

function nowIso() {
	return new Date().toISOString();
}

function isAdminRequest(request: Request, env: Env) {
	if (!env.ADMIN_TOKEN) return true;
	return request.headers.get("authorization") === `Bearer ${env.ADMIN_TOKEN}`;
}

function normalizeTarget(url: URL, env: Env) {
	const target = url.searchParams.get("target") || env.DEFAULT_REDIRECT_URL;
	if (target) return target;

	if (env.DEFAULT_WHATSAPP_PHONE) {
		return `https://wa.me/${env.DEFAULT_WHATSAPP_PHONE}`;
	}

	return "https://wa.me/";
}

function getTrackingData(url: URL) {
	return Object.fromEntries(
		TRACKING_PARAMS.map((param) => [param, url.searchParams.get(param)]).filter(([, value]) => value),
	);
}

function appendClickId(target: string, clickId: string) {
	const targetUrl = new URL(target);
	const existingText = targetUrl.searchParams.get("text");

	if (targetUrl.hostname === "wa.me" || targetUrl.hostname.endsWith("whatsapp.com")) {
		const suffix = `Tracking ID: ${clickId}`;
		targetUrl.searchParams.set("text", existingText ? `${existingText}\n${suffix}` : suffix);
		return targetUrl.toString();
	}

	targetUrl.searchParams.set("click_id", clickId);
	return targetUrl.toString();
}

function handleHome(request: Request) {
	const baseUrl = new URL(request.url).origin;

	return html(`<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>WA Attribution Toolkit</title>
	<style>
		body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #0f172a; color: #e5e7eb; }
		main { max-width: 920px; margin: 0 auto; padding: 56px 24px; }
		.card { background: #111827; border: 1px solid #334155; border-radius: 18px; padding: 32px; box-shadow: 0 24px 70px rgba(0,0,0,.25); }
		h1 { margin: 0 0 12px; font-size: 34px; }
		p { color: #cbd5e1; line-height: 1.6; }
		code, pre { background: #020617; color: #d1fae5; border-radius: 10px; }
		pre { padding: 16px; overflow-x: auto; }
		a { color: #93c5fd; }
		.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-top: 24px; }
		.item { border: 1px solid #334155; border-radius: 14px; padding: 16px; background: #0b1120; }
		.badge { display: inline-block; margin-bottom: 18px; padding: 6px 10px; border-radius: 999px; background: #064e3b; color: #a7f3d0; font-size: 13px; }
	</style>
</head>
<body>
	<main>
		<section class="card">
			<span class="badge">Live demo online</span>
			<h1>WA Attribution Toolkit</h1>
			<p>Open-source attribution toolkit for WhatsApp-first funnels using UTMs, click IDs, Cloudflare Workers, D1, Shlink and n8n automation.</p>
			<div class="grid">
				<div class="item"><strong>Health</strong><br><a href="${baseUrl}/health">/health</a></div>
				<div class="item"><strong>Track demo</strong><br><a href="${baseUrl}/track?target=https://example.com&utm_source=demo&utm_campaign=homepage">/track</a></div>
				<div class="item"><strong>GitHub</strong><br><a href="https://github.com/Robim33/wa-attribution-toolkit">Repository</a></div>
			</div>
			<h2>Example request</h2>
			<pre><code>GET ${baseUrl}/track?target=https://example.com&amp;utm_source=demo&amp;utm_campaign=homepage</code></pre>
			<p>This public demo is intended for fake data only. Do not send real customer data, private webhook URLs or production campaign identifiers.</p>
		</section>
	</main>
</body>
</html>`);
}

async function forwardWebhook(env: Env, event: string, payload: Record<string, unknown>) {
	if (!env.N8N_WEBHOOK_URL) return { forwarded: false, status: null };

	const response = await fetch(env.N8N_WEBHOOK_URL, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ event, ...payload }),
	});

	await env.DB.prepare(
		"INSERT INTO webhook_events (id, event_type, status, payload, created_at) VALUES (?, ?, ?, ?, ?)",
	)
		.bind(crypto.randomUUID(), event, response.status, JSON.stringify(payload), nowIso())
		.run();

	return { forwarded: true, status: response.status };
}

async function handleTrack(request: Request, env: Env) {
	const url = new URL(request.url);
	const clickId = createClickId();
	const target = normalizeTarget(url, env);
	const tracking = getTrackingData(url);
	const userAgent = request.headers.get("user-agent");
	const referer = request.headers.get("referer");

	await env.DB.prepare(
		`INSERT INTO clicks (
			click_id, target_url, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
			fbclid, gclid, ttclid, msclkid, user_agent, referer, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	)
		.bind(
			clickId,
			target,
			tracking.utm_source || null,
			tracking.utm_medium || null,
			tracking.utm_campaign || null,
			tracking.utm_content || null,
			tracking.utm_term || null,
			tracking.fbclid || null,
			tracking.gclid || null,
			tracking.ttclid || null,
			tracking.msclkid || null,
			userAgent,
			referer,
			nowIso(),
		)
		.run();

	await forwardWebhook(env, "click_created", {
		click_id: clickId,
		target_url: target,
		tracking,
		user_agent: userAgent,
		referer,
	});

	return Response.redirect(appendClickId(target, clickId), 302);
}

async function handleLead(request: Request, env: Env) {
	const payload = (await request.json().catch(() => null)) as LeadPayload | null;

	if (!payload?.click_id) {
		return json({ error: "click_id is required" }, { status: 400 });
	}

	const leadId = crypto.randomUUID();
	const createdAt = nowIso();

	await env.DB.prepare(
		"INSERT INTO leads (id, click_id, name, phone, email, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
	)
		.bind(
			leadId,
			payload.click_id,
			payload.name || null,
			payload.phone || null,
			payload.email || null,
			JSON.stringify(payload.metadata || {}),
			createdAt,
		)
		.run();

	const webhook = await forwardWebhook(env, "lead_created", {
		lead_id: leadId,
		click_id: payload.click_id,
		name: payload.name || null,
		phone: payload.phone || null,
		email: payload.email || null,
		metadata: payload.metadata || {},
		created_at: createdAt,
	});

	return json({ id: leadId, click_id: payload.click_id, webhook }, { status: 201 });
}

async function createShlinkUrl(env: Env, payload: LinkPayload, localTrackedUrl: string) {
	if (!env.SHLINK_API_URL || !env.SHLINK_API_KEY) return null;

	const response = await fetch(`${env.SHLINK_API_URL.replace(/\/$/, "")}/rest/v3/short-urls`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"X-Api-Key": env.SHLINK_API_KEY,
		},
		body: JSON.stringify({
			longUrl: localTrackedUrl,
			tags: payload.tags || ["wa-attribution-toolkit"],
			title: payload.title || payload.campaign || "Tracked WhatsApp link",
		}),
	});

	if (!response.ok) {
		return { ok: false, status: response.status, error: await response.text() };
	}

	return { ok: true, body: await response.json() };
}

async function handleCreateLink(request: Request, env: Env) {
	const payload = (await request.json().catch(() => null)) as LinkPayload | null;

	if (!payload?.target_url) {
		return json({ error: "target_url is required" }, { status: 400 });
	}

	const requestUrl = new URL(request.url);
	const trackedUrl = new URL("/track", requestUrl.origin);
	trackedUrl.searchParams.set("target", payload.target_url);
	if (payload.campaign) trackedUrl.searchParams.set("utm_campaign", payload.campaign);

	const shlink = await createShlinkUrl(env, payload, trackedUrl.toString());

	await env.DB.prepare(
		"INSERT INTO tracked_links (id, target_url, tracked_url, shlink_response, created_at) VALUES (?, ?, ?, ?, ?)",
	)
		.bind(crypto.randomUUID(), payload.target_url, trackedUrl.toString(), JSON.stringify(shlink), nowIso())
		.run();

	return json({ tracked_url: trackedUrl.toString(), shlink });
}

async function handleStats(request: Request, env: Env) {
	if (!isAdminRequest(request, env)) {
		return json({ error: "unauthorized" }, { status: 401 });
	}

	const clicks = await env.DB.prepare("SELECT COUNT(*) as total FROM clicks").first<{ total: number }>();
	const leads = await env.DB.prepare("SELECT COUNT(*) as total FROM leads").first<{ total: number }>();
	const recentClicks = await env.DB.prepare(
		"SELECT click_id, target_url, utm_source, utm_campaign, created_at FROM clicks ORDER BY created_at DESC LIMIT 20",
	).all();

	return json({
		clicks: clicks?.total || 0,
		leads: leads?.total || 0,
		recent_clicks: recentClicks.results,
	});
}

export default {
	async fetch(request, env): Promise<Response> {
		if (request.method === "OPTIONS") return json({ ok: true });

		const url = new URL(request.url);

		try {
			if (url.pathname === "/" && request.method === "GET") return handleHome(request);
			if (url.pathname === "/health") return json({ ok: true, service: "wa-attribution-toolkit" });
			if (url.pathname === "/track" && request.method === "GET") return handleTrack(request, env);
			if (url.pathname === "/leads" && request.method === "POST") return handleLead(request, env);
			if (url.pathname === "/links" && request.method === "POST") return handleCreateLink(request, env);
			if (url.pathname === "/stats" && request.method === "GET") return handleStats(request, env);

			return json({ error: "not_found" }, { status: 404 });
		} catch (error) {
			return json(
				{ error: "internal_error", message: error instanceof Error ? error.message : "Unknown error" },
				{ status: 500 },
			);
		}
	},
} satisfies ExportedHandler<Env>;
