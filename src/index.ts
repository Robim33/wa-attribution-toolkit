type Env = {
	DB: D1Database;
	N8N_WEBHOOK_URL?: string;
	SHLINK_API_URL?: string;
	SHLINK_API_KEY?: string;
	DEFAULT_WHATSAPP_PHONE?: string;
	DEFAULT_REDIRECT_URL?: string;
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

function createClickId() {
	return crypto.randomUUID();
}

function nowIso() {
	return new Date().toISOString();
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

async function handleStats(env: Env) {
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
			if (url.pathname === "/health") return json({ ok: true, service: "wa-attribution-toolkit" });
			if (url.pathname === "/track" && request.method === "GET") return handleTrack(request, env);
			if (url.pathname === "/leads" && request.method === "POST") return handleLead(request, env);
			if (url.pathname === "/links" && request.method === "POST") return handleCreateLink(request, env);
			if (url.pathname === "/stats" && request.method === "GET") return handleStats(env);

			return json({ error: "not_found" }, { status: 404 });
		} catch (error) {
			return json(
				{ error: "internal_error", message: error instanceof Error ? error.message : "Unknown error" },
				{ status: 500 },
			);
		}
	},
} satisfies ExportedHandler<Env>;
