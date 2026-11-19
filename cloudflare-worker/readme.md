# Cloudflare Worker for InstaResume.io

This repository contains the Cloudflare Worker code used for specific functionalities on [InstaResume.io](https://instaresume.io).

## How to Run Locally

Follow these steps to set up and test the worker locally:

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine
- [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/) installed
- [Postman](https://www.postman.com/downloads/) or any HTTP client for testing
- InstaResume frontend running on port `3000`

### Steps to Run Locally

1. Install dependencies:

   ```bash
   yarn
   ```

2. Start local development server:

   ```bash
   yarn local_dev
   ```

   - Press `d` to open the devtool and debug the worker code.

3. Generate a dummy cookie:

   ```bash
   node generateHMAC.js
   ```

4. Ensure the InstaResume frontend is running on port `3000`.

5. Open Postman or an HTTP client and make a request to the worker:
   ```
   http://127.0.0.1:8787
   ```
   - Before making this request, use the cookie generated in step 3.

## Testing the Worker

The worker supports two main functionalities for testing:

### 1. Prerender

- To test the prerender functionality:
  - Set `TEST_PRERENDER = true` in the `wrangler.toml` file.
  - You will receive the actual staging home page view in the Postman response.

### 2. Cookie Testing

- To test cookie behavior:
  - Set `TEST_PRERENDER = false` in the `wrangler.toml` file.
  - If the cookie is valid, the HTML response will not include Google Ads.
  - If the cookie is invalid, Google Ads will be included in the HTML response.

## Notes

- Make sure to configure your `wrangler.toml` file correctly for the tests.
- Debugging tools can be accessed by pressing `d` while running the local development server.
