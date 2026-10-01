"""Read-only collection of public manufacturer pages for editorial review."""
import json
import sys
import time
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin

BASE = 'https://grupoozonteck.com'
CATEGORIES = ['bem-estar-ozonizada', 'capilar-ozonizada', 'suplementos-alimentares', 'perfumaria-premium', 'acessorios']

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = set()
        self.text = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style'):
            self.skip += 1
        if tag == 'a' and '/produtos/' in attrs.get('href', ''):
            self.links.add(urljoin(BASE, attrs['href']))
        if tag in ('p', 'h1', 'h2', 'h3', 'li', 'br'):
            self.text.append('\n')

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip = max(0, self.skip - 1)
        if tag in ('p', 'h1', 'h2', 'h3', 'li'):
            self.text.append('\n')

    def handle_data(self, data):
        if not self.skip:
            self.text.append(data)

def read(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'OzonteckCatalogEditorialReview/1.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        page = Page()
        page.feed(response.read().decode('utf-8'))
        return page

links = set()
for category in CATEGORIES:
    links.update(read(BASE + '/produtos-lista/' + category).links)
result = []
for url in sorted(links):
    try:
        page = read(url)
        lines = [' '.join(s.split()) for s in ''.join(page.text).splitlines()]
        text = '\n'.join(s for s in lines if s)
        result.append({'url': url, 'text': text})
    except Exception as error:
        result.append({'url': url, 'error': str(error)})
    time.sleep(0.1)
Path(sys.argv[1]).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'{len(result)} manufacturer pages collected; {sum("error" in p for p in result)} errors.')
