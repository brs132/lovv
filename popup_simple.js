// popup.js (limpo e funcional) - MV3
// Objetivo: remover dependências de licença e manter o fluxo principal do chat funcionando.

console.log("[Popup] Inicializado (licença removida)");

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", () => {
  forceChatScreen();
  bindUI();
  hydrateContextBadges().catch(console.warn);
});

// Força sempre a tela do chat (remove qualquer gating antigo)
function forceChatScreen() {
  const chatScreen = document.getElementById("chatScreen");
  const licenseScreen = document.getElementById("licenseScreen");
  const awayScreen = document.getElementById("awayScreen");

  if (chatScreen) {
    chatScreen.classList.add("active");
    chatScreen.style.display = "flex";
  }
  if (licenseScreen) {
    licenseScreen.classList.remove("active");
    licenseScreen.style.display = "none";
  }
  if (awayScreen) {
    awayScreen.classList.remove("active");
    awayScreen.style.display = "none";
  }
}

// ---------- UI ----------
function bindUI() {
  const sendBtn = document.getElementById("sendBtn");
  const messageInput = document.getElementById("messageInput");

  if (sendBtn) sendBtn.addEventListener("click", handleSendMessage);

  if (messageInput) {
    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });
  }

  // controles
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);

  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  if (clearHistoryBtn) clearHistoryBtn.addEventListener("click", clearHistory);

  const detachBtn = document.getElementById("detachBtn");
  if (detachBtn) detachBtn.addEventListener("click", detachWindow);

  const shieldBtn = document.getElementById("shieldBtn");
  if (shieldBtn) shieldBtn.addEventListener("click", toggleShield);

  const toggleLovableChatBtn = document.getElementById("toggleLovableChatBtn");
  if (toggleLovableChatBtn) toggleLovableChatBtn.addEventListener("click", toggleLovableChat);

  const newProjectBtn = document.getElementById("newProjectBtn");
  if (newProjectBtn) newProjectBtn.addEventListener("click", createNewProjectHint);

  const downloadProjectBtn = document.getElementById("downloadProjectBtn");
  if (downloadProjectBtn) downloadProjectBtn.addEventListener("click", downloadProjectHint);

  const publishBtn = document.getElementById("publishBtn");
  if (publishBtn) publishBtn.addEventListener("click", publishProjectHint);

  const removeWatermarkBtn = document.getElementById("removeWatermarkBtn");
  if (removeWatermarkBtn) removeWatermarkBtn.addEventListener("click", watermarkHint);

  const improveBtn = document.getElementById("improveBtn");
  if (improveBtn) improveBtn.addEventListener("click", improvePromptHint);

  // anexos (mantém UI, não quebra)
  const attachBtn = document.getElementById("attachBtn");
  const fileInput = document.getElementById("fileInput");
  if (attachBtn && fileInput) {
    attachBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      addSystemMessage("Arquivos selecionados. (Envio de anexos depende da implementação do background/API.)");
    });
  }
}

// Mostra um aviso no topo se token / projectId não estiverem disponíveis
async function hydrateContextBadges() {
  const { token, projectId } = await getContext();

  const infoBox = document.querySelector("#chatArea .info-box");
  if (infoBox) {
    if (!projectId || !token) {
      infoBox.style.display = "block";
      infoBox.innerHTML =
        '<i class="fas fa-info-circle"></i> Abra um projeto no Lovable.dev logado para capturar Token/Project ID automaticamente.';
    } else {
      infoBox.style.display = "none";
    }
  }
}

// ---------- Core: enviar mensagem ----------
let inFlight = false;

async function handleSendMessage() {
  if (inFlight) return;

  const messageInput = document.getElementById("messageInput");
  const chatArea = document.getElementById("chatArea");

  if (!messageInput || !chatArea) return;

  const message = (messageInput.value || "").trim();
  if (!message) return;

  addMessageToChat("user", message);
  messageInput.value = "";

  // "typing"
  const typingId = addMessageToChat("assistant", "…", { isTyping: true });

  try {
    inFlight = true;

    const { token, projectId } = await getContext();
    const payload = { message, token, projectId };

    const res = await sendToBackground("sendMessage", { data: payload });

    // Normaliza vários formatos possíveis de resposta
    const text =
      (res && (res.reply || res.response || res.text || res.message)) ||
      (res && res.success === false && res.error) ||
      (typeof res === "string" ? res : null) ||
      "Sem resposta (verifique o console do service worker).";

    replaceTypingMessage(typingId, text, res && res.success === false);
  } catch (err) {
    console.error("[Popup] sendMessage falhou:", err);
    replaceTypingMessage(
      typingId,
      "Erro ao enviar. Abra a página de Service Worker (chrome://extensions → Inspecionar views) e veja o log.",
      true
    );
  } finally {
    inFlight = false;
  }
}

// ---------- Helpers: background messaging ----------
function sendToBackground(action, extra = {}) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage({ action, ...extra }, (response) => {
        const lastErr = chrome.runtime.lastError;
        if (lastErr) return reject(lastErr);
        resolve(response);
      });
    } catch (e) {
      reject(e);
    }
  });
}

// Contexto (evita depender de license.js no background)
async function getContext() {
  const data = await chrome.storage.local.get([
    "authToken",
    "lovable_token",
    "projectId",
  ]);

  const token = (data.authToken || data.lovable_token || "").trim() || null;
  const projectId = (data.projectId || "").trim() || null;

  return { token, projectId };
}

// ---------- Chat rendering ----------
function addMessageToChat(sender, message, opts = {}) {
  const chatArea = document.getElementById("chatArea");
  if (!chatArea) return null;

  // remove info-box quando entrar a primeira msg do usuário
  if (sender === "user") {
    const infoBox = chatArea.querySelector(".info-box");
    if (infoBox) infoBox.style.display = "none";
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";
  messageContent.textContent = message;

  messageDiv.appendChild(messageContent);
  chatArea.appendChild(messageDiv);

  chatArea.scrollTop = chatArea.scrollHeight;

  if (opts.isTyping) {
    const id = "m_" + Math.random().toString(16).slice(2);
    messageDiv.dataset.msgId = id;
    messageDiv.classList.add("typing");
    return id;
  }
  return null;
}

function replaceTypingMessage(typingId, newText, isError) {
  const chatArea = document.getElementById("chatArea");
  if (!chatArea || !typingId) return;

  const node = chatArea.querySelector(`[data-msg-id="${typingId}"]`);
  if (!node) return;

  node.classList.remove("typing");
  if (isError) node.classList.add("error");

  const content = node.querySelector(".message-content");
  if (content) content.textContent = newText;

  chatArea.scrollTop = chatArea.scrollHeight;
}

function addSystemMessage(text) {
  addMessageToChat("assistant", text);
}

// ---------- Misc UI actions ----------
function toggleTheme() {
  document.body.classList.toggle("light-theme");
  const themeIcon = document.querySelector("#themeToggleBtn i");
  if (!themeIcon) return;
  themeIcon.className = document.body.classList.contains("light-theme")
    ? "fas fa-sun"
    : "fas fa-moon";
}

function clearHistory() {
  const chatArea = document.getElementById("chatArea");
  if (!chatArea) return;
  chatArea.innerHTML =
    '<div class="info-box"><i class="fas fa-info-circle"></i> Abra um projeto no Lovable.dev para conectar</div>';
  hydrateContextBadges().catch(() => {});
}

async function detachWindow() {
  try {
    await sendToBackground("openPopup");
  } catch (e) {
    console.error("Erro ao destacar janela:", e);
  }
}

let shieldEnabled = true;
async function toggleShield() {
  shieldEnabled = !shieldEnabled;
  const shieldBtn = document.getElementById("shieldBtn");
  if (shieldBtn) shieldBtn.classList.toggle("active", shieldEnabled);

  try {
    await sendToBackground("executeShield", { enabled: shieldEnabled });
  } catch (e) {
    console.warn("[Popup] executeShield falhou:", e);
  }
}

function toggleLovableChat() {
  addSystemMessage("Toggle do chat nativo depende do content script / shield.");
}

function createNewProjectHint() {
  addSystemMessage("Criar novo projeto: implemente no background (Edge Function/API) se necessário.");
}
function downloadProjectHint() {
  addSystemMessage("Download do projeto: implemente no background/popup se necessário.");
}
function publishProjectHint() {
  addSystemMessage("Publicar projeto: implemente no background (Edge Function/API) se necessário.");
}
function watermarkHint() {
  addSystemMessage("Remover marca d'água: depende do content script na página.");
}
function improvePromptHint() {
  addSystemMessage("Melhorar prompt com IA: implemente chamada de Edge Function no popup.js (se aplicável).");
}
