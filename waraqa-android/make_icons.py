"""Generates the Waraqa Scan icons (web + Android) so no binary files need to be committed by hand.
Run from the repository root: python3 waraqa-android/make_icons.py"""
import os
import sys
from PIL import Image, ImageDraw
TEAL=(15,118,110); TEAL_D=(17,94,89); AMBER=(245,158,11); WHITE=(255,255,255)
def draw_mark(d, S, cx, cy, scale):
    # page with folded corner
    pw, ph = 0.40*scale, 0.52*scale
    x0, y0 = cx-pw/2, cy-ph/2; x1, y1 = cx+pw/2, cy+ph/2; f = 0.13*scale
    d.polygon([(x0,y0),(x1-f,y0),(x1,y0+f),(x1,y1),(x0,y1)], fill=WHITE)
    d.polygon([(x1-f,y0),(x1-f,y0+f),(x1,y0+f)], fill=(190,225,220))
    lw=max(2,int(0.028*scale))
    for i,frac in enumerate([0.30,0.45,0.60,0.75]):
        yy=y0+ph*frac; xe = x1-pw*(0.18 if i<3 else 0.45)
        d.rounded_rectangle([x0+pw*0.16, yy-lw/2, xe, yy+lw/2], radius=lw/2, fill=(150,190,184))
    # scan brackets
    m=0.09*scale; L=0.13*scale; w=max(3,int(0.045*scale))
    bx0,by0,bx1,by1 = x0-m, y0-m, x1+m, y1+m
    for (px,py,sx,sy) in [(bx0,by0,1,1),(bx1,by0,-1,1),(bx1,by1,-1,-1),(bx0,by1,1,-1)]:
        d.line([(px,py+sy*L),(px,py),(px+sx*L,py)], fill=AMBER, width=w, joint="curve")
    # scan line
    d.rounded_rectangle([bx0+w, cy-w/2, bx1-w, cy+w/2], radius=w/2, fill=AMBER)
def make(size, maskable, out):
    SS=4; S=size*SS
    im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    if maskable:
        d.rectangle([0,0,S,S], fill=TEAL); scale=S*0.78
    else:
        d.rounded_rectangle([0,0,S-1,S-1], radius=int(S*0.22), fill=TEAL); scale=S
    draw_mark(d,S,S/2,S/2,scale)
    im.resize((size,size),Image.LANCZOS).save(out)

def transparent(size, scale_frac, out):
    S=size*4; im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im); draw_mark(d,S,S/2,S/2,S*scale_frac)
    im.resize((size,size),Image.LANCZOS).save(out)
W='waraqa-scan/icons'; R='waraqa-android/app/src/main/res/drawable-nodpi'
os.makedirs(W,exist_ok=True); os.makedirs(R,exist_ok=True)
make(192,False,W+'/icon-192.png'); make(512,False,W+'/icon-512.png'); make(512,True,W+'/maskable-512.png')
make(192,False,R+'/ic_launcher.png')
transparent(432,0.62,R+'/ic_launcher_foreground.png')
transparent(512,0.9,R+'/splash.png')
print('icons written')
