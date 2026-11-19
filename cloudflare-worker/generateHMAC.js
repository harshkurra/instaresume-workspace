const crypto = require('crypto');

// Secret key for signing
const SECRET_KEY = '7e66067bee5cca0ad974bdd68a919bf5cdabebbf65fbccae53a9e244e47cd1b3';
const COOKIE_SEPARATOR = '|';
// // Function to sign a payload
// function signCookie(payload) {
// 	const data = JSON.stringify(payload);
// 	const signature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
// 	return `${data}.${signature}`;
// }

// // Example usage
// const cookieValue = signCookie({ userId: 123, adFree: true });
// console.log('Signed Cookie:', cookieValue);

function generateCookie(payload, durationInDays, secretKey) {
	const data = JSON.stringify(payload);
	const expiryTimestamp = Math.floor(Date.now() / 1000) + durationInDays * 24 * 60 * 60; // Expiry in UNIX timestamp
	const cookiePayload = `${data}${COOKIE_SEPARATOR}${expiryTimestamp}`;

	// Optional: Generate a signature for the cookie
	const signature = crypto.createHmac('sha256', secretKey).update(cookiePayload).digest('hex');

	// Combine the payload and signature
	const signedCookie = `${cookiePayload}${COOKIE_SEPARATOR}${signature}`;
	return signedCookie;
}

// Example usage:
const payload = { userId: 1234, adFree: true };
const adFreeDuration = 30; // Ad-free for 30 days

const cookie = generateCookie(payload, adFreeDuration, SECRET_KEY);
console.log('Generated Cookie:', cookie);

// app.post('/purchase-adfree', (req, res) => {
// 	const userId = req.body.userId;
// 	const adFreeDuration = 30; // 30 days
// 	const secretKey = 'your-secure-secret-key';

// 	const cookie = generateCookie(userId, adFreeDuration, secretKey);

// 	res.cookie('IR_RISE', cookie, {
// 		httpOnly: true,
// 		secure: true,
// 		sameSite: 'Strict',
// 		maxAge: adFreeDuration * 24 * 60 * 60 * 1000, // Expiry in milliseconds
// 	});

// 	res.send('Ad-free experience activated!');
// });
