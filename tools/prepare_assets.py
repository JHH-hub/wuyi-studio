"""Optional: python tools/prepare_assets.py --logo LOGO --members PHOTO1 PHOTO2 PHOTO3.
Existing delivered assets already work. Requires Pillow only when preparing new photos.
"""
import argparse
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--logo', type=Path, required=True)
parser.add_argument('--members', type=Path, nargs=3, required=True)
args = parser.parse_args()
assets = Path(__file__).resolve().parents[1] / 'dist' / 'assets'
assets.mkdir(exist_ok=True)
for number, source in enumerate(args.members, 1):
    im = Image.open(source).convert('RGB')
    im.thumbnail((1400, 1600))
    im.save(assets / f'member-{number:02d}.webp', 'WEBP', quality=90)
Image.open(args.logo).convert('RGB').save(assets / 'logo-original.webp', 'WEBP', quality=95)
print('Prepared 4 local WebP assets')
