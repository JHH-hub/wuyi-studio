"""Serve only dist over loopback; used by the double-click preview launcher."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent / 'dist'
    if not (root / 'index.html').is_file():
        raise SystemExit('dist/index.html is missing. Keep the project folders together.')
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    server = None
    for port in range(4178, 4190):
        try:
            server = ThreadingHTTPServer(('127.0.0.1', port), handler)
            break
        except OSError:
            continue
    if server is None:
        raise SystemExit('Preview ports 4178-4189 are busy. Close a previous preview and retry.')
    url = f'http://127.0.0.1:{server.server_port}/'
    print(f'WUYI preview: {url}', flush=True)
    print('Keep this window open. Press Ctrl+C or close it to stop.', flush=True)
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
