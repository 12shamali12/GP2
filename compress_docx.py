"""
Compress a .docx file by recompressing every embedded image.

A .docx is a ZIP; images live under word/media/. For each image we:
    1. Load it through Pillow.
    2. If it's larger than MAX_WIDTH on its long edge, downsize to MAX_WIDTH
       while preserving aspect ratio (LANCZOS - sharp, screenshot-safe).
    3. Re-encode the result. PNGs that are screenshots get converted to
       JPEG at QUALITY (huge size win, no visible loss in print). PNGs
       with transparency are kept as PNG-8 with optipng-equivalent
       optimisation flags.
    4. The image's filename inside the zip CHANGES if we converted PNG
       to JPEG; we patch word/_rels/document.xml.rels references to
       point at the new filenames so Word still finds them.

Run:
    python compress_docx.py [input.docx] [output.docx]
Defaults to DentyHub_GP2_Group_Report.docx -> compressed.docx.
"""

import io
import os
import re
import sys
import zipfile

from PIL import Image

# Tuneables
MAX_WIDTH = 1600          # downsize anything wider than this
JPEG_QUALITY = 82         # 82 is a sweet spot for screenshots
PNG_OPTIMIZE = True       # for PNGs that must keep transparency


def has_transparency(img: Image.Image) -> bool:
    """A PNG-like image is treated as transparent only if it actually uses
    transparency. Most screenshots have RGBA but no truly transparent
    pixels - we'll convert those to RGB + JPEG."""
    if img.mode in ("RGBA", "LA"):
        alpha = img.getchannel("A")
        # If the min alpha across the image is 255, nothing is transparent.
        return alpha.getextrema()[0] < 255
    if img.mode == "P":
        return "transparency" in img.info
    return False


def compress_image(data: bytes, original_name: str) -> tuple[bytes, str]:
    """Return (new bytes, new filename). Filename may change if PNG->JPEG."""
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except Exception:
        # Cannot decode (some embedded EMF / WMF). Leave it alone.
        return data, original_name

    # Downsize the long edge.
    longest = max(img.size)
    if longest > MAX_WIDTH:
        scale = MAX_WIDTH / longest
        new_size = (max(1, int(img.size[0] * scale)),
                    max(1, int(img.size[1] * scale)))
        img = img.resize(new_size, Image.LANCZOS)

    base, ext = os.path.splitext(original_name)
    ext = ext.lower()

    # Strategy:
    #   - true transparency  -> save as PNG (with optimize)
    #   - everything else    -> save as JPEG (massive win)
    if has_transparency(img):
        if img.mode not in ("RGBA", "LA", "P"):
            img = img.convert("RGBA")
        out = io.BytesIO()
        img.save(out, format="PNG", optimize=PNG_OPTIMIZE)
        return out.getvalue(), f"{base}.png"

    # Convert to RGB (drop alpha) and save as JPEG.
    if img.mode != "RGB":
        # Flatten onto white so semi-transparent pixels (rare in screenshots)
        # do not turn into garbage on JPEG conversion.
        bg = Image.new("RGB", img.size, (255, 255, 255))
        try:
            bg.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        except Exception:
            bg.paste(img.convert("RGB"))
        img = bg
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=JPEG_QUALITY, optimize=True,
             progressive=True)
    return out.getvalue(), f"{base}.jpg"


def patch_rels_xml(xml_bytes: bytes, rename_map: dict[str, str]) -> bytes:
    """When an image's filename inside the zip changes (e.g. image1.png ->
    image1.jpg), every reference to "image1.png" in the rels XML must
    follow. The references are relative paths inside Target="..." attrs."""
    text = xml_bytes.decode("utf-8", errors="replace")
    for old, new in rename_map.items():
        old_basename = os.path.basename(old)
        new_basename = os.path.basename(new)
        if old_basename != new_basename:
            text = text.replace(old_basename, new_basename)
    return text.encode("utf-8")


def ensure_content_types(xml_bytes: bytes, file_blobs: dict[str, bytes]) -> bytes:
    """[Content_Types].xml must declare a <Default> entry for every file
    extension that appears in the package, otherwise Word treats the whole
    document as unreadable. Walk the file_blobs, collect every extension
    present under word/media/, and inject any missing Default entries.

    This is the bug that broke v1: the original docx only declared
    Extension="png" because every embedded image was a PNG. When we
    converted them to JPEG, the rels were patched correctly but Word
    couldn't find a content-type entry for .jpg / .jpeg and corrupted."""
    text = xml_bytes.decode("utf-8", errors="replace")

    # Map of extension (without dot) -> MIME type we know how to declare.
    # Office expects these specific Content-Type strings.
    KNOWN = {
        "png":  "image/png",
        "jpg":  "image/jpeg",
        "jpeg": "image/jpeg",
        "gif":  "image/gif",
        "bmp":  "image/bmp",
        "tif":  "image/tiff",
        "tiff": "image/tiff",
        "svg":  "image/svg+xml",
        "wdp":  "image/vnd.ms-photo",
    }

    # Which extensions are actually present in word/media/ now?
    present: set[str] = set()
    for name in file_blobs:
        if not name.startswith("word/media/"):
            continue
        _, ext = os.path.splitext(name.lower())
        ext = ext.lstrip(".")
        if ext in KNOWN:
            present.add(ext)

    # For each present extension, ensure a <Default> entry exists.
    insertions: list[str] = []
    for ext in sorted(present):
        # Detect the existing declaration. Check both Extension="ext" and
        # Extension='ext' just in case.
        if (f'Extension="{ext}"' in text
                or f"Extension='{ext}'" in text):
            continue
        insertions.append(
            f'<Default Extension="{ext}" ContentType="{KNOWN[ext]}"/>'
        )

    if not insertions:
        return xml_bytes

    # Inject the new Default entries right after the opening <Types ...>.
    marker_match = re.search(r"(<Types\b[^>]*>)", text)
    if not marker_match:
        # Malformed — leave it alone rather than risk further damage.
        return xml_bytes
    inject_at = marker_match.end()
    text = text[:inject_at] + "".join(insertions) + text[inject_at:]
    return text.encode("utf-8")


def compress_docx(in_path: str, out_path: str) -> None:
    original_size = os.path.getsize(in_path)
    print(f"Input:  {in_path}  ({original_size / 1024 / 1024:.1f} MB)")

    rename_map: dict[str, str] = {}  # old zip path -> new zip path
    file_blobs: dict[str, bytes] = {}

    with zipfile.ZipFile(in_path, "r") as zin:
        names = zin.namelist()
        for name in names:
            data = zin.read(name)
            if name.startswith("word/media/"):
                # Skip anything that's not a still raster image - leave EMF /
                # SVG / WMF alone.
                _, ext = os.path.splitext(name.lower())
                if ext in (".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp",
                           ".gif"):
                    new_bytes, new_name = compress_image(data, name)
                    if new_name != name:
                        rename_map[name] = new_name
                    file_blobs[new_name] = new_bytes
                    before = len(data) / 1024
                    after = len(new_bytes) / 1024
                    if before > 100:
                        print(f"  {name:40s}  {before:>7,.0f} KB  ->  "
                              f"{after:>7,.0f} KB  "
                              f"({100 * (1 - after / before):>4.0f}% smaller)")
                else:
                    file_blobs[name] = data
            else:
                file_blobs[name] = data

    # Patch every rels XML so renamed images still resolve.
    if rename_map:
        for name, data in list(file_blobs.items()):
            if name.endswith(".rels") or name.endswith(".xml"):
                patched = patch_rels_xml(data, rename_map)
                if patched != data:
                    file_blobs[name] = patched

    # CRITICAL: ensure [Content_Types].xml declares every extension we have.
    # Without this, Word treats the document as unreadable.
    if "[Content_Types].xml" in file_blobs:
        file_blobs["[Content_Types].xml"] = ensure_content_types(
            file_blobs["[Content_Types].xml"], file_blobs
        )

    # Write the new docx. ZIP_DEFLATED with high compresslevel keeps the
    # XML parts tiny too.
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED,
                         compresslevel=9) as zout:
        for name, data in file_blobs.items():
            zout.writestr(name, data)

    final_size = os.path.getsize(out_path)
    print(f"\nOutput: {out_path}  ({final_size / 1024 / 1024:.1f} MB)")
    print(f"Saved {(original_size - final_size) / 1024 / 1024:.1f} MB  "
          f"({100 * (1 - final_size / original_size):.0f}% smaller)")


if __name__ == "__main__":
    in_path = sys.argv[1] if len(sys.argv) > 1 else "DentyHub_GP2_Group_Report.docx"
    out_path = sys.argv[2] if len(sys.argv) > 2 else "DentyHub_GP2_Group_Report_compressed.docx"
    compress_docx(in_path, out_path)
