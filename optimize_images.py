#!/usr/bin/env python3
"""
Konversi & optimasi foto undangan.

- Semua PNG/JPEG/JPG dikonversi menjadi JPG (quality 85, progressive).
- Transparansi (RGBA/P) diratakan ke latar putih, tanpa dipotong.
- Sisi terpanjang dibatasi MAX_SIDE piksel (rasio asli dipertahankan, tidak di-crop).
- Nama file dirapikan: spasi -> tanda hubung (mis. "cover 1.jpg" -> "cover-1.jpg").
- File rusak (mis. 2 byte) dilewati dan dilaporkan.

Cara pakai (dari folder project):
    python3 scripts/optimize_images.py assets/images
Hasil menimpa file di folder yang sama. Simpan backup dulu jika perlu.
"""
import os
import re
import sys

from PIL import Image, ImageOps

MAX_SIDE = 1600
QUALITY = 85
EXTS = {".png", ".jpg", ".jpeg"}


def clean_stem(name):
    stem = os.path.splitext(name)[0]
    stem = re.sub(r"\s+", "-", stem.strip())
    return stem.lower()


def to_rgb(im):
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert("RGB")


def main(folder):
    for name in sorted(os.listdir(folder)):
        path = os.path.join(folder, name)
        ext = os.path.splitext(name)[1].lower()
        if not os.path.isfile(path) or ext not in EXTS:
            continue
        try:
            with Image.open(path) as im:
                im = ImageOps.exif_transpose(im)
                im = to_rgb(im)
                im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
                out_name = clean_stem(name) + ".jpg"
                out_path = os.path.join(folder, out_name)
                im.save(out_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        except Exception as exc:  # file rusak / bukan gambar
            print(f"LEWATI (bukan gambar valid): {name} -> {exc}")
            continue
        if out_path != path:
            os.remove(path)
        print(f"OK {name} -> {out_name} {im.size[0]}x{im.size[1]} {os.path.getsize(out_path)//1024}KB")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "assets/images")
