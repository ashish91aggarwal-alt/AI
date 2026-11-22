#!/usr/bin/env python3
"""One-time, on YOUR computer: get a refresh token for the YouTube Analytics API.

  python3 scripts/oauth_setup.py client_secret.json

Opens the Google consent page in your browser, catches the redirect on localhost,
prints YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN to paste into GitHub secrets.
Standard library only. Read-only scopes.
"""
import http.server, json, sys, threading, urllib.parse, urllib.request, webbrowser

SCOPES = "https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.readonly"
PORT = 8765


def main():
    cfg = json.load(open(sys.argv[1]))
    cfg = cfg.get("installed") or cfg.get("web")
    redirect = f"http://localhost:{PORT}/"
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode({
        "client_id": cfg["client_id"], "redirect_uri": redirect, "response_type": "code",
        "scope": SCOPES, "access_type": "offline", "prompt": "consent"})
    got = {}

    class H(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            got.update(urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query))
            self.send_response(200); self.end_headers()
            self.wfile.write(b"Done - you can close this tab.")
        def log_message(self, *a):
            pass

    srv = http.server.HTTPServer(("localhost", PORT), H)
    threading.Thread(target=srv.handle_request, daemon=True).start()
    print("Opening browser for consent...\n" + url)
    webbrowser.open(url)
    while "code" not in got and "error" not in got:
        pass
    if "error" in got:
        sys.exit(f"Consent failed: {got['error']}")
    body = urllib.parse.urlencode({"code": got["code"][0], "client_id": cfg["client_id"],
                                   "client_secret": cfg["client_secret"], "redirect_uri": redirect,
                                   "grant_type": "authorization_code"}).encode()
    tok = json.loads(urllib.request.urlopen("https://oauth2.googleapis.com/token", body).read())
    print("\nAdd these as GitHub Actions secrets:")
    print("YT_CLIENT_ID     =", cfg["client_id"])
    print("YT_CLIENT_SECRET =", cfg["client_secret"])
    print("YT_REFRESH_TOKEN =", tok.get("refresh_token"))


if __name__ == "__main__":
    main()
