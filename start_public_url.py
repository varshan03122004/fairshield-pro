from pyngrok import ngrok
import http.server
import socketserver
import threading
import time

PORT = 3000

def start_server():
    Handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

# Start local server in a thread
threading.Thread(target=start_server, daemon=True).start()

# Open a ngrok tunnel to the HTTP server
public_url = ngrok.connect(PORT).public_url
print(f"Public URL: {public_url}/frontend_vanilla/fairshield_pro.html")

# Keep the script running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Shutting down...")
