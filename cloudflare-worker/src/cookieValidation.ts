const COOKIE_SEPARATOR = '|';
export async function generateHmac(data: string, secret: string) {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: { name: 'SHA-256' } }, false, ['sign']);

	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));

	// Convert ArrayBuffer to Hex String
	return Array.from(new Uint8Array(signature))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}
export async function verifyCookie(cookieValue: string, secret: string) {
	// const [payload, signature] = cookieValue.split('.');
	// const expectedSignature = await generateHmac(payload, secret);

	// // Check if the signatures match
	// if (signature !== expectedSignature) {
	// 	throw new Error('Invalid cookie signature');
	// }

	// // Return the parsed payload
	// return JSON.parse(payload);
	//sample cookie {"userId":1234,"adFree":true};1737140158;facc468b1c67b636993f768e19b40e3bab1da60dc740069e7226d8581a170dcb
	const parts = cookieValue.split(COOKIE_SEPARATOR);
	const payload = parts.slice(0, 2).join(COOKIE_SEPARATOR); // `{"userId":1234,"adFree":true};1737140158`
	const signature = parts[2];

	// Validate the signature
	const expectedSignature = await generateHmac(payload, secret);
	if (signature !== expectedSignature) {
		throw new Error('Invalid cookie signature');
		// return { valid: false, reason: 'Invalid signature' };
	}

	// Validate the expiry timestamp
	const expiry = parseInt(payload.split(COOKIE_SEPARATOR)[1], 10); // Extract expiry timestamp
	const now = Math.floor(Date.now() / 1000); // Current timestamp
	if (now > expiry) {
		throw new Error('cookie expired');
		// return { valid: false, reason: 'Cookie expired' };
	}

	// return { valid: true };
	return JSON.parse(parts[0]);
}
