// background.js - VERSÃO TOTALMENTE FUNCIONAL SEM LICENÇA

console.log("[Background] Leigos Academy - Versão sem licença iniciada");

// =============================
// CONFIGURAÇÃO BÁSICA
// =============================
const LOVABLE_API = "https://api.lovable.dev";
const SUPABASE_URL = "https://qwvfxzjkfdsbwnkkbric.supabase.co";

// =============================
// ABRIR EXTENSÃO
// =============================
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && typeof chrome.sidePanel.open === "function") {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      console.log("[Extension] Sidepanel aberto");
    } catch (error) {
      console.warn("[Extension] Falha no sidepanel:", error);
      openAsPopup();
    }
  } else {
    openAsPopup();
  }
});

async function openAsPopup() {
  try {
    await chrome.windows.create({
      url: chrome.runtime.getURL("popup.html"),
      type: "popup",
      width: 400,
      height: 600,
      focused: true,
    });
  } catch (error) {
    console.error("[Extension] Erro ao abrir popup:", error);
  }
}

// =============================
// INTERCEPTOR DE TOKEN LOVABLE
// =============================
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const authHeader = details.requestHeaders?.find(
      (header) => header.name.toLowerCase() === "authorization"
    );

    if (authHeader?.value) {
      const token = authHeader.value.replace("Bearer ", "").trim();
      if (token.length > 20) {
        chrome.storage.local.set({ 
          authToken: token, 
          lovable_token: token,
          tokenCaptured: true 
        });
        console.log("[Token] Capturado com sucesso");
      }
    }

    const urlMatch = details.url.match(/projects\/([a-f0-9-]+)/);
    if (urlMatch?.[1]) {
      chrome.storage.local.set({ projectId: urlMatch[1] });
      console.log("[ProjectID] Capturado:", urlMatch[1]);
    }
  },
  { urls: ["https://api.lovable.dev/*"] },
  ["requestHeaders"]
);

// =============================
// SHIELD CONTROL
// =============================
async function executeShieldOnTab(enable) {
  try {
    const tabs = await chrome.tabs.query({ url: "*://*.lovable.dev/*" });
    const shieldFileUrl = chrome.runtime.getURL("shield-inject.js");

    for (const tab of tabs) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (action, scriptUrl) => {
            document.documentElement.setAttribute(
              "data-shield-action",
              action ? "enable" : "disable"
            );

            const s = document.createElement("script");
            s.src = scriptUrl + "?t=" + Date.now();
            s.onload = () => s.remove();
            (document.head || document.documentElement).appendChild(s);
          },
          args: [enable, shieldFileUrl],
        });
      } catch (e) {
        console.error("[Shield] Erro:", e);
      }
    }
  } catch (e) {
    console.error("[Shield] Erro geral:", e);
  }
}

// =============================
// LISTENERS DE MENSAGENS
// =============================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // Ping para verificar se está ativo
  if (request.action === "ping") {
    sendResponse({ success: true, message: "pong" });
    return true;
  }

  // Abrir popup
  if (request.action === "openPopup") {
    openAsPopup().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  // Enviar mensagem (SEMPRE PERMITIDO)
  if (request.action === "sendMessage") {
    handleSendMessage(request.data)
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Shield
  if (request.action === "executeShield") {
    executeShieldOnTab(request.enabled)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Verificar licença (SEMPRE RETORNA VÁLIDO)
  if (request.action === "checkLicense") {
    sendResponse({
      success: true,
      isValid: true,
      hasLicense: true,
      message: "Licença válida"
    });
    return true;
  }

  // Obter status (SEMPRE ATIVO)
  if (request.action === "getStatus") {
    sendResponse({
      success: true,
      active: true,
      licensed: true
    });
    return true;
  }

  sendResponse({ success: false, error: "Ação desconhecida" });
  return true;
});

// =============================
// PROCESSAR ENVIO DE MENSAGEM
// =============================
async function handleSendMessage(data) {
  try {
    const { authToken, projectId } = await chrome.storage.local.get([
      "authToken",
      "projectId"
    ]);

    if (!authToken) {
      throw new Error("Token não encontrado. Acesse o Lovable.dev primeiro.");
    }

    if (!projectId) {
      throw new Error("Project ID não encontrado. Abra um projeto no Lovable.dev.");
    }

    // Enviar mensagem para API do Lovable
    const response = await fetch(`${LOVABLE_API}/projects/${projectId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: data.message,
        context: data.context || {}
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      data: result,
      message: "Mensagem enviada com sucesso"
    };

  } catch (error) {
    console.error("[SendMessage] Erro:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// =============================
// INICIALIZAÇÃO
// =============================
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Background] Extensão instalada - Versão sem licença");
  
  // Limpar dados antigos de licença
  chrome.storage.local.remove([
    "license",
    "licenseKey",
    "licenseValidatedAt",
    "licenseExpiry"
  ]);
});

console.log("[Background] Sistema pronto - Todas as funcionalidades liberadas");