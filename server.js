
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const FILE = path.join(__dirname, "state.json");
const SIX_HOURS = 6 * 60 * 60 * 1000;

// Estado do CloudWin
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {
      status: "stopped",
      endsAt: null
    };
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
    state = {
      status: "stopped",
      endsAt: null
    };

    saveState();
  }
}

// Abrir o desktop CloudWin 11
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Verificar estado do PC
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

// Ligar o PC
app.post("/api/start", (req, res) => {
  checkSession();

  if (state.status === "running") {
    return res.status(409).json({
      error: "PC já está ligado"
    });
  }

  state = {
    status: "running",
    endsAt: Date.now() + SIX_HOURS
  };

  saveState();

  res.json({
    message: "CloudWin iniciado!",
    ...state
  });
});

// Desligar o PC
app.post("/api/stop", (req, res) => {
  state = {
    status: "stopped",
    endsAt: null
  };

  saveState();

  res.json({
    message: "CloudWin desligado!",
    ...state
  });
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log("CloudWin 11 iniciado na porta " + PORT);
});
                       
