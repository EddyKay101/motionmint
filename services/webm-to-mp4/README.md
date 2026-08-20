# Turnbine WebM to MP4 converter

This private conversion service accepts a raw WebM recording and returns an H.264/AAC MP4. It is intentionally separate from the Cloudflare frontend because FFmpeg requires a container runtime.

## Run locally

```bash
cd services/webm-to-mp4
docker compose up --build
```

The service listens on `http://localhost:8080`. Check it with:

```bash
curl http://localhost:8080/health
```

Convert a file:

```bash
curl --fail \
  -H 'Content-Type: video/webm' \
  -H 'X-File-Name: my-turnbine-banner.webm' \
  --data-binary @banner.webm \
  http://localhost:8080/convert \
  --output banner.mp4
```

The browser integration can send a recorded Blob directly:

```js
const response = await fetch("http://localhost:8080/convert", {
  method: "POST",
  headers: {
    "content-type": "video/webm",
    "x-file-name": "my-turnbine-banner.webm",
  },
  body: webmBlob,
});
if (!response.ok) throw new Error((await response.json()).error);
const mp4Blob = await response.blob();
```

## Configuration

- `CORS_ORIGIN`: exact Turnbine frontend origin. Do not use `*` in production.
- `MAX_UPLOAD_MB`: maximum WebM request size; default `250`.
- `MAX_CONCURRENT_CONVERSIONS`: concurrent FFmpeg processes; default `2`.
- `CONVERSION_TIMEOUT_SECONDS`: per-conversion timeout; default `300`.
- `PORT`: HTTP port; default `8080`.

Uploads and outputs use an isolated temporary directory and are deleted after each request. The service does not call external services or permanently store customer media.

For production, place this service behind HTTPS, authentication, rate limiting and a private render queue. Do not expose the conversion endpoint publicly without those controls.
