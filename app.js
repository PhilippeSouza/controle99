// State Management
let appData = {
    entries: [],
    settings: {
        dailyGoal: 150,
        oilChangeInterval: 1000,
        lastOilChangeKm: 0,
        lastOilChangeDate: ""
    },
    theme: "dark"
};

// Elementos do DOM
const elements = {
    form: document.getElementById("entry-form"),
    dateInput: document.getElementById("entry-date"),
    ridesInput: document.getElementById("earnings-rides"),
    tipsInput: document.getElementById("earnings-tips"),
    kmInput: document.getElementById("km-traveled"),
    kmDayDrivenInput: document.getElementById("km-day-driven"),
    kmHelperText: document.getElementById("km-helper-text"),
    hoursInput: document.getElementById("hours-worked"),
    fuelInput: document.getElementById("expense-fuel"),
    foodInput: document.getElementById("expense-food"),
    othersInput: document.getElementById("expense-others"),
    notesInput: document.getElementById("entry-notes"),
    
    // KPIs
    kpiNetProfit: document.getElementById("kpi-net-profit"),
    kpiProfitPct: document.getElementById("kpi-profit-pct"),
    kpiGrossRevenue: document.getElementById("kpi-gross-revenue"),
    kpiRidesCount: document.getElementById("kpi-rides-count"),
    kpiTotalExpenses: document.getElementById("kpi-total-expenses"),
    kpiExpensePct: document.getElementById("kpi-expense-pct"),
    kpiTotalKm: document.getElementById("kpi-total-km"),
    kpiOdometerText: document.getElementById("kpi-odometer-text"),
    kpiEarningPerKm: document.getElementById("kpi-earning-per-km"),
    
    // Widgets
    oilProgress: document.getElementById("oil-progress"),
    oilKmText: document.getElementById("oil-km-text"),
    oilStatusText: document.getElementById("oil-status-text"),
    oilLastKm: document.getElementById("oil-last-km"),
    oilNextKm: document.getElementById("oil-next-km"),
    resetOilBtn: document.getElementById("reset-oil-btn"),
    
    goalProgress: document.getElementById("goal-progress"),
    goalText: document.getElementById("goal-text"),
    goalStatusText: document.getElementById("goal-status-text"),
    editGoalBtn: document.getElementById("edit-goal-btn"),
    
    // Histórico e Filtros
    historyList: document.getElementById("history-list"),
    filterPeriod: document.getElementById("filter-period"),
    clearDataBtn: document.getElementById("clear-data-btn"),
    
    // Configurações Modal
    goalModal: document.getElementById("goal-modal"),
    configGoalInput: document.getElementById("config-goal-input"),
    configOilInput: document.getElementById("config-oil-input"),
    configOilLastKmInput: document.getElementById("config-oil-last-km"),
    resetAllKmBtn: document.getElementById("reset-all-km-btn"),
    saveConfigBtn: document.getElementById("save-config-btn"),
    closeModalBtn: document.getElementById("close-modal-btn"),
    
    // Actions e Modais de Backup / Tema
    themeToggle: document.getElementById("theme-toggle"),
    exportBtn: document.getElementById("export-btn"),
    importBtn: document.getElementById("import-btn"),

    backupModal: document.getElementById("backup-modal"),
    backupShareBtn: document.getElementById("backup-share-btn"),
    backupCopyBtn: document.getElementById("backup-copy-btn"),
    backupDownloadBtn: document.getElementById("backup-download-btn"),
    backupTextarea: document.getElementById("backup-textarea"),
    closeBackupModalBtn: document.getElementById("close-backup-modal-btn"),

    importModal: document.getElementById("import-modal"),
    importFileModal: document.getElementById("import-file-modal"),
    importTextarea: document.getElementById("import-textarea"),
    closeImportModalBtn: document.getElementById("close-import-modal-btn"),
    processImportBtn: document.getElementById("process-import-btn"),

    // Auth & Usuário
    authBtn: document.getElementById("auth-btn"),
    userBadge: document.getElementById("user-badge"),
    userEmailText: document.getElementById("user-email-text"),
    logoutBtn: document.getElementById("logout-btn"),
    forgotPasswordBtn: document.getElementById("forgot-password-btn")
};

// Variável para instância do Gráfico
let financeChart = null;

// Variável para controle de inicialização única de listeners
let isEventListenersSetup = false;

// Carrega dados e configurações salvos no navegador (localStorage)
function loadLocalData() {
    try {
        const saved = localStorage.getItem("controle99_data");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.settings) {
                appData.settings = {
                    ...appData.settings,
                    ...parsed.settings,
                    dailyGoal: parseFloat(parsed.settings.dailyGoal) || 150,
                    oilChangeInterval: parseInt(parsed.settings.oilChangeInterval) || 1000,
                    lastOilChangeKm: parseFloat(parsed.settings.lastOilChangeKm) || 0
                };
            }
            if (parsed.theme) {
                appData.theme = parsed.theme;
            }
            if (Array.isArray(parsed.entries) && parsed.entries.length > 0 && appData.entries.length === 0) {
                appData.entries = parsed.entries;
            }
        }
    } catch (e) {
        console.warn("Aviso ao carregar dados do localStorage:", e);
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    loadLocalData();
    initTheme();
    setupLoginScreen();
    checkLoginState();
});

// Configura os event listeners da tela de login
function setupLoginScreen() {
    const loginEnterBtn = document.getElementById("login-enter-btn");
    const loginCreateBtn = document.getElementById("login-create-btn");
    const loginGoogleBtn = document.getElementById("login-google-btn");
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-password");

    const forgotPasswordBtn = document.getElementById("forgot-password-btn");

    if (loginGoogleBtn) {
        let isGoogleLoggingIn = false;
        loginGoogleBtn.addEventListener("click", () => {
            if (isGoogleLoggingIn) return;
            isGoogleLoggingIn = true;
            loginGoogleBtn.innerHTML = '<i class="fa-brands fa-google"></i> Conectando...';
            showLoginError("");

            // Executa mantendo o contexto de clique do usuário no iOS Safari
            window.FirebaseBackend.signInWithGoogle()
                .then(async (user) => {
                    if (user) {
                        showLoginError("");
                        await enterApp();
                    }
                })
                .catch(err => {
                    showLoginError(err.message || "Erro no login com Google.");
                })
                .finally(() => {
                    loginGoogleBtn.innerHTML = '<i class="fa-brands fa-google"></i> Entrar com o Google';
                    isGoogleLoggingIn = false;
                });
        });
    }

    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener("click", async () => {
            const email = loginEmail.value.trim();
            if (!email) {
                showLoginError("Digite seu e-mail no campo acima e depois clique em 'Esqueci minha senha'.");
                loginEmail.focus();
                return;
            }
            try {
                forgotPasswordBtn.innerText = "Enviando e-mail...";
                forgotPasswordBtn.disabled = true;
                await window.FirebaseBackend.sendPasswordReset(email);
                alert("✅ Link de redefinição enviado para " + email + "!\nVerifique sua caixa de entrada e pasta de spam para criar sua senha.");
                showLoginError("");
            } catch (err) {
                showLoginError("Não foi possível enviar o e-mail: " + (err.message || err));
            } finally {
                forgotPasswordBtn.innerText = "Esqueci minha senha";
                forgotPasswordBtn.disabled = false;
            }
        });
    }

    if (!loginEnterBtn) return;

    loginEnterBtn.addEventListener("click", async () => {
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();
        if (!email || !password) {
            showLoginError("Preencha o e-mail e a senha.");
            return;
        }
        try {
            loginEnterBtn.innerText = "Entrando...";
            loginEnterBtn.disabled = true;
            await window.FirebaseBackend.signInUser(email, password);
            showLoginError("");
            await enterApp();
        } catch (err) {
            showLoginError("E-mail ou senha incorretos. Tente novamente.");
        } finally {
            loginEnterBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar';
            loginEnterBtn.disabled = false;
        }
    });

    loginCreateBtn.addEventListener("click", async () => {
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();
        if (!email || !password) {
            showLoginError("Preencha o e-mail e a senha para criar a conta.");
            return;
        }
        if (password.length < 6) {
            showLoginError("A senha deve ter pelo menos 6 caracteres.");
            return;
        }
        try {
            loginCreateBtn.innerText = "Criando conta...";
            loginCreateBtn.disabled = true;
            await window.FirebaseBackend.signUpUser(email, password);
            await window.FirebaseBackend.signInUser(email, password);
            showLoginError("");
            await enterApp();
        } catch (err) {
            showLoginError("Erro ao criar conta: " + (err.message || err));
        } finally {
            loginCreateBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Criar Nova Conta';
            loginCreateBtn.disabled = false;
        }
    });
}

function showLoginError(msg) {
    const loginError = document.getElementById("login-error");
    if (loginError) {
        loginError.innerText = msg;
        loginError.style.display = msg ? "block" : "none";
    }
}

// Checa se o usuário já tem sessão ativa
async function checkLoginState() {
    if (!window.FirebaseBackend) {
        showLoginScreen();
        return;
    }
    try {
        // Verifica se o usuário retornou de um redirecionamento de login do Google
        if (window.FirebaseBackend.handleRedirectResult) {
            const redirectUser = await window.FirebaseBackend.handleRedirectResult();
            if (redirectUser) {
                await enterApp();
                return;
            }
        }

        const user = await window.FirebaseBackend.getCurrentUser();
        if (user) {
            await enterApp();
        } else {
            showLoginScreen();
        }
    } catch (err) {
        showLoginScreen();
    }
}

// Mostra a tela de login e esconde o app
function showLoginScreen() {
    const loginScreen = document.getElementById("login-screen");
    const appContainer = document.getElementById("app-container");
    if (loginScreen) loginScreen.classList.remove("hidden");
    if (appContainer) appContainer.style.display = "none";
}

// Entra no app: esconde login, mostra painel e carrega dados da nuvem
async function enterApp() {
    const loginScreen = document.getElementById("login-screen");
    const appContainer = document.getElementById("app-container");
    if (loginScreen) loginScreen.classList.add("hidden");
    if (appContainer) appContainer.style.display = "";

    // Configura event listeners apenas UMA vez
    setupEventListeners();

    // Atualiza o badge do usuário no cabeçalho
    try {
        const user = await window.FirebaseBackend.getCurrentUser();
        if (user) {
            if (elements.userBadge) elements.userBadge.style.display = "inline-flex";
            if (elements.userEmailText) elements.userEmailText.innerText = user.email;
            if (elements.authBtn) elements.authBtn.style.display = "none";
        }
    } catch(e) {}

    // Carrega os dados da conta
    await loadDataFromCloud();
    setDefaultDate();
    initTheme();
    syncKmFieldsFromOdometer();
}

// Retorna o último odômetro conhecido anterior a uma determinada data
function getPreviousKnownOdometer(forDate) {
    const selectedDate = forDate || (elements.dateInput ? elements.dateInput.value : '');
    const previousEntries = appData.entries
        .filter(entry => !selectedDate || entry.date < selectedDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    for (const entry of previousEntries) {
        const val = parseFloat(entry.odometer) || 0;
        if (val > 0) return val;
    }
    return parseFloat(appData.settings.lastOilChangeKm) || 0;
}

// Sincroniza os campos do odômetro e km rodados no dia quando o usuário digita o odômetro
function syncKmFieldsFromOdometer() {
    if (!elements.kmInput) return;
    const val = parseFloat(elements.kmInput.value) || 0;
    const prevOdo = getPreviousKnownOdometer(elements.dateInput ? elements.dateInput.value : '');
    
    if (val > 0) {
        if (prevOdo > 0 && val >= prevOdo) {
            const diff = (val - prevOdo).toFixed(1);
            if (elements.kmDayDrivenInput) {
                elements.kmDayDrivenInput.value = parseFloat(diff);
            }
            if (elements.kmHelperText) {
                elements.kmHelperText.innerText = `Último painel: ${prevOdo.toLocaleString('pt-BR')} km (+${diff} km rodados)`;
            }
        } else if (prevOdo > 0 && val < prevOdo) {
            if (elements.kmHelperText) {
                elements.kmHelperText.innerText = `Atenção: valor menor que o último painel registrado (${prevOdo.toLocaleString('pt-BR')} km)`;
            }
        } else {
            if (elements.kmHelperText) {
                elements.kmHelperText.innerText = `Painel registrado: ${val.toLocaleString('pt-BR')} km`;
            }
        }
    } else {
        if (elements.kmHelperText) {
            elements.kmHelperText.innerText = prevOdo > 0 
                ? `Último painel registrado: ${prevOdo.toLocaleString('pt-BR')} km` 
                : 'Digite o odômetro atual da moto';
        }
    }
}

// Sincroniza o odômetro quando o usuário digita diretamente os km rodados no dia
function syncKmFieldsFromDayDriven() {
    if (!elements.kmDayDrivenInput) return;
    const dayKm = parseFloat(elements.kmDayDrivenInput.value) || 0;
    const prevOdo = getPreviousKnownOdometer(elements.dateInput ? elements.dateInput.value : '');

    if (dayKm > 0 && prevOdo > 0 && (!elements.kmInput.value || parseFloat(elements.kmInput.value) <= prevOdo)) {
        elements.kmInput.value = (prevOdo + dayKm).toFixed(1);
        if (elements.kmHelperText) {
            elements.kmHelperText.innerText = `Painel estimado: ${(prevOdo + dayKm).toLocaleString('pt-BR')} km`;
        }
    }
}

// Carrega dados do Firebase (Firestore) e sincroniza configurações
async function loadDataFromCloud() {
    loadLocalData();

    try {
        if (window.FirebaseBackend) {
            // Sincroniza configurações da nuvem (meta diária, odômetro da troca de óleo, etc.)
            if (window.FirebaseBackend.fetchCloudSettings) {
                const cloudSettings = await window.FirebaseBackend.fetchCloudSettings();
                if (cloudSettings) {
                    appData.settings = {
                        ...appData.settings,
                        ...cloudSettings,
                        dailyGoal: parseFloat(cloudSettings.dailyGoal) || appData.settings.dailyGoal,
                        oilChangeInterval: parseInt(cloudSettings.oilChangeInterval) || appData.settings.oilChangeInterval,
                        lastOilChangeKm: parseFloat(cloudSettings.lastOilChangeKm) || appData.settings.lastOilChangeKm
                    };
                }
            }

            const cloudEntries = await window.FirebaseBackend.fetchCloudEntries();
            if (cloudEntries && cloudEntries.length > 0) {
                appData.entries = cloudEntries.map(entry => ({
                    ...entry,
                    rides: parseFloat(entry.rides) || 0,
                    tips: parseFloat(entry.tips) || 0,
                    km: parseFloat(entry.km) || 0,
                    odometer: parseFloat(entry.odometer) || 0,
                    hours: parseFloat(entry.hours) || 0,
                    fuel: parseFloat(entry.fuel) || 0,
                    food: parseFloat(entry.food) || 0,
                    others: parseFloat(entry.others) || 0
                }));
            }
            saveData();
            updateUI();
            return;
        }
    } catch (err) {
        console.log("Aviso ao buscar dados da nuvem:", err);
    }
    
    saveData();
    updateUI();
}

// Retorna a data no fuso horário local no formato YYYY-MM-DD
function getLocalDateString(date = new Date()) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Define a data padrão do formulário como "hoje"
function setDefaultDate() {
    elements.dateInput.value = getLocalDateString();
}

// Salva os dados no LocalStorage
function saveData() {
    localStorage.setItem("controle99_data", JSON.stringify(appData));
}

// Configuração de Event Listeners
function setupEventListeners() {
    if (isEventListenersSetup) return;
    isEventListenersSetup = true;

    // Submissão do Formulário
    elements.form.addEventListener("submit", (e) => {
        e.preventDefault();
        saveEntry();
    });

    // Sincronização em tempo real entre Odômetro do Painel e Km Rodados no Dia
    if (elements.kmInput && elements.kmDayDrivenInput) {
        elements.kmInput.addEventListener("input", syncKmFieldsFromOdometer);
        elements.kmDayDrivenInput.addEventListener("input", syncKmFieldsFromDayDriven);
        if (elements.dateInput) {
            elements.dateInput.addEventListener("change", syncKmFieldsFromOdometer);
        }
    }

    // Filtro de Histórico
    elements.filterPeriod.addEventListener("change", updateUI);

    // Botão Limpar Tudo (Apaga no banco em nuvem e localmente)
    elements.clearDataBtn.addEventListener("click", async () => {
        if (confirm("Tem certeza que deseja apagar TODOS os seus lançamentos permanentemente da sua conta? Esta ação não pode ser desfeita.")) {
            appData.entries = [];
            saveData();
            updateUI();
            if (window.FirebaseBackend) {
                try {
                    await window.FirebaseBackend.clearAllCloudEntries();
                } catch (e) {
                    console.error("Erro ao apagar histórico da nuvem:", e);
                }
            }
            alert("🗑️ Todo o seu histórico foi apagado permanentemente da sua conta!");
        }
    });

    // Reset / Registro da Troca de Óleo
    elements.resetOilBtn.addEventListener("click", () => {
        let maxOdometer = 0;
        appData.entries.forEach(entry => {
            const val = parseFloat(entry.odometer) || 0;
            if (val > maxOdometer) maxOdometer = val;
        });

        const currentKnownKm = maxOdometer > 0 ? maxOdometer : (parseFloat(appData.settings.lastOilChangeKm) || 0);
        const promptVal = prompt(
            "Registrar troca de óleo!\nDigite a quilometragem marcada no painel da moto no momento da troca:",
            currentKnownKm > 0 ? currentKnownKm : ""
        );

        if (promptVal !== null && promptVal !== "") {
            const kmVal = parseFloat(String(promptVal).replace(',', '.')) || currentKnownKm;
            appData.settings.lastOilChangeKm = kmVal;
            appData.settings.lastOilChangeDate = getLocalDateString();
            saveData();
            if (window.FirebaseBackend && window.FirebaseBackend.saveCloudSettings) {
                window.FirebaseBackend.saveCloudSettings(appData.settings);
            }
            updateUI();
            const nextChange = kmVal + (appData.settings.oilChangeInterval || 1000);
            alert(`✅ Troca de óleo registrada no odômetro ${kmVal.toLocaleString('pt-BR')} km!\nO próximo alerta de troca será ativado em ${nextChange.toLocaleString('pt-BR')} km.`);
        }
    });

    // Controle do Modal de Metas/Configurações
    elements.editGoalBtn.addEventListener("click", () => {
        elements.configGoalInput.value = appData.settings.dailyGoal;
        elements.configOilInput.value = appData.settings.oilChangeInterval;
        if (elements.configOilLastKmInput) {
            elements.configOilLastKmInput.value = appData.settings.lastOilChangeKm || 0;
        }
        elements.goalModal.classList.add("show");
    });

    elements.closeModalBtn.addEventListener("click", () => {
        elements.goalModal.classList.remove("show");
    });

    elements.saveConfigBtn.addEventListener("click", () => {
        const goal = parseFloat(elements.configGoalInput.value) || 150;
        const oil = parseInt(elements.configOilInput.value) || 1000;
        const oilLastKm = elements.configOilLastKmInput ? (parseFloat(elements.configOilLastKmInput.value) || 0) : appData.settings.lastOilChangeKm;
        appData.settings.dailyGoal = goal;
        appData.settings.oilChangeInterval = oil;
        appData.settings.lastOilChangeKm = oilLastKm;
        saveData();
        if (window.FirebaseBackend && window.FirebaseBackend.saveCloudSettings) {
            window.FirebaseBackend.saveCloudSettings(appData.settings);
        }
        elements.goalModal.classList.remove("show");
        updateUI();
    });

    // Botão para zerar km e odômetro dos lançamentos mantendo dados financeiros
    if (elements.resetAllKmBtn) {
        elements.resetAllKmBtn.addEventListener("click", async () => {
            if (!confirm("⚠️ Atenção: Deseja zerar os odômetros e km de todos os seus lançamentos anteriores no banco de dados?\n\n(Todos os seus ganhos, corridas, gorjetas e despesas continuarão 100% salvos e intactos!)")) {
                return;
            }

            const initialKmPrompt = prompt(
                "Digite a quilometragem atual do painel da moto (ou odômetro da última troca de óleo):\n(Se quiser deixar tudo zerado para começar do zero, deixe 0)", 
                "0"
            );
            if (initialKmPrompt === null) return;

            const initialKm = parseFloat(String(initialKmPrompt).replace(',', '.')) || 0;

            // Zera km e odometer em todos os lançamentos
            appData.entries.forEach(entry => {
                entry.km = 0;
                entry.odometer = 0;
            });

            // Atualiza configurações da moto / troca de óleo
            appData.settings.lastOilChangeKm = initialKm;
            if (initialKm > 0) {
                appData.settings.lastOilChangeDate = getLocalDateString();
            }

            saveData();
            updateUI();

            elements.resetAllKmBtn.innerText = "Sincronizando no banco...";
            elements.resetAllKmBtn.disabled = true;

            try {
                if (window.FirebaseBackend) {
                    if (window.FirebaseBackend.syncLocalEntriesToCloud) {
                        await window.FirebaseBackend.syncLocalEntriesToCloud(appData.entries);
                    }
                    if (window.FirebaseBackend.saveCloudSettings) {
                        await window.FirebaseBackend.saveCloudSettings(appData.settings);
                    }
                }
                alert(`✅ Quilometragem zerada com sucesso no banco de dados!\n${initialKm > 0 ? `Odômetro da moto definido em ${initialKm.toLocaleString('pt-BR')} km.` : 'Odômetro zerado.'}\nTodos os seus valores financeiros foram mantidos.`);
            } catch (err) {
                alert("Aviso: Dados atualizados localmente, mas ocorreu um erro na sincronização em nuvem: " + err.message);
            } finally {
                elements.resetAllKmBtn.innerHTML = '<i class="fa-solid fa-gauge-simple"></i> Zerar Km/Odômetro dos Lançamentos';
                elements.resetAllKmBtn.disabled = false;
                elements.goalModal.classList.remove("show");
            }
        });
    }

    // Alternador de Tema
    elements.themeToggle.addEventListener("click", () => {
        const currentTheme = document.body.getAttribute("data-theme") || "dark";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.body.setAttribute("data-theme", newTheme);
        appData.theme = newTheme;
        saveData();
        
        // Atualiza ícone
        const icon = elements.themeToggle.querySelector("i");
        if (icon) {
            icon.className = newTheme === "light" ? "fa-solid fa-sun" : "fa-solid fa-moon";
        }
        updateUI();
    });

    // --- MODAL & LÓGICA DE BACKUP / EXPORTAR (Otimizado para iOS/iPhone e Desktop) ---
    elements.exportBtn.addEventListener("click", () => {
        const jsonString = JSON.stringify(appData, null, 2);
        elements.backupTextarea.value = jsonString;
        elements.backupModal.classList.add("show");
    });

    elements.closeBackupModalBtn.addEventListener("click", () => {
        elements.backupModal.classList.remove("show");
    });

    // 1. Compartilhar nativo (WhatsApp, Arquivos, Notas, etc.)
    elements.backupShareBtn.addEventListener("click", async () => {
        const jsonString = JSON.stringify(appData, null, 2);
        const fileName = `controle99_backup_${getLocalDateString()}.json`;

        if (navigator.share) {
            try {
                const file = new File([jsonString], fileName, { type: 'application/json' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Backup controle99',
                        text: 'Meu backup de dados do controle99'
                    });
                    return;
                } else {
                    await navigator.share({
                        title: 'Backup controle99',
                        text: jsonString
                    });
                    return;
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Erro ao compartilhar:', err);
                }
            }
        }
        
        // Fallback se Web Share não for suportado
        copyBackupToClipboard(jsonString);
    });

    // 2. Copiar código de backup para área de transferência
    elements.backupCopyBtn.addEventListener("click", () => {
        copyBackupToClipboard(elements.backupTextarea.value);
    });

    // 3. Baixar arquivo .json (Blob)
    elements.backupDownloadBtn.addEventListener("click", () => {
        const jsonString = JSON.stringify(appData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const fileName = `controle99_backup_${getLocalDateString()}.json`;
        
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = url;
        downloadAnchor.download = fileName;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        setTimeout(() => {
            downloadAnchor.remove();
            URL.revokeObjectURL(url);
        }, 100);
    });

    // --- MODAL & LÓGICA DE IMPORTAR / RESTAURAR ---
    elements.importBtn.addEventListener("click", () => {
        elements.importTextarea.value = "";
        elements.importModal.classList.add("show");
    });

    elements.closeImportModalBtn.addEventListener("click", () => {
        elements.importModal.classList.remove("show");
    });

    // Importar via arquivo selecionado
    elements.importFileModal.addEventListener("change", (e) => {
        const fileReader = new FileReader();
        fileReader.onload = function() {
            try {
                const parsed = JSON.parse(fileReader.result);
                applyImportedData(parsed);
            } catch (err) {
                alert("Erro ao ler o arquivo. Verifique se o arquivo selecionado é um JSON de backup válido.");
            }
        };
        if (e.target.files[0]) {
            fileReader.readAsText(e.target.files[0]);
        }
    });

    // Importar via texto colado
    elements.processImportBtn.addEventListener("click", () => {
        const rawText = elements.importTextarea.value.trim();
        if (!rawText) {
            alert("Por favor, selecione um arquivo de backup ou cole o código JSON no campo de texto.");
            return;
        }
        try {
            const parsed = JSON.parse(rawText);
            applyImportedData(parsed);
        } catch (err) {
            alert("Código de backup inválido. Certifique-se de ter copiado o código completo.");
        }
    });

    // --- AUTENTICAÇÃO E LOGOUT ---
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener("click", async () => {
            if (confirm("Deseja sair da sua conta?")) {
                await window.FirebaseBackend.signOutUser();
                localStorage.removeItem("controle99_data");
                appData = { entries: [], settings: { dailyGoal: 150, oilChangeInterval: 1000, lastOilChangeDate: "" }, theme: "dark" };
                showLoginScreen();
            }
        });
    }
}

// Auxiliar: Copia texto com fallback para iOS
function copyBackupToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert("✅ Código de backup copiado! Você pode colar no WhatsApp, Bloco de Notas ou e-mail.");
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    elements.backupTextarea.select();
    elements.backupTextarea.setSelectionRange(0, 99999);
    try {
        document.execCommand('copy');
        alert("✅ Código de backup copiado!");
    } catch (e) {
        alert("Selecione todo o texto da caixa e copie manualmente.");
    }
}

// Auxiliar: Aplica os dados importados
function applyImportedData(parsed) {
    if (parsed && (parsed.entries || parsed.settings)) {
        if (confirm("Isto substituirá os dados atuais nesta máquina pelos dados do backup. Deseja continuar?")) {
            appData = {
                entries: parsed.entries || [],
                settings: parsed.settings || { dailyGoal: 150, oilChangeInterval: 1000, lastOilChangeDate: "" },
                theme: parsed.theme || "dark"
            };
            saveData();
            initTheme();
            updateUI();
            elements.importModal.classList.remove("show");
            alert("🎉 Backup restaurado com sucesso!");
        }
    } else {
        alert("O conteúdo fornecido não parece ser um backup válido do controle99.");
    }
}

// Inicializa o tema do App
function initTheme() {
    const savedTheme = appData.theme || "dark";
    document.body.setAttribute("data-theme", savedTheme);
    const icon = elements.themeToggle.querySelector("i");
    if (savedTheme === "light") {
        icon.className = "fa-solid fa-sun";
    } else {
        icon.className = "fa-solid fa-moon";
    }
}

// Salva um lançamento do Formulário
function saveEntry() {
    const date = elements.dateInput.value;
    const rides = parseFloat(elements.ridesInput.value) || 0;
    const tips = parseFloat(elements.tipsInput.value) || 0;
    const rawOdometer = parseFloat(elements.kmInput.value) || 0;
    const rawDayKm = parseFloat(elements.kmDayDrivenInput ? elements.kmDayDrivenInput.value : 0) || 0;
    const hours = parseFloat(elements.hoursInput.value) || 0;
    const fuel = parseFloat(elements.fuelInput.value) || 0;
    const food = parseFloat(elements.foodInput.value) || 0;
    const others = parseFloat(elements.othersInput.value) || 0;
    const notes = elements.notesInput.value.trim();

    // Validação mínima
    if (rides === 0 && tips === 0 && fuel === 0 && food === 0 && others === 0 && rawOdometer === 0 && rawDayKm === 0) {
        alert("Por favor, preencha pelo menos um valor de ganho, gasto ou quilometragem.");
        return;
    }

    // Calcula Odômetro x Km rodados no dia
    const prevOdometer = getPreviousKnownOdometer(date);

    let odometer = 0;
    let kmDriven = 0;

    if (rawDayKm > 0) {
        kmDriven = rawDayKm;
        odometer = rawOdometer > 0 ? rawOdometer : (prevOdometer > 0 ? (prevOdometer + rawDayKm) : 0);
    } else if (rawOdometer > 0) {
        odometer = rawOdometer;
        if (prevOdometer > 0 && rawOdometer > prevOdometer) {
            kmDriven = rawOdometer - prevOdometer;
        } else if (rawOdometer < 500 && prevOdometer === 0) {
            kmDriven = rawOdometer;
        } else {
            kmDriven = 0;
        }
    }

    const newEntry = {
        id: Date.now().toString(),
        date,
        rides,
        tips,
        km: kmDriven,
        odometer: odometer,
        hours,
        fuel,
        food,
        others,
        notes
    };

    // Verifica se já existe um registro nessa data
    const existingIndex = appData.entries.findIndex(entry => entry.date === date);
    if (existingIndex !== -1) {
        if (confirm("Já existe um registro para esta data. Deseja somar os novos valores a ele? (Se não, o registro antigo será substituído)")) {
            // Soma
            appData.entries[existingIndex].rides += rides;
            appData.entries[existingIndex].tips += tips;
            appData.entries[existingIndex].km += kmDriven;
            appData.entries[existingIndex].odometer = Math.max(appData.entries[existingIndex].odometer || 0, odometer);
            appData.entries[existingIndex].hours += hours;
            appData.entries[existingIndex].fuel += fuel;
            appData.entries[existingIndex].food += food;
            appData.entries[existingIndex].others += others;
            if (notes) {
                appData.entries[existingIndex].notes += ` | ${notes}`;
            }
        } else {
            // Substitui
            appData.entries[existingIndex] = newEntry;
        }
    } else {
        // Insere novo
        appData.entries.push(newEntry);
    }

    // Ordena por data decrescente
    appData.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Sincroniza com a nuvem (Supabase) se estiver logado
    const targetEntry = existingIndex !== -1 ? appData.entries[existingIndex] : newEntry;
    if (window.FirebaseBackend) {
        window.FirebaseBackend.saveCloudEntry(targetEntry).catch(e => console.log("Offline / Sync pendente:", e));
    }

    saveData();
    updateUI();
    
    // Reseta o formulário mantendo a data padrão
    elements.form.reset();
    setDefaultDate();
    syncKmFieldsFromOdometer();
}

// Deleta um lançamento
function deleteEntry(id) {
    if (confirm("Deseja mesmo excluir este lançamento?")) {
        appData.entries = appData.entries.filter(entry => entry.id !== id);
        saveData();
        updateUI();
        if (window.FirebaseBackend) {
            window.FirebaseBackend.deleteCloudEntry(id).catch(e => console.log("Offline / Sync delete pendente:", e));
        }
    }
}

// Atualiza toda a Interface do App
function updateUI() {
    const filteredEntries = getFilteredEntries();
    
    // Cálculos Totais baseados no período selecionado
    let totalRides = 0;
    let totalTips = 0;
    let totalKm = 0;
    let totalHours = 0;
    let totalFuel = 0;
    let totalFood = 0;
    let totalOthers = 0;

    filteredEntries.forEach(entry => {
        totalRides += parseFloat(entry.rides) || 0;
        totalTips += parseFloat(entry.tips) || 0;
        totalKm += parseFloat(entry.km) || 0;
        totalHours += parseFloat(entry.hours) || 0;
        totalFuel += parseFloat(entry.fuel) || 0;
        totalFood += parseFloat(entry.food) || 0;
        totalOthers += parseFloat(entry.others) || 0;
    });

    const totalRevenue = totalRides + totalTips;
    const totalExpenses = totalFuel + totalFood + totalOthers;
    const netProfit = totalRevenue - totalExpenses;

    // Atualização de Métricas Principais (KPIs)
    elements.kpiNetProfit.innerText = formatCurrency(netProfit);
    elements.kpiGrossRevenue.innerText = formatCurrency(totalRevenue);
    elements.kpiTotalExpenses.innerText = formatCurrency(totalExpenses);
    elements.kpiTotalKm.innerText = `${totalKm.toFixed(1)} km`;

    // Odômetro atual do painel da moto
    let maxEntryOdometer = 0;
    appData.entries.forEach(entry => {
        const val = parseFloat(entry.odometer) || 0;
        if (val > maxEntryOdometer) {
            maxEntryOdometer = val;
        }
    });
    const lastOilKm = parseFloat(appData.settings.lastOilChangeKm) || 0;
    const currentOdometer = Math.max(maxEntryOdometer, lastOilKm);

    if (elements.kpiOdometerText) {
        elements.kpiOdometerText.innerText = currentOdometer > 0 
            ? `Painel: ${currentOdometer.toLocaleString('pt-BR')} km` 
            : 'Painel: -';
    }

    // Atualização dos textos de ajuda das KPIs
    const profitPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(0) : 0;
    elements.kpiProfitPct.innerText = `${profitPct}% de lucro líquido sobre receita`;
    elements.kpiProfitPct.className = `trend ${netProfit > 0 ? 'success' : (netProfit < 0 ? 'danger' : 'neutral')}`;

    elements.kpiRidesCount.innerText = `${filteredEntries.length} dia(s) registrados`;

    const expensePct = totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(0) : 0;
    elements.kpiExpensePct.innerText = `${expensePct}% consumido em despesas`;

    const earningPerKm = totalKm > 0 ? (totalRevenue / totalKm) : 0;
    elements.kpiEarningPerKm.innerText = `Faturamento: R$ ${earningPerKm.toFixed(2)} / km`;

    // Atualização dos Widgets (Troca de Óleo e Metas)
    updateOilWidget();
    updateGoalWidget();

    // Atualização do Histórico (Tabela)
    renderHistoryTable(filteredEntries);

    // Atualização do Gráfico
    renderChart();
}

// Filtra as entradas baseado no seletor de período
function getFilteredEntries() {
    const period = elements.filterPeriod.value;
    if (period === "all") return appData.entries;

    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - parseInt(period));
    
    return appData.entries.filter(entry => new Date(entry.date) >= limitDate);
}

// Atualiza o Widget de Óleo (Baseado no Odômetro e intervalo configurado ex: 1000 km)
function updateOilWidget() {
    const interval = parseInt(appData.settings.oilChangeInterval) || 1000;
    const lastOilKm = parseFloat(appData.settings.lastOilChangeKm) || 0;
    
    // Encontra o odômetro máximo registrado nos lançamentos de corridas
    let maxEntryOdometer = 0;
    appData.entries.forEach(entry => {
        const val = parseFloat(entry.odometer) || 0;
        if (val > maxEntryOdometer) {
            maxEntryOdometer = val;
        }
    });

    // O odômetro atual do painel da moto é o maior entre os lançamentos e a troca informada
    const currentOdometer = Math.max(maxEntryOdometer, lastOilKm);

    // Se o odômetro da última troca ainda não existe mas há lançamentos, define como o odômetro atual
    if (!appData.settings.lastOilChangeKm && currentOdometer > 0) {
        appData.settings.lastOilChangeKm = currentOdometer;
        saveData();
    }

    // Km rodados com o óleo atual
    const effectiveLastOilKm = parseFloat(appData.settings.lastOilChangeKm) || 0;
    const kmWithCurrentOil = (currentOdometer >= effectiveLastOilKm && effectiveLastOilKm > 0)
        ? (currentOdometer - effectiveLastOilKm)
        : (maxEntryOdometer > 0 ? maxEntryOdometer : 0);

    const nextOilKm = effectiveLastOilKm > 0 ? (effectiveLastOilKm + interval) : interval;

    // Calcula porcentagem da barra
    const percentage = Math.min(100, (kmWithCurrentOil / interval) * 100);
    elements.oilProgress.style.width = `${percentage}%`;

    // Texto da barra
    if (effectiveLastOilKm > 0) {
        elements.oilKmText.innerText = `${kmWithCurrentOil.toFixed(0)} / ${interval} km rodados com este óleo`;
    } else {
        elements.oilKmText.innerText = `${kmWithCurrentOil.toFixed(0)} / ${interval} km rodados`;
    }

    // Subdetalhes exibindo odômetro da troca e da próxima troca
    if (elements.oilLastKm) {
        elements.oilLastKm.innerText = effectiveLastOilKm > 0 ? `${effectiveLastOilKm.toLocaleString('pt-BR')} km` : 'Não informado';
    }
    if (elements.oilNextKm) {
        elements.oilNextKm.innerText = effectiveLastOilKm > 0 ? `${nextOilKm.toLocaleString('pt-BR')} km` : `${interval.toLocaleString('pt-BR')} km`;
    }

    // Atualiza status do badge
    if (kmWithCurrentOil >= interval) {
        const overflow = kmWithCurrentOil - interval;
        elements.oilStatusText.innerText = overflow > 0 ? `Trocar Óleo! (+${overflow.toFixed(0)}km)` : "Trocar Óleo!";
        elements.oilStatusText.className = "status-badge red";
        elements.oilProgress.style.backgroundColor = "var(--accent-red)";
    } else if (kmWithCurrentOil >= interval * 0.8) {
        const remaining = interval - kmWithCurrentOil;
        elements.oilStatusText.innerText = `Atenção (Falta ${remaining.toFixed(0)}km)`;
        elements.oilStatusText.className = "status-badge yellow";
        elements.oilProgress.style.backgroundColor = "var(--accent-yellow)";
    } else {
        const remaining = interval - kmWithCurrentOil;
        elements.oilStatusText.innerText = `Tudo OK (Falta ${remaining.toFixed(0)}km)`;
        elements.oilStatusText.className = "status-badge green";
        elements.oilProgress.style.backgroundColor = "var(--accent-blue)";
    }
}

// Atualiza o Widget de Metas (Baseado nos ganhos de HOJE)
function updateGoalWidget() {
    const todayStr = getLocalDateString();
    const todayEntry = appData.entries.find(entry => entry.date === todayStr);
    
    const todayRevenue = todayEntry ? (todayEntry.rides + todayEntry.tips) : 0;
    const goal = appData.settings.dailyGoal;
    
    const percentage = Math.min(100, (todayRevenue / goal) * 100);
    elements.goalProgress.style.width = `${percentage}%`;
    elements.goalText.innerText = `R$ ${todayRevenue.toFixed(2)} / R$ ${goal.toFixed(0)}`;
    
    elements.goalStatusText.innerText = `${percentage.toFixed(0)}%`;
    if (percentage >= 100) {
        elements.goalStatusText.className = "status-badge green";
    } else if (percentage >= 50) {
        elements.goalStatusText.className = "status-badge yellow";
    } else {
        elements.goalStatusText.className = "status-badge";
    }
}

// Renderiza a Tabela do Histórico
function renderHistoryTable(entriesList) {
    elements.historyList.innerHTML = "";

    if (entriesList.length === 0) {
        elements.historyList.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">Nenhum registro encontrado no período selecionado.</td>
            </tr>
        `;
        return;
    }

    entriesList.forEach(entry => {
        const revenue = entry.rides + entry.tips;
        const expenses = entry.fuel + entry.food + entry.others;
        const profit = revenue - expenses;
        const efficiency = entry.km > 0 ? `R$ ${(revenue / entry.km).toFixed(2)}/km` : 'N/A';

        const kmDisplay = entry.odometer && entry.odometer > entry.km
            ? `${entry.km.toFixed(1)} km<br><small style="color: var(--text-muted); font-size: 0.72rem;">Painel: ${entry.odometer.toLocaleString('pt-BR')} km</small>`
            : `${entry.km.toFixed(1)} km`;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="font-weight: 500;">${formatDateString(entry.date)}</td>
            <td>${kmDisplay}</td>
            <td style="color: var(--accent-green); font-weight: 500;">${formatCurrency(revenue)}</td>
            <td style="color: var(--accent-red);">${formatCurrency(expenses)}</td>
            <td style="font-weight: 600; color: ${profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">
                ${formatCurrency(profit)}
            </td>
            <td><span class="status-badge" style="background-color: var(--bg-card); border: 1px solid var(--border-color);">${efficiency}</span></td>
            <td class="actions-cell">
                <button class="btn-table-icon" onclick="editEntry('${entry.id}')" title="Editar Lançamento">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn-table-icon" onclick="showDetailsEntry('${entry.id}')" title="Ver Detalhes do Dia">
                    <i class="fa-solid fa-circle-info"></i>
                </button>
                <button class="btn-table-icon" onclick="deleteEntry('${entry.id}')" title="Excluir Lançamento">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        elements.historyList.appendChild(row);
    });
}

// Carrega os dados de um lançamento existente no formulário para edição
function editEntry(id) {
    const entry = appData.entries.find(e => e.id === id);
    if (!entry) return;

    elements.dateInput.value = entry.date;
    elements.ridesInput.value = entry.rides > 0 ? entry.rides : '';
    elements.tipsInput.value = entry.tips > 0 ? entry.tips : '';
    elements.kmInput.value = entry.odometer > 0 ? entry.odometer : '';
    if (elements.kmDayDrivenInput) {
        elements.kmDayDrivenInput.value = entry.km > 0 ? entry.km : '';
    }
    elements.hoursInput.value = entry.hours > 0 ? entry.hours : '';
    elements.fuelInput.value = entry.fuel > 0 ? entry.fuel : '';
    elements.foodInput.value = entry.food > 0 ? entry.food : '';
    elements.othersInput.value = entry.others > 0 ? entry.others : '';
    elements.notesInput.value = entry.notes || '';

    syncKmFieldsFromOdometer();

    if (elements.form) {
        elements.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    elements.ridesInput.focus();
}
window.editEntry = editEntry;

// Exibe modal ou alerta com o detalhamento completo do dia selecionado
function showDetailsEntry(id) {
    const entry = appData.entries.find(e => e.id === id);
    if (!entry) return;

    const totalRevenue = entry.rides + entry.tips;
    const totalExpenses = entry.fuel + entry.food + entry.others;
    const netProfit = totalRevenue - totalExpenses;
    const odometerText = entry.odometer ? ` (Painel: ${entry.odometer.toLocaleString('pt-BR')} km)` : '';

    const detailText = `
📅 DETALHES DO DIA ${formatDateString(entry.date)}

💰 GANHOS:
- Corridas 99: ${formatCurrency(entry.rides)}
- Gorjetas: ${formatCurrency(entry.tips)}
- Total Faturamento: ${formatCurrency(totalRevenue)}

💸 GASTOS:
- Combustível: ${formatCurrency(entry.fuel)}
- Alimentação: ${formatCurrency(entry.food)}
- Outros (Aluguel / Manutenção / Óleo): ${formatCurrency(entry.others)}
- Total Despesas: ${formatCurrency(totalExpenses)}

📊 RESUMO:
- Lucro Líquido: ${formatCurrency(netProfit)}
- Km Rodados: ${entry.km.toFixed(1)} km${odometerText}
- Horas Trabalhadas: ${entry.hours} h
- Observações: ${entry.notes || 'Nenhuma'}
    `.trim();

    alert(detailText);
}
window.showDetailsEntry = showDetailsEntry;

// Renderiza o gráfico do Chart.js
function renderChart() {
    // Destrói gráfico anterior se houver para evitar loops de renderização
    if (financeChart) {
        financeChart.destroy();
    }

    const ctx = document.getElementById('finance-chart').getContext('2d');
    
    // Obtém as últimas 10 entradas ordenadas cronologicamente
    const recentEntries = [...appData.entries]
        .slice(0, 10)
        .reverse();

    if (recentEntries.length === 0) {
        // Sem dados para renderizar gráfico
        ctx.clearRect(0, 0, 400, 300);
        return;
    }

    const labels = recentEntries.map(e => formatDateStringShort(e.date));
    const profitData = recentEntries.map(e => (e.rides + e.tips) - (e.fuel + e.food + e.others));
    const expenseData = recentEntries.map(e => e.fuel + e.food + e.others);

    // Ajusta cores de acordo com o tema atual
    const isDark = (document.body.getAttribute("data-theme") || "dark") === "dark";
    const textGridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const textTicksColor = isDark ? "#94a3b8" : "#475569";

    financeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Lucro Líquido (R$)',
                    data: profitData,
                    backgroundColor: 'rgba(16, 185, 129, 0.75)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderRadius: 6,
                    maxBarThickness: 35
                },
                {
                    label: 'Gastos Totais (R$)',
                    data: expenseData,
                    backgroundColor: 'rgba(239, 68, 68, 0.75)',
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    borderRadius: 6,
                    maxBarThickness: 35
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Oculta legenda do Chart.js para usar a legenda HTML customizada
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: textTicksColor,
                        font: {
                            family: 'Outfit'
                        }
                    }
                },
                y: {
                    grid: {
                        color: textGridColor
                    },
                    ticks: {
                        color: textTicksColor,
                        font: {
                            family: 'Outfit'
                        },
                        callback: function(value) {
                            return 'R$ ' + value;
                        }
                    }
                }
            }
        }
    });
}

// Helpers de formatação
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Associa a exclusão ao escopo global explicitamente para garantir chamadas dinâmicas inline
window.deleteEntry = deleteEntry;

function formatDateString(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

function formatDateStringShort(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
}

// Registro do Service Worker (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker do controle99 registrado!'))
            .catch(err => console.error('Erro ao registrar Service Worker:', err));
    });
}
