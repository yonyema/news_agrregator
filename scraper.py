import json, re, time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

ROOT=Path(__file__).parent
UA="Mozilla/5.0 (compatible; NewsAggregator/1.0; +https://github.com/)"
HEADERS={"User-Agent":UA,"Accept-Language":"zh-TW,zh;q=0.9,en;q=0.6"}
TIMEOUT=20

def clean(s):
    return re.sub(r"\s+"," ",s or "").strip()

def source_name(url):
    host=url.split("/")[2].lower()
    return {"udn.com":"聯合新聞網","chinatimes.com":"中時新聞網","cna.com.tw":"中央社","setn.com":"三立新聞網","cmmedia.com.tw":"信傳媒","cw.com.tw":"天下雜誌","ltn.com.tw":"自由時報","taisounds.com":"太報","mirrordaily.news":"鏡報","knews.com.tw":"今新聞","ctwant.com":"CTWANT"}.get(host,host)

def parse(url, html):
    soup=BeautifulSoup(html,"html.parser")
    items=[]
    # Prefer article/list links; broad fallback keeps this template adaptable when publishers change markup.
    for a in soup.select("a[href]"):
        title=clean(a.get_text(" ",strip=True))
        href=urljoin(url,a.get("href",""))
        if len(title)<8 or len(title)>180: continue
        if not href.startswith(("http://","https://")): continue
        bad=("facebook.com","google.com","javascript:","mailto:")
        if any(x in href.lower() for x in bad): continue
        # Avoid navigation links; likely article URLs contain these patterns.
        looks=("news" in href or "article" in href or "/a/" in href or "/story/" in href or "/content/" in href)
        if not looks: continue
        parent=a.find_parent(["article","li","div"])
        text=clean(parent.get_text(" ",strip=True)) if parent else ""
        desc=text.replace(title,"",1)[:220]
        items.append({"title":title,"url":href,"description":desc,"source":source_name(url)})
    # de-duplicate by URL/title
    seen=set(); out=[]
    for x in items:
        k=x["url"].split("#")[0]
        if k in seen: continue
        seen.add(k); out.append(x)
    return out[:80]

def main():
    cfg=json.loads((ROOT/"sources.json").read_text(encoding="utf-8"))
    all_items=[]
    for u in cfg["sources"]:
        try:
            r=requests.get(u,headers=HEADERS,timeout=TIMEOUT)
            r.raise_for_status()
            all_items.extend(parse(u,r.text))
        except Exception as e:
            print("skip",u,e)
        time.sleep(.2)
    # Global dedupe and cap. Publication time may be unavailable on some source pages.
    uniq={x["url"]:x for x in all_items}
    articles=list(uniq.values())
    generated=datetime.now(timezone.utc).isoformat()
    payload={"generated_at":generated,"articles":articles,"source_count":len(set(x["source"] for x in articles))}
    (ROOT/"articles.json").write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"wrote {len(articles)} articles")

if __name__=="__main__":
    main()
