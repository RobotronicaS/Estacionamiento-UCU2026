from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
for size, density in [(48, 'mdpi'), (72, 'hdpi'), (96, 'xhdpi'), (144, 'xxhdpi'), (192, 'xxxhdpi')]:
    scale = 4
    image = Image.new('RGBA', (size * scale, size * scale), (20, 43, 55, 255))
    draw = ImageDraw.Draw(image)
    unit = size * scale / 100
    # A geometric P and a small mint locator dot; no external image assets.
    draw.rounded_rectangle((27*unit, 20*unit, 41*unit, 80*unit), radius=3*unit, fill='white')
    draw.rounded_rectangle((33*unit, 20*unit, 75*unit, 59*unit), radius=18*unit, fill='white')
    draw.rounded_rectangle((41*unit, 32*unit, 61*unit, 47*unit), radius=7*unit, fill=(20, 43, 55))
    draw.ellipse((65*unit, 68*unit, 82*unit, 85*unit), fill=(99, 231, 180))
    destination = root / 'res' / ('drawable-' + density) / 'ic_launcher.png'
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.resize((size, size), Image.Resampling.LANCZOS).save(destination)
print('Iconos generados.')
