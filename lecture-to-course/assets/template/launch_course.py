#!/usr/bin/env python3
"""Serve this course on loopback when a browser restricts file:// companions."""

import argparse
import threading
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--no-browser", action="store_true", help="Print the URL without opening a browser"
    )
    parser.add_argument(
        "--port", type=int, default=0, help="Local port; default chooses a free port"
    )
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    if not (root / "index.html").is_file():
        parser.error("Keep this launcher inside the generated course folder beside index.html.")
    try:
        server = ThreadingHTTPServer(
            ("127.0.0.1", args.port), partial(SimpleHTTPRequestHandler, directory=str(root))
        )
    except OSError as error:
        parser.error(
            f"Cannot start local course server: {error}. Try omitting --port to select a free port."
        )
    url = f"http://127.0.0.1:{server.server_port}/index.html"
    print(url, flush=True)
    print(
        "Keep this window open while studying. Press Control+C to stop. No internet connection is needed.",
        flush=True,
    )
    print("学习期间请保留此窗口；按 Control+C 停止。仅本机可访问，无需联网。", flush=True)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        if not args.no_browser:
            try:
                webbrowser.open(url)
            except webbrowser.Error:
                print("Open the URL above in your browser.", flush=True)
        threading.Event().wait()
    except KeyboardInterrupt:
        pass
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
