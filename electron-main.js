const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

let backendProcess;

function startBackend() {
  const backendExe = app.isPackaged
    ? path.join(process.resourcesPath, "backend", "dist", "music-backend.exe")
    : path.join(__dirname, "backend", "dist", "music-backend.exe");

  console.log("Starting backend from:", backendExe);

  backendProcess = spawn(backendExe, [], {
    shell: false,
    windowsHide: true,
  });

  backendProcess.on("error", (error) => {
    console.error("Backend failed to start:", error);
  });

  backendProcess.stdout?.on("data", (data) => {
    console.log("Backend:", data.toString());
  });

  backendProcess.stderr?.on("data", (data) => {
    console.error("Backend error:", data.toString());
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Music Sorter",
    backgroundColor: "#000000",
  });

  win.webContents.openDevTools();

  if (app.isPackaged) {
    win.loadFile(path.join(process.resourcesPath, "app.asar", "out", "index.html"));
  } else {
    win.loadURL("http://localhost:3000");
  }
}

app.whenReady().then(() => {
  startBackend();

  setTimeout(() => {
    createWindow();
  }, 2000);
});

app.on("window-all-closed", () => {
  if (backendProcess) backendProcess.kill();
  app.quit();
});