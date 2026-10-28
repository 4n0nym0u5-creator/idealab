import glob,os
from playwright.sync_api import sync_playwright
out="/workspace/sidehustle/run7_mockups"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    for f in sorted(glob.glob("*.html")):
        mob=f.startswith("m")
        pg=b.new_page(viewport={"width":390 if mob else 1440,"height":844 if mob else 900},device_scale_factor=2)
        pg.goto("file://"+os.path.abspath(f)); pg.wait_for_timeout(300)
        pg.screenshot(path=f"{out}/{f[:-5]}.png"); pg.close()
    b.close()
