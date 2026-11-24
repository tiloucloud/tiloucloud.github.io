# يرسم أيقونة «حقيبتي»: حقيبة مدرسية بلون الورق على أخضر مزرق
from PIL import Image, ImageDraw
import os
D = os.path.dirname(os.path.abspath(__file__))
BG, CREAM, ORANGE, DEEP = (15, 95, 87), (250, 244, 230), (217, 98, 43), (11, 71, 65)

def bag(size, pad_ratio, rounded=True, bg=True):
    S = 1024
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if bg:
        if rounded: d.rounded_rectangle([0, 0, S - 1, S - 1], radius=230, fill=BG)
        else: d.rectangle([0, 0, S, S], fill=BG)
    k = 1 - 2 * pad_ratio; o = S * pad_ratio
    P = lambda x, y: (o + x * k, o + y * k)
    R = lambda a, b, c, e: [*P(a, b), *P(c, e)]
    # handle
    d.rounded_rectangle(R(380, 170, 644, 330), radius=int(90 * k), outline=CREAM, width=int(46 * k))
    # body
    d.rounded_rectangle(R(215, 280, 809, 860), radius=int(120 * k), fill=CREAM)
    # flap
    d.rounded_rectangle(R(215, 280, 809, 560), radius=int(120 * k), fill=(236, 226, 204))
    d.rectangle(R(215, 470, 809, 560), fill=(236, 226, 204))
    # pocket
    d.rounded_rectangle(R(330, 640, 694, 800), radius=int(46 * k), fill=(236, 226, 204))
    # buckle
    d.rounded_rectangle(R(452, 500, 572, 620), radius=int(30 * k), fill=ORANGE)
    d.rounded_rectangle(R(487, 535, 537, 585), radius=int(12 * k), fill=CREAM)
    return im.resize((size, size), Image.LANCZOS)

out = lambda n: os.path.join(D, n)
for s, n in [(512, 'icon-512.png'), (192, 'icon-192.png'), (180, 'icon-180.png'), (32, 'fav-32.png')]:
    bag(s, 0.06).save(out(n))
bag(512, 0.18, rounded=False).save(out('icon-maskable-512.png'))
bag(1024, 0.0, bg=False).save(out('fg-1024.png'))
bag(1024, 0.0).save(out('icon-1024.png'))
print('ok')
