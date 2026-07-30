// State Management
let appData = {
    entries: [],
    settings: {
        dailyGoal: 150,
        oilChangeInterval: 1000,
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
    kpiEarningPerKm: document.getElementById("kpi-earning-per-km"),
    
    // Widgets
    oilProgress: document.getElementById("oil-progress"),
    oilKmText: document.getElementById("oil-km-text"),
    oilStatusText: document.getElementById("oil-status-text"),
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

    // Auth & Supabase UI
    authBtn: document.getElementById("auth-btn"),
    userBadge: document.getElementById("user-badge"),
    userEmailText: document.getElementById("user-email-text"),
    logoutBtn: document.getElementById("logout-btn"),

    authModal: document.getElementById("auth-modal"),
    authEmail: document.getElementById("auth-email"),
    authPassword: document.getElementById("auth-password"),
    submitLoginBtn: document.getElementById("submit-login-btn"),
    submitSignupBtn: document.getElementById("submit-signup-btn"),
    openConfigBtn: document.getElementById("open-config-btn"),
    closeAuthModalBtn: document.getElementById("close-auth-modal-btn"),

    supabaseConfigModal: document.getElementById("supabase-config-modal"),
    supabaseUrlInput: document.getElementById("supabase-url-input"),
    supabaseKeyInput: document.getElementById("supabase-key-input"),
    saveSupabaseConfigBtn: document.getElementById("save-supabase-config-btn"),
    closeSupabaseConfigModalBtn: document.getElementById("close-supabase-config-modal-btn")
};

// Variável para instância do Gráfico
let financeChart = null;

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    setupEventListeners();
    setupLoginScreen();
    
    // Checa se o usuário já está logado
    checkLoginState();
});

// Configura os event listeners da tela de login
function setupLoginScreen() {
    const loginEnterBtn = document.getElementById("login-enter-btn");
    const loginCreateBtn = document.getElementById("login-create-btn");
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-password");
    const loginError = document.getElementById("login-error");

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
            await window.SupabaseBackend.signInUser(email, password);
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
            await window.SupabaseBackend.signUpUser(email, password);
            // Tenta logar automaticamente após criar
            await window.SupabaseBackend.signInUser(email, password);
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
    if (!window.SupabaseBackend) {
        showLoginScreen();
        return;
    }
    try {
        const user = await window.SupabaseBackend.getCurrentUser();
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

    // Carrega dados do Supabase
    await loadDataFromCloud();
    setDefaultDate();
    updateUI();
    checkUserSession();
}

// Carrega dados do Supabase (nuvem) prioritariamente
async function loadDataFromCloud() {
    try {
        const cloudEntries = await window.SupabaseBackend.fetchCloudEntries();
        if (cloudEntries && cloudEntries.length > 0) {
            appData.entries = cloudEntries;
            saveData();
            return;
        }
    } catch (err) {
        console.log("Erro ao buscar dados da nuvem:", err);
    }
    
    // Fallback: carrega do localStorage se houver
    const stored = localStorage.getItem("controle99_data");
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.entries && parsed.entries.length > 0) {
                appData = parsed;
                if (!appData.settings) {
                    appData.settings = { dailyGoal: 150, oilChangeInterval: 1000, lastOilChangeDate: "2026-07-13" };
                }
            }
        } catch (e) {
            console.error("Erro ao ler LocalStorage.", e);
        }
    }
}

// Define a data padrão do formulário como "hoje"
function setDefaultDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    elements.dateInput.value = `${yyyy}-${mm}-${dd}`;
}

// Salva os dados no LocalStorage
function saveData() {
    localStorage.setItem("controle99_data", JSON.stringify(appData));
}

// Configuração de Event Listeners
function setupEventListeners() {
    // Submissão do Formulário
    elements.form.addEventListener("submit", (e) => {
        e.preventDefault();
        saveEntry();
    });

    // Filtro de Histórico
    elements.filterPeriod.addEventListener("change", updateUI);

    // Botão Limpar Tudo
    elements.clearDataBtn.addEventListener("click", () => {
        if (confirm("Tem certeza que deseja apagar TODOS os seus lançamentos? Esta ação não pode ser desfeita.")) {
            appData.entries = [];
            saveData();
            updateUI();
        }
    });

    // Reset da Troca de Óleo
    elements.resetOilBtn.addEventListener("click", () => {
        if (confirm("Você realizou a troca de óleo? Isso zerará o marcador de Km rodados desde a última troca.")) {
            appData.settings.lastOilChangeDate = new Date().toISOString().split('T')[0];
            saveData();
            updateUI();
        }
    });

    // Controle do Modal de Metas/Configurações
    elements.editGoalBtn.addEventListener("click", () => {
        elements.configGoalInput.value = appData.settings.dailyGoal;
        elements.configOilInput.value = appData.settings.oilChangeInterval;
        elements.goalModal.classList.add("show");
    });

    elements.closeModalBtn.addEventListener("click", () => {
        elements.goalModal.classList.remove("show");
    });

    elements.saveConfigBtn.addEventListener("click", () => {
        const goal = parseFloat(elements.configGoalInput.value) || 150;
        const oil = parseInt(elements.configOilInput.value) || 1000;
        appData.settings.dailyGoal = goal;
        appData.settings.oilChangeInterval = oil;
        saveData();
        elements.goalModal.classList.remove("show");
        updateUI();
    });

    // Alternador de Tema
    elements.themeToggle.addEventListener("click", () => {
        const currentTheme = document.body.getAttribute("data-theme") || "dark";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.body.setAttribute("data-theme", newTheme);
        appData.theme = newTheme;
        saveData();
        
        // Atualiza ícone
        const icon = elements.themeToggle.querySelector("i");
        if (newTheme === "light") {
            icon.className = "fa-solid fa-sun";
        } else {
            icon.className = "fa-solid fa-moon";
        }
        
        // Recria gráfico para ajustar cores do tema
        renderChart();
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
        const fileName = `controle99_backup_${new Date().toISOString().split('T')[0]}.json`;

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
        const fileName = `controle99_backup_${new Date().toISOString().split('T')[0]}.json`;
        
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

    // --- AUTENTICAÇÃO E CONEXÃO SUPABASE ---
    if (elements.authBtn) {
        elements.authBtn.addEventListener("click", () => {
            elements.authModal.classList.add("show");
        });

        elements.closeAuthModalBtn.addEventListener("click", () => {
            elements.authModal.classList.remove("show");
        });

        elements.openConfigBtn.addEventListener("click", () => {
            elements.authModal.classList.remove("show");
            elements.supabaseUrlInput.value = localStorage.getItem("controle99_supabase_url") || "";
            elements.supabaseKeyInput.value = localStorage.getItem("controle99_supabase_key") || "";
            elements.supabaseConfigModal.classList.add("show");
        });

        elements.closeSupabaseConfigModalBtn.addEventListener("click", () => {
            elements.supabaseConfigModal.classList.remove("show");
        });

        elements.saveSupabaseConfigBtn.addEventListener("click", () => {
            const url = elements.supabaseUrlInput.value;
            const key = elements.supabaseKeyInput.value;
            if (!url || !key) {
                alert("Por favor, preencha a URL e a Anon Key do seu projeto no Supabase.");
                return;
            }
            if (window.SupabaseBackend && window.SupabaseBackend.saveSupabaseConfig(url, key)) {
                alert("✅ Conexão com o Supabase salva!");
                elements.supabaseConfigModal.classList.remove("show");
                checkUserSession();
            } else {
                alert("Erro ao validar credenciais. Verifique a URL e a Chave.");
            }
        });

        elements.submitLoginBtn.addEventListener("click", async () => {
            const email = elements.authEmail.value.trim();
            const password = elements.authPassword.value.trim();
            if (!email || !password) {
                alert("Preencha o e-mail e a senha.");
                return;
            }
            try {
                elements.submitLoginBtn.innerText = "Entrando...";
                await window.SupabaseBackend.signInUser(email, password);
                elements.authModal.classList.remove("show");
                alert("🎉 Login efetuado com sucesso!");
                checkUserSession();
            } catch (err) {
                alert("Erro no login: " + (err.message || err));
            } finally {
                elements.submitLoginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar na Conta';
            }
        });

        elements.submitSignupBtn.addEventListener("click", async () => {
            const email = elements.authEmail.value.trim();
            const password = elements.authPassword.value.trim();
            if (!email || !password) {
                alert("Preencha o e-mail e a senha.");
                return;
            }
            try {
                elements.submitSignupBtn.innerText = "Criando conta...";
                await window.SupabaseBackend.signUpUser(email, password);
                alert("🎉 Conta criada com sucesso!");
                elements.authModal.classList.remove("show");
                checkUserSession();
            } catch (err) {
                alert("Erro ao criar conta: " + (err.message || err));
            } finally {
                elements.submitSignupBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Criar Nova Conta';
            }
        });

        elements.logoutBtn.addEventListener("click", async () => {
            if (confirm("Deseja sair da sua conta?")) {
                await window.SupabaseBackend.signOutUser();
                localStorage.removeItem("controle99_data");
                appData = { entries: [], settings: { dailyGoal: 150, oilChangeInterval: 1000, lastOilChangeDate: "" }, theme: "dark" };
                showLoginScreen();
            }
        });
    }
}

// Checa sessão do usuário no Supabase e sincroniza dados em nuvem
async function checkUserSession() {
    if (!window.SupabaseBackend) return;
    try {
        const user = await window.SupabaseBackend.getCurrentUser();
        if (user) {
            elements.userBadge.style.display = "inline-flex";
            elements.userEmailText.innerText = user.email;
            elements.authBtn.style.display = "none";

            const cloudEntries = await window.SupabaseBackend.fetchCloudEntries();
            if (cloudEntries && cloudEntries.length > 0) {
                appData.entries = cloudEntries;
                saveData();
                updateUI();
            } else if (appData.entries && appData.entries.length > 0) {
                if (confirm(`Sua conta na nuvem está vazia. Deseja enviar seus ${appData.entries.length} lançamentos salvos para a sua conta na nuvem agora?`)) {
                    await window.SupabaseBackend.syncLocalEntriesToCloud(appData.entries);
                    alert("🚀 Lançamentos resgatados foram salvos com sucesso no seu banco em nuvem!");
                }
            }
        } else {
            elements.userBadge.style.display = "none";
            elements.authBtn.style.display = "inline-flex";
        }
    } catch (err) {
        console.log("Supabase aguardando login ou chaves.", err);
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
    const km = parseFloat(elements.kmInput.value) || 0;
    const hours = parseFloat(elements.hoursInput.value) || 0;
    const fuel = parseFloat(elements.fuelInput.value) || 0;
    const food = parseFloat(elements.foodInput.value) || 0;
    const others = parseFloat(elements.othersInput.value) || 0;
    const notes = elements.notesInput.value.trim();

    // Validação mínima
    if (rides === 0 && tips === 0 && fuel === 0 && food === 0 && others === 0 && km === 0) {
        alert("Por favor, preencha pelo menos um valor de ganho, gasto ou km rodado.");
        return;
    }

    const newEntry = {
        id: Date.now().toString(),
        date,
        rides,
        tips,
        km,
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
            appData.entries[existingIndex].km += km;
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
    if (window.SupabaseBackend) {
        window.SupabaseBackend.saveCloudEntry(targetEntry).catch(e => console.log("Offline / Sync pendente:", e));
    }

    saveData();
    updateUI();
    
    // Reseta o formulário mantendo a data padrão
    elements.form.reset();
    setDefaultDate();
}

// Deleta um lançamento
function deleteEntry(id) {
    if (confirm("Deseja mesmo excluir este lançamento?")) {
        appData.entries = appData.entries.filter(entry => entry.id !== id);
        saveData();
        updateUI();
        if (window.SupabaseBackend) {
            window.SupabaseBackend.deleteCloudEntry(id).catch(e => console.log("Offline / Sync delete pendente:", e));
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
        totalRides += entry.rides;
        totalTips += entry.tips;
        totalKm += entry.km;
        totalHours += entry.hours;
        totalFuel += entry.fuel;
        totalFood += entry.food;
        totalOthers += entry.others;
    });

    const totalRevenue = totalRides + totalTips;
    const totalExpenses = totalFuel + totalFood + totalOthers;
    const netProfit = totalRevenue - totalExpenses;

    // Atualização de Métricas Principais (KPIs)
    elements.kpiNetProfit.innerText = formatCurrency(netProfit);
    elements.kpiGrossRevenue.innerText = formatCurrency(totalRevenue);
    elements.kpiTotalExpenses.innerText = formatCurrency(totalExpenses);
    elements.kpiTotalKm.innerText = `${totalKm.toFixed(1)} km`;

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

// Atualiza o Widget de Óleo (Km desde a última troca)
function updateOilWidget() {
    const interval = appData.settings.oilChangeInterval;
    const lastResetDate = appData.settings.lastOilChangeDate;
    
    // Soma os Km rodados após a data de reset
    let kmSinceLastChange = 0;
    appData.entries.forEach(entry => {
        if (!lastResetDate || entry.date >= lastResetDate) {
            kmSinceLastChange += entry.km;
        }
    });

    // Calcula porcentagem da barra
    const percentage = Math.min(100, (kmSinceLastChange / interval) * 100);
    elements.oilProgress.style.width = `${percentage}%`;
    elements.oilKmText.innerText = `${kmSinceLastChange.toFixed(0)} / ${interval} km rodados`;

    // Atualiza status do badge
    if (kmSinceLastChange >= interval) {
        elements.oilStatusText.innerText = "Trocar Óleo!";
        elements.oilStatusText.className = "status-badge red";
        elements.oilProgress.style.backgroundColor = "var(--accent-red)";
    } else if (kmSinceLastChange >= interval * 0.8) {
        elements.oilStatusText.innerText = "Atenção";
        elements.oilStatusText.className = "status-badge yellow";
        elements.oilProgress.style.backgroundColor = "var(--accent-yellow)";
    } else {
        elements.oilStatusText.innerText = "Tudo OK";
        elements.oilStatusText.className = "status-badge green";
        elements.oilProgress.style.backgroundColor = "var(--accent-blue)";
    }
}

// Atualiza o Widget de Metas (Baseado nos ganhos de HOJE)
function updateGoalWidget() {
    const todayStr = new Date().toISOString().split('T')[0];
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

        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="font-weight: 500;">${formatDateString(entry.date)}</td>
            <td>${entry.km.toFixed(1)} km</td>
            <td style="color: var(--accent-green); font-weight: 500;">${formatCurrency(revenue)}</td>
            <td style="color: var(--accent-red);">${formatCurrency(expenses)}</td>
            <td style="font-weight: 600; color: ${profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">
                ${formatCurrency(profit)}
            </td>
            <td><span class="status-badge" style="background-color: var(--bg-card); border: 1px solid var(--border-color);">${efficiency}</span></td>
            <td class="actions-cell">
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

// Exibe modal ou alerta com o detalhamento completo do dia selecionado
function showDetailsEntry(id) {
    const entry = appData.entries.find(e => e.id === id);
    if (!entry) return;

    const totalRevenue = entry.rides + entry.tips;
    const totalExpenses = entry.fuel + entry.food + entry.others;
    const netProfit = totalRevenue - totalExpenses;

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
- Km Rodados: ${entry.km.toFixed(1)} km
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
