from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = root / 'dist' / 'assets'
source = Path(r'C:\Users\Administrator\Documents\xwechat_files\wxid_9csmwsvnfwta12_aead\temp\RWTemp\2026-10\a947a1fdcbd3e6d1eec31f316c753428')
files = [('a6407484a60d638ddf5822082053f8ee.jpg','member-01.webp'),('8aed68eb075395542721c49efd562ba4.jpg','member-02.webp')]
for name, target in files:
    im = Image.open(source / name).convert('RGB')
    im.thumbnail((1400,1600))
    im.save(assets / target, 'WEBP', quality=88)
im = Image.open(r'C:\Users\Administrator\Documents\GitHub\JH-Portfolio\assets\images\portrait.webp')
im.save(assets / 'member-03.webp', 'WEBP', quality=90)
# Preserve the supplied logo artwork in full; the website clips its presentation margins in CSS.
im = Image.open(source / 'b26ae6b10754c39b8adfc0ab1b0cd40d.png').convert('RGB')
im.save(assets / 'logo-original.webp', 'WEBP', quality=95)
print('Prepared 4 local WebP assets')
