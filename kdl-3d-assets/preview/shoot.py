"""Render GLB files through real three.js in headless Chromium and screenshot."""
import http.server, socketserver, threading, sys, os, urllib.parse, functools, time
from playwright.sync_api import sync_playwright

ROOT = "/home/user/kdl3d"
PORT = 8731


def serve():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), h)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def shoot(files, out, w=900, h=620, clip="", t=0.0, gap=1.4, yaw=0.6):
    q = urllib.parse.urlencode({"files": ",".join(files), "w": w, "h": h,
                                "clip": clip, "t": t, "gap": gap, "yaw": yaw})
    url = f"http://127.0.0.1:{PORT}/kdl/preview/view.html?{q}"
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--use-gl=angle", "--use-angle=swiftshader",
                                    "--enable-unsafe-swiftshader",
                                    "--disable-gpu-sandbox"])
        pg = b.new_page(viewport={"width": w, "height": h},
                        device_scale_factor=2)
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(url, wait_until="load")
        pg.wait_for_function("window.__ready === true", timeout=60000)
        err = pg.evaluate("window.__err || null")
        if err:
            print("RENDER ERROR:", err, file=sys.stderr)
        if errs:
            print("CONSOLE:", errs[:4], file=sys.stderr)
        pg.locator("canvas").screenshot(path=out)
        b.close()
    return out


if __name__ == "__main__":
    httpd = serve()
    files = sys.argv[1].split(",")
    out = sys.argv[2]
    clip = sys.argv[3] if len(sys.argv) > 3 else ""
    t = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
    shoot(files, out, clip=clip, t=t)
    print("wrote", out, os.path.getsize(out), "bytes")
