
const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const FILE = "state.json";
const SIX_HOURS = 6 * 60 * 60 * 1000;

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { status: "stopped", endsAt: null };
  }
}

let state = loadState();

function saveState() {
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

function checkSession() {
  if (
    state.status === "running" &&
    state.endsAt &&
    Date.now() >= state.endsAt
  ) {
    state = { status: "stopped", endsAt: null };
    saveState();
  }
}

app.get("/", (req, res) => {
  res.send("CloudWin 11 API está funcionando! ☁️");
});

app.get("/api/status", (req, res) => {
  checkSession();
  res.json({
    ...state,
    remainingMs: state.endsAt
      ? Math.max(0, state.endsAt - Date.now())
      : 0,
    realWindowsConnected: false
  });
});

app.post("/api/start", (req, res) => {
  checkSession();

  if (state.status === "running") {
    return res.status(409).json({ error: "PC já está ligado" });
  }

  state = {
    status: "running",
    endsAt: Date.now() + SIX_HOURS
  };

  saveState();
  res.json({ message: "Sessão iniciada!", ...state });
});

app.post("/api/stop", (req, res) => {
  state = { status: "stopped", endsAt: null };
  saveState();
  res.json({ message: "Sessão encerrada!", ...state });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("CloudWin 11 rodando na porta " + PORT);
});
