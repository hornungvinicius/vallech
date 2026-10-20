# Coloca ?v=<hash do conteúdo> nos CSS/JS do index.html. Rodar antes de cada deploy:
#   python version-assets.py
# O CDN da Hostinger guarda CSS/JS por 7 dias; com o hash no endereço, arquivo novo = endereço novo.
import hashlib, pathlib, re
root = pathlib.Path(__file__).parent
html = root / 'index.html'
text = html.read_text(encoding='utf-8')
for rel in ['assets/css/style.css', 'assets/js/gsap.min.js', 'assets/js/ScrollTrigger.min.js', 'assets/js/main.js']:
    v = hashlib.md5((root / rel).read_bytes().replace(b'\r\n', b'\n')).hexdigest()[:8]
    text, n = re.subn(re.escape(rel) + r'(\?v=[0-9a-f]+)?"', f'{rel}?v={v}"', text)
    print(rel, v, n)
html.write_text(text, encoding='utf-8', newline='\n')
