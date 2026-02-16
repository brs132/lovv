// License.js modificado - Remove verificações de licença

// Função que sempre retorna licença válida
async function handleCheckLicense() {
  return {
    success: true,
    message: "Licença ativa",
    isLicenseValid: true,
    hasValidLicense: true
  };
}

// Função para formatar chave de licença (mantém funcionalidade original para compatibilidade)
function formatLicenseKey(licenseKey) {
  try {
    const cleanKey = licenseKey.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    let formatted = '';
    for (let i = 0; i < cleanKey.length && i < 25; i++) {
      if (i > 0 && i % 5 === 0) formatted += '-';
      formatted += cleanKey[i];
    }
    return formatted;
  } catch (error) {
    return licenseKey;
  }
}

// Função de verificação sempre retorna sucesso
async function verifyLicense(licenseKey) {
  return {
    success: true,
    message: "Licença verificada com sucesso",
    isValid: true
  };
}

// Função para salvar token sempre retorna sucesso
async function handleSaveToken(token) {
  return { success: true };
}

// Função para obter token
async function handleGetToken() {
  return { success: true, token: "fake-token" };
}

// Função para salvar project ID
async function handleSaveProjectId(projectId) {
  return { success: true };
}

// Função para obter project ID  
async function handleGetProjectId() {
  return { success: true, projectId: "fake-project-id" };
}

// Função para processar mensagens sempre permite
async function processMessageSend(data) {
  return { success: true, message: "Mensagem processada" };
}

// Função para verificar se tem licença válida - sempre retorna true
function hasValidLicense() {
  return true;
}

// Função para obter status da licença
function getLicenseStatus() {
  return {
    isValid: true,
    isActive: true,
    message: "Licença ativa"
  };
}

// Interceptar e modificar verificações de licença
if (typeof window !== 'undefined') {
  // Sobrescrever funções globais que possam verificar licença
  window.checkLicense = handleCheckLicense;
  window.verifyLicense = verifyLicense;
  window.hasValidLicense = hasValidLicense;
  window.getLicenseStatus = getLicenseStatus;
}

console.log("[License Modified] Sistema de licenciamento desabilitado - todas as verificações retornam sucesso");
