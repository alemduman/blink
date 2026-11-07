# Собирает app/studio.html из app/src (то же приложение Blink Test Studio + интерфейс window.__blink для автоматической генерации).
import pathlib
here = pathlib.Path(__file__).parent
src = here / 'src'
head = (src/'head.html').read_text()
body = (src/'body.html').read_text()
js = '\n'.join((src/f).read_text() for f in ['engine.js','aac.js','tests.js','tests2.js','tests3.js','ui.js'])
api = "\nwindow.__blink = { state, TESTS, TEST_ORDER, THEMES, PLATFORM, FPS, buildTimeline, cfgFromState, selectTest, choosePlan, exportWebCodecs, rebuild, renderCaption, fullCaption, getTl: () => tl, getCaption: () => ({ text: $('#capText').value.trim(), title: $('#ytTitle').value, tags: picked.instagram.slice(), full: fullCaption() }), drawFrame, W, H };\n})();\n</script>"
out = head + '\n' + body + '\n<script id="muxlib" src="https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/build/mp4-muxer.js" async></script>\n<script>\n(() => {\n\'use strict\';\n' + js + '\n})();\n</script>\n'
out = out.replace("\n})();\n</script>", api)
out = out.replace("video: { codec: 'avc', width: W", "video: { codec: (window.__vcodec || 'avc'), width: W")
assert '__vcodec' in out
(here/'studio.html').write_text(out)
print('built', len(out))
