from io import BytesIO

from gtts import gTTS
from fastapi import FastAPI
from starlette.responses import Response, StreamingResponse

app = FastAPI()


@app.get("/tts.mp3")
def me_api(q: str, lang: str = "ja"):
    fp = BytesIO()
    gtts = gTTS(q, lang=lang)
    gtts.write_to_fp(fp)

    return Response(fp.getvalue(), media_type="audio/mpeg")


@app.get("/")
def index():
    return StreamingResponse(open("index.html"), media_type="text/html")
