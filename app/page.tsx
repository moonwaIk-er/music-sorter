"use client";

import { useState } from "react";

type Track = {
  name: string;
  path: string;
  title: string | null;
  artist: string | null;
  extension: string | null;
};

export default function Home() {
  const [folderPath, setFolderPath] = useState<string>("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const scanMusic = async () => {
    console.log("Scan clicked");
    console.log("Folder path:", folderPath);

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8000/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderPath }),
      });

      console.log("Response status:", res.status);

      const data = await res.json();
      console.log("Scan data:", data);

      if (data.error) {
        alert(data.error);
        return;
      }

      setTracks(data.tracks);
    } catch (error) {
      console.error("Error scanning music:", error);
      alert(String(error));
    } finally {
      setLoading(false);
    }
  };

  const renameFiles = async () => {
    try {
      const res = await fetch("http://localhost:8000/rename", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tracks }),
      });

      const data = await res.json();
      alert(data.message);
      console.log(data);

      setTracks([]);
    } catch (error) {
      console.error("Error renaming files:", error);
      alert("Failed to rename files");
    }
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold my-4">Music Sorter</h1>
      <div className="mb-4 flex flex-col gap-3">
        <input
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          placeholder="Enter folder path"
          className="border p-2 w-full text-white bg-gray-900 rounded"
        />

        <button
          type="button"
          onClick={() => scanMusic()}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 cursor-pointer items-center"
        >
          {loading ? "Scanning..." : "Scan Music"}
        </button>
        <button
          onClick={renameFiles}
          disabled={tracks.length === 0}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 cursor-pointer items-center"
        >
          {loading ? "Renaming..." : "Rename Files"}
        </button>
      </div>
      <div className="rounded border border-zinc-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900">
            <tr>
              <th className="p-3">Original File</th>
              <th className="p-3">Title</th>
              <th className="p-3">Artist</th>
              <th className="p-3">Extension</th>
            </tr>
          </thead>

          <tbody>
            {tracks.map((track, index) => (
              <tr key={index} className="border-t border-zinc-800">
                <td className="p-3">{track.name}</td>
                <td className="p-3">{track.title}</td>
                <td className="p-3">{track.artist}</td>
                <td className="p-3">{track.extension}</td>
              </tr>
            ))}

            {tracks.length === 0 && (
              <tr>
                <td className="p-3 text-zinc-500" colSpan={4}>
                  Empty !! Scan folder to see music files here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
