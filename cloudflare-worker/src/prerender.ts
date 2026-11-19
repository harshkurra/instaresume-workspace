// The domains that you want to be prerendered.
const PRERENDERED_DOMAINS = ['instaresume.io', 'www.instaresume.io'];

// These are the user agents that the worker will look for to
// initiate prerendering of the site.
const BOT_AGENTS = [
	'googlebot',
	'yahoo! slurp',
	'bingbot',
	'yandex',
	'baiduspider',
	'facebookexternalhit',
	'twitterbot',
	'rogerbot',
	'linkedinbot',
	'embedly',
	'quora link preview',
	'showyoubot',
	'outbrain',
	'pinterest/0.',
	'developers.google.com/+/web/snippet',
	'slackbot',
	'vkshare',
	'w3c_validator',
	'redditbot',
	'applebot',
	'whatsapp',
	'flipboard',
	'tumblr',
	'bitlybot',
	'skypeuripreview',
	'nuzzel',
	'discordbot',
	'google page speed',
	'qwantify',
	'pinterestbot',
	'bitrix link preview',
	'xing-contenttabreceiver',
	'chrome-lighthouse',
	'telegrambot',
];

// These are the extensions that the worker will skip prerendering
// even if any other conditions pass.
const IGNORE_EXTENSIONS = [
	'.js',
	'.css',
	'.xml',
	'.less',
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.pdf',
	'.doc',
	'.txt',
	'.ico',
	'.rss',
	'.zip',
	'.mp3',
	'.rar',
	'.exe',
	'.wmv',
	'.doc',
	'.avi',
	'.ppt',
	'.mpg',
	'.mpeg',
	'.tif',
	'.wav',
	'.mov',
	'.psd',
	'.ai',
	'.xls',
	'.mp4',
	'.m4a',
	'.swf',
	'.dat',
	'.dmg',
	'.iso',
	'.flv',
	'.m4v',
	'.torrent',
	'.woff',
	'.ttf',
	'.svg',
	'.webmanifest',
	'.webp',
];

/**
 * Returns a prerender fetch promise if the request should be prerendered,
 * or false if it should be handled normally.
 *
 * @param request - The incoming request
 * @param environment - Value of ENVIRONMENT env var ('development' | 'production')
 * @param prerenderApiKey - Value of PRERENDER_API_KEY secret
 */
export function handleRequestForPrerender(request: Request, environment: string, prerenderApiKey: string) {
	const url = new URL(request.url);

	const { hostname } = url;
	const requestUserAgent = (request.headers.get('User-Agent') || '').toLowerCase();
	const xPrerender = request.headers.get('X-Prerender');
	const pathName = url.pathname.toLowerCase();
	const ext = pathName.substring(pathName.lastIndexOf('.') || pathName.length);
	const isEditPage = pathName.substring(pathName.lastIndexOf('/') || pathName.length) == '/edit';

	if (
		!xPrerender &&
		containsOneOfThem(BOT_AGENTS, requestUserAgent) &&
		!isOneOfThem(IGNORE_EXTENSIONS, ext) &&
		isOneOfThem([...PRERENDERED_DOMAINS, environment === 'development' ? 'staging.instaresume.io' : ''], hostname) &&
		!isEditPage
	) {
		return prerenderRequest(request, prerenderApiKey);
	}
	return false;
}

function isOneOfThem(array: Array<string>, element: string) {
	return array.some((e) => e === element);
}

function containsOneOfThem(array: Array<string>, element: string) {
	return array.some((e) => element.indexOf(e) !== -1);
}

function prerenderRequest(request: Request, apiKey: string) {
	const { url, headers } = request;
	const prerenderUrl = `https://service.prerender.io/${url}`;
	const headersToSend = new Headers(headers);

	headersToSend.set('X-Prerender-Token', apiKey);

	const prerenderRequest = new Request(prerenderUrl, {
		headers: headersToSend,
		redirect: 'manual',
	});

	return fetch(prerenderRequest);
}
