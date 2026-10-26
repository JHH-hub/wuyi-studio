"""Refine only the Chinese wordmark. Retain the approved symbol and Latin paths.

Usage: python tools/refine_wordmark.py --font FONT_FILE [--font-index 0]
Uses fontTools to outline the two glyphs; the complete font is never shipped.
"""
import argparse
import re
import html
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

parser = argparse.ArgumentParser()
parser.add_argument('--font', required=True)
parser.add_argument('--font-index', type=int, default=0)
parser.add_argument('--output', default='dist/assets/logo.svg')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
source = (root / 'dist/assets/logo.svg').read_text(encoding='utf-8')
groups = re.findall(r'<g\b[\s\S]*?</g>', source)
font = TTFont(args.font, fontNumber=args.font_index)
glyphset = font.getGlyphSet()
cmap = font.getBestCmap()
glyphs = [glyphset[cmap[ord(char)]] for char in '无衣']
bounds = []
for glyph in glyphs:
    pen = BoundsPen(glyphset)
    glyph.draw(pen)
    bounds.append(pen.bounds)
scale = 112 / max(b[3] - b[1] for b in bounds)
paths = []
cursor = 270
for glyph, box in zip(glyphs, bounds):
    pen = SVGPathPen(glyphset)
    height = (box[3] - box[1]) * scale
    transform = (scale, 0, 0, -scale, cursor - box[0]*scale, 38 + (112-height)/2 + box[3]*scale)
    glyph.draw(TransformPen(pen, transform))
    paths.append(f'<path d="{pen.getCommands()}"/>')
    cursor += (box[2]-box[0])*scale + 27
chinese = '<g class="logo-type logo-chinese" fill="#1c1d1b" stroke="none">' + ''.join(paths) + '</g>'
svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 210" fill="none" role="img" aria-labelledby="title">\n<title id="title">无衣 WUYI</title>\n' + '\n'.join([groups[0],chinese,groups[-1]]) + '\n</svg>\n'
output = root / args.output
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(svg, encoding='utf-8')
print(output.name)
