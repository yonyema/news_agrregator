import json, sqlite3, hashlib, re, time
from datetime import datetime, timezone
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template
from apscheduler.schedulers.background import BackgroundScheduler

DB = "news.db"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; NewsAggregator/1.0)"}
app = Flask(__name__)

def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    con = db()
    con.execute("""CREATE TABLE IF NOT EXISTS articles(
        id TEXT PRIMARY KEY, title TEXT NOT NULL, url TEXT UNIQUE NOT NULL,
        source_url TEXT, source TEXT, published TEXT, excerpt TEXT,
        first_seen TEXT NOT NULL, updated_at TEXT NOT NULL
    )""")
    con.commit(); con.close()

def source_name(url):
    host = re.sub(r"^www\.", "", url.split("/")[2])
    return host

def clean(s):
    return re.sub(r"\s+", " ", s or "").strip()

def extract(page_url):
    r = requests.get(page_url, headers=HEADERS, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    out = []
    # Prefer canonical article links and common news-card anchors.
    seen = set()
    for a in soup.select("a[href]"):
        href = urljoin(page_url, a.get("href"))
        title = clean(a.get_text(" ", strip=True))
        if not title or len(title) < 8 or len(title) > 180:
            continue
        if href.startswith(("javascript:", "#")):
            continue
        # Heuristics: article URLs usually contain these patterns.
        if not re.search(r"(news|article|story|content|reporter|author|politics|society|business|world|life|entertain|politic)", href, re.I):
            continue
        if href == page_url or href in seen:
            continue
        seen.add(href)
        out.append((title, href))
        if len(out) >= 80:
            break
    return out

def refresh():
    with open("sources.json", encoding="utf-8") as f:
        sources = json.load(f)
    now = datetime.now(timezone.utc).isoformat()
    added = 0
    for s in sources:
        try:
            for title, url in extract(s["url"]):
                key = hashlib.sha256(url.encode()).hexdigest()
                con = db()
                con.execute("""INSERT OR IGNORE INTO articles
                    (id,title,url,source_url,source,published,excerpt,first_seen,updated_at)
                    VALUES(?,?,?,?,?,?,?,?,?)""",
                    (key,title,url,s["url"],source_name(s["url"]),None,None,now,now))
                if con.total_changes:
                    added += 1
                con.execute("UPDATE articles SET updated_at=? WHERE id=?", (now,key))
                con.commit(); con.close()
        except Exception as e:
            print("source error:", s["url"], e)
    return added

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/articles")
def articles():
    con = db()
    rows = con.execute("""SELECT * FROM articles
        ORDER BY CASE WHEN published IS NULL THEN first_seen ELSE published END DESC
        LIMIT 500""").fetchall()
    con.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/refresh", methods=["POST"])
def api_refresh():
    return jsonify({"added": refresh(), "updated_at": datetime.now(timezone.utc).isoformat()})

if __name__ == "__main__":
    init_db()
    # Initial fetch, then every hour. For production, prefer cron/systemd.
    try:
        refresh()
    except Exception as e:
        print("initial refresh error:", e)
    scheduler = BackgroundScheduler()
    scheduler.add_job(refresh, "interval", hours=1, id="hourly_refresh", replace_existing=True)
    scheduler.start()
    app.run(host="0.0.0.0", port=5000, debug=False)
