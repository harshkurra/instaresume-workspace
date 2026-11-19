/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { parse } from 'cookie';
import { handleRequestForPrerender } from './prerender';
import { verifyCookie } from './cookieValidation';

const ADS_SCRIPT = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3960735109904912';
export interface Env {
	PREMIUM_COOKIE_KEY: string;
	PRERENDER_API_KEY: string;
	ENVIRONMENT: string;
	TEST_PRERENDER: boolean;
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}
class AttributeRewriter {
	scriptSrc: string;
	PREMIUM_COOKIE_KEY: string;
	requestCookies: any;

	constructor(scriptScr: string, cookieValidationKey: string, requestCookies: any) {
		this.scriptSrc = scriptScr;
		this.PREMIUM_COOKIE_KEY = cookieValidationKey;
		this.requestCookies = requestCookies;
	}
	async element(element: Element) {
		console.log('element', element.tagName);
		const src = element.getAttribute('src');
		const COOKIE_NAME = 'IR_RISE';
		const premiumCookie = this.requestCookies || '';

		if (src === this.scriptSrc && premiumCookie[COOKIE_NAME] != null) {
			const cookieValue = premiumCookie[COOKIE_NAME];
			console.log('premiumCookies', element.tagName);
			try {
				const userData = await verifyCookie(cookieValue, this.PREMIUM_COOKIE_KEY);

				if (userData.adFree) {
					element.remove();
				}
			} catch (error) {
				// return new Response('Invalid cookie', { status: 401 });
				console.log('Invalid cookie');
			}
		}
	}
}
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		console.log(request.url);

		if (env.ENVIRONMENT === 'development' && env.TEST_PRERENDER) {
			request = new Request('https://staging.instaresume.io', request);
		}
		const responsePromise = handleRequestForPrerender(request, env.ENVIRONMENT, env.PRERENDER_API_KEY);
		if (responsePromise) {
			console.log('passing to prerender');
			return (await responsePromise) as any;
		} else {
			if (env.ENVIRONMENT === 'development') {
				request = new Request('http://localhost:3000/', request);
			}
			console.log('No prerender');
		}
		let response = null as any;

		response = await fetch(request); //await responsePromise; //

		const rewriter = new HTMLRewriter().on(
			'script',
			new AttributeRewriter(ADS_SCRIPT, env.PREMIUM_COOKIE_KEY, parse(request.headers.get('Cookie') || ''))
		);

		// Make sure we only modify text, not images.
		let type = response.headers.get('Content-Type') || '';
		// If the response is HTML, it can be transformed with
		// HTMLRewriter -- otherwise, it should pass through
		if (type.startsWith('text/html')) {
			return rewriter.transform(response as any);
		} else {
			return response as any;
		}
		// if (!type.startsWith('text/html')) {
		// 	// Not text. Don't modify.
		// 	return response as any;
		// }

		// // Create a pipe. The readable side will become our
		// // new response body.
		// let { readable, writable } = new TransformStream();

		// // Start processing the body. NOTE: No await!
		// // streamTransformBody(response.body, writable);

		// // ... and create our Response while that's running.
		// var html = await response.text();

		// const COOKIE_NAME = 'myAwesomeCookieName2';
		// const cookie = parse(request.headers.get('Cookie') || '');
		// if (cookie[COOKIE_NAME] != null && cookie[COOKIE_NAME] === 'true') {
		// 	// Respond with the cookie value
		// 	// return new Response(cookie[COOKIE_NAME] + request.cf?.country);
		// 	html = html.replace(/3960735109904912/g, '');
		// }
		// // Simple replacement regex

		// return new Response(cookie[COOKIE_NAME] + html, response);

		// return new Response('No cookie with name: ' + COOKIE_NAME);
	},
};
