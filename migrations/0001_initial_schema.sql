CREATE TABLE IF NOT EXISTS clicks (
	click_id TEXT PRIMARY KEY,
	target_url TEXT NOT NULL,
	utm_source TEXT,
	utm_medium TEXT,
	utm_campaign TEXT,
	utm_content TEXT,
	utm_term TEXT,
	fbclid TEXT,
	gclid TEXT,
	ttclid TEXT,
	msclkid TEXT,
	user_agent TEXT,
	referer TEXT,
	created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_clicks_campaign ON clicks(utm_campaign);

CREATE TABLE IF NOT EXISTS leads (
	id TEXT PRIMARY KEY,
	click_id TEXT NOT NULL,
	name TEXT,
	phone TEXT,
	email TEXT,
	metadata TEXT,
	created_at TEXT NOT NULL,
	FOREIGN KEY (click_id) REFERENCES clicks(click_id)
);

CREATE INDEX IF NOT EXISTS idx_leads_click_id ON leads(click_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

CREATE TABLE IF NOT EXISTS tracked_links (
	id TEXT PRIMARY KEY,
	target_url TEXT NOT NULL,
	tracked_url TEXT NOT NULL,
	shlink_response TEXT,
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_events (
	id TEXT PRIMARY KEY,
	event_type TEXT NOT NULL,
	status INTEGER,
	payload TEXT NOT NULL,
	created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
