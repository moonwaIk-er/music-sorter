from fastapi import FastAPI
from pydantic import BaseModel
from pathlib import Path
from mutagen import File
from fastapi.middleware.cors import CORSMiddleware
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "file://",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


class ScanRequest(BaseModel):
    folderPath: str


class RenameRequest(BaseModel):
    tracks: list[dict]


def clean_filename(text):
    text = str(text).strip()
    text = re.sub(r'[\\/*?:"<>|]', "", text)
    return text[:100]


@app.get("/")
def home():
    return {"status": "working"}


@app.get("/test")
def test_head(): 
    return {"message": "Test endpoint is working"}


@app.post("/scan")
def scan(request: ScanRequest):
    folder_path = Path(request.folderPath)

    if not folder_path.exists():
        return {"error": "Folder path does not exist"}

    if not folder_path.is_dir():
        return {"error": "Path is not a folder"}

    tracks = []

    for file_path in folder_path.rglob("*"):
        if not file_path.is_file():
            continue

        if file_path.suffix.lower() not in [".mp3", ".m4a"]:
            continue

        title = None
        artist = None

        try:
            audio = File(file_path, easy=True)

            if audio:
                title = audio.get("title", [None])[0]
                artist = audio.get("artist", [None])[0]

        except Exception as error:
            print(f"Could not read metadata for {file_path}: {error}")

        final_title = title or file_path.stem
        final_artist = artist or "Unknown Artist"

        tracks.append({
            "name": file_path.name,
            "path": str(file_path),
            "title": final_title,
            "artist": final_artist,
            "extension": file_path.suffix,
            "newName": f"{final_artist} - {final_title}{file_path.suffix}"
        })

    return {"tracks": tracks}


@app.post("/rename")
def rename_files(request: RenameRequest):
    renamed = []

    for track in request.tracks:
        old_path = Path(track["path"])

        if not old_path.exists():
            continue

        title = clean_filename(track.get("title") or old_path.stem)
        artist = clean_filename(track.get("artist") or "Unknown Artist")

        new_name = f"{artist} - {title}{old_path.suffix}"
        new_path = old_path.parent / new_name

        counter = 1
        while new_path.exists():
            new_name = f"{artist} - {title} ({counter}){old_path.suffix}"
            new_path = old_path.parent / new_name
            counter += 1

        old_path.rename(new_path)

        renamed.append({
            "oldName": old_path.name,
            "newName": new_path.name,
            "newPath": str(new_path)
        })

    return {
        "message": f"Renamed {len(renamed)} files",
        "renamed": renamed
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)