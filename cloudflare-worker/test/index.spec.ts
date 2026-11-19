// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../src/index';
import { generateHmac, verifyCookie } from '../src/cookieValidation';
import { handleRequestForPrerender } from '../src/prerender';

// ─── cookieValidation ────────────────────────────────────────────────────────

describe('generateHmac', () => {
	it('returns a consistent hex string for the same input', async () => {
		const a = await generateHmac('payload', 'secret');
		const b = await generateHmac('payload', 'secret');
		expect(a).toBe(b);
		expect(a).toMatch(/^[0-9a-f]{64}$/); // SHA-256 → 32 bytes → 64 hex chars
	});

	it('produces different output for different data', async () => {
		const a = await generateHmac('data-a', 'secret');
		const b = await generateHmac('data-b', 'secret');
		expect(a).not.toBe(b);
	});

	it('produces different output for different secrets', async () => {
		const a = await generateHmac('data', 'secret-a');
		const b = await generateHmac('data', 'secret-b');
		expect(a).not.toBe(b);
	});
});

describe('verifyCookie', () => {
	const SECRET = 'test-secret';

	async function makeCookie(payload: object, expiryOffsetSeconds = 3600): Promise<string> {
		const expiry = Math.floor(Date.now() / 1000) + expiryOffsetSeconds;
		const json = JSON.stringify(payload);
		const data = `${json}|${expiry}`;
		const sig = await generateHmac(data, SECRET);
		return `${data}|${sig}`;
	}

	it('returns parsed payload for a valid cookie', async () => {
		const cookie = await makeCookie({ userId: 42, adFree: true });
		const result = await verifyCookie(cookie, SECRET);
		expect(result).toEqual({ userId: 42, adFree: true });
	});

	it('throws for an expired cookie', async () => {
		const cookie = await makeCookie({ userId: 42, adFree: true }, -100);
		await expect(verifyCookie(cookie, SECRET)).rejects.toThrow('cookie expired');
	});

	it('throws for a tampered cookie (invalid signature)', async () => {
		const cookie = await makeCookie({ userId: 42, adFree: true });
		const tampered = cookie.slice(0, -5) + 'zzzzz';
		await expect(verifyCookie(tampered, SECRET)).rejects.toThrow('Invalid cookie signature');
	});

	it('returns adFree: false when cookie payload has adFree: false', async () => {
		const cookie = await makeCookie({ userId: 99, adFree: false });
		const result = await verifyCookie(cookie, SECRET);
		expect(result.adFree).toBe(false);
	});
});

// ─── prerender detection ──────────────────────────────────────────────────────

describe('handleRequestForPrerender', () => {
	it('returns a truthy value (prerender fetch) for Googlebot on instaresume.io', () => {
		const req = new Request('https://instaresume.io/blog', {
			headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
		});
		expect(handleRequestForPrerender(req, 'production', 'api-key')).not.toBe(false);
	});

	it('returns false for a regular browser user-agent', () => {
		const req = new Request('https://instaresume.io/blog', {
			headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
		});
		expect(handleRequestForPrerender(req, 'production', 'api-key')).toBe(false);
	});

	it('returns false for an ignored file extension (.js)', () => {
		const req = new Request('https://instaresume.io/static/app.js', {
			headers: { 'User-Agent': 'Googlebot/2.1' },
		});
		expect(handleRequestForPrerender(req, 'production', 'api-key')).toBe(false);
	});

	it('returns false for an ignored file extension (.css)', () => {
		const req = new Request('https://instaresume.io/static/main.css', {
			headers: { 'User-Agent': 'Googlebot/2.1' },
		});
		expect(handleRequestForPrerender(req, 'production', 'api-key')).toBe(false);
	});

	it('returns false for /edit pages (do not prerender the resume editor)', () => {
		const req = new Request('https://instaresume.io/resumes/abc123/edit', {
			headers: { 'User-Agent': 'Googlebot/2.1' },
		});
		expect(handleRequestForPrerender(req, 'production', 'api-key')).toBe(false);
	});

	it('returns false when X-Prerender header is set (prevents infinite loop)', () => {
		const req = new Request('https://instaresume.io/blog', {
			headers: { 'User-Agent': 'Googlebot/2.1', 'X-Prerender': '1' },
		});
		expect(handleRequestForPrerender(req, 'production', 'api-key')).toBe(false);
	});

	it('returns false for an unknown domain', () => {
		const req = new Request('https://otherdomain.com/page', {
			headers: { 'User-Agent': 'Googlebot/2.1' },
		});
		expect(handleRequestForPrerender(req, 'production', 'api-key')).toBe(false);
	});
});

// ─── worker fetch handler ─────────────────────────────────────────────────────

const ADS_SRC =
	'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3960735109904912';

function htmlWithAds(): string {
	return `<html><body><script src="${ADS_SRC}"></script><p>Hello</p></body></html>`;
}

const PROD_ENV = {
	...env,
	ENVIRONMENT: 'production',
	PRERENDER_API_KEY: '',
	PREMIUM_COOKIE_KEY: 'test-key',
	TEST_PRERENDER: false,
};

async function makePremiumCookie(secret: string, adFree: boolean): Promise<string> {
	const expiry = Math.floor(Date.now() / 1000) + 3600;
	const json = JSON.stringify({ userId: 42, adFree });
	const data = `${json}|${expiry}`;
	const sig = await generateHmac(data, secret);
	return `${data}|${sig}`;
}

describe('Worker fetch handler', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('passes non-HTML responses through unchanged', async () => {
		vi.stubGlobal('fetch', async () => new Response('{"ok":true}', { headers: { 'Content-Type': 'application/json' } }));
		const req = new Request('https://instaresume.io/api/data');
		const ctx = createExecutionContext();
		const res = await worker.fetch(req, PROD_ENV, ctx);
		await waitOnExecutionContext(ctx);
		expect(res.headers.get('Content-Type')).toBe('application/json');
		expect(await res.text()).toBe('{"ok":true}');
	});

	it('returns HTML unchanged when there is no IR_RISE cookie', async () => {
		vi.stubGlobal('fetch', async () => new Response(htmlWithAds(), { headers: { 'Content-Type': 'text/html' } }));
		const req = new Request('https://instaresume.io/');
		const ctx = createExecutionContext();
		const res = await worker.fetch(req, PROD_ENV, ctx);
		await waitOnExecutionContext(ctx);
		expect(await res.text()).toContain(ADS_SRC);
	});

	it('removes AdSense <script> for a premium user with a valid adFree:true cookie', async () => {
		vi.stubGlobal('fetch', async () => new Response(htmlWithAds(), { headers: { 'Content-Type': 'text/html' } }));
		const cookieValue = await makePremiumCookie(PROD_ENV.PREMIUM_COOKIE_KEY, true);
		const req = new Request('https://instaresume.io/', {
			headers: { Cookie: `IR_RISE=${encodeURIComponent(cookieValue)}` },
		});
		const ctx = createExecutionContext();
		const res = await worker.fetch(req, PROD_ENV, ctx);
		await waitOnExecutionContext(ctx);
		expect(await res.text()).not.toContain(ADS_SRC);
	});

	it('keeps AdSense <script> for a user with adFree:false cookie', async () => {
		vi.stubGlobal('fetch', async () => new Response(htmlWithAds(), { headers: { 'Content-Type': 'text/html' } }));
		const cookieValue = await makePremiumCookie(PROD_ENV.PREMIUM_COOKIE_KEY, false);
		const req = new Request('https://instaresume.io/', {
			headers: { Cookie: `IR_RISE=${encodeURIComponent(cookieValue)}` },
		});
		const ctx = createExecutionContext();
		const res = await worker.fetch(req, PROD_ENV, ctx);
		await waitOnExecutionContext(ctx);
		expect(await res.text()).toContain(ADS_SRC);
	});

	it('keeps AdSense <script> when IR_RISE cookie has an invalid signature', async () => {
		vi.stubGlobal('fetch', async () => new Response(htmlWithAds(), { headers: { 'Content-Type': 'text/html' } }));
		const req = new Request('https://instaresume.io/', {
			headers: { Cookie: 'IR_RISE=invalid-garbage-cookie' },
		});
		const ctx = createExecutionContext();
		const res = await worker.fetch(req, PROD_ENV, ctx);
		await waitOnExecutionContext(ctx);
		expect(await res.text()).toContain(ADS_SRC);
	});
});
