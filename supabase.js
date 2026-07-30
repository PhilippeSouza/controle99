// Configuração do Supabase Client
let SUPABASE_URL = localStorage.getItem("controle99_supabase_url") || "https://akqslhjjuesacfkqrgmi.supabase.co";
let SUPABASE_ANON_KEY = localStorage.getItem("controle99_supabase_key") || "sb_publishable_ln_JFjuDC1KRSDNp2G7cuQ_TvIl483h";

let supabaseClient = null;

// Inicializa o cliente do Supabase se as chaves estiverem presentes
function initSupabase() {
    if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Supabase inicializado com sucesso.");
            return true;
        } catch (e) {
            console.error("Erro ao inicializar Supabase:", e);
        }
    }
    return false;
}

// Salva as credenciais do Supabase no navegador
function saveSupabaseConfig(url, key) {
    SUPABASE_URL = url.trim();
    SUPABASE_ANON_KEY = key.trim();
    localStorage.setItem("controle99_supabase_url", SUPABASE_URL);
    localStorage.setItem("controle99_supabase_key", SUPABASE_ANON_KEY);
    return initSupabase();
}

// Tenta inicializar ao carregar o arquivo
initSupabase();

// --- MÉTODOS DE AUTENTICAÇÃO ---

// Realiza cadastro de novo usuário
async function signUpUser(email, password) {
    if (!supabaseClient) throw new Error("Supabase não está configurado.");
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    return data;
}

// Realiza login de usuário existente
async function signInUser(email, password) {
    if (!supabaseClient) throw new Error("Supabase não está configurado.");
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

// Realiza logout do usuário
async function signOutUser() {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
}

// Retorna a sessão do usuário atual
async function getCurrentUser() {
    if (!supabaseClient) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session ? session.user : null;
}

// --- MÉTODOS DE BANCO DE DADOS (ENTRIES) ---

// Busca todas as entradas do usuário logado no banco de dados em nuvem
async function fetchCloudEntries() {
    if (!supabaseClient) return null;
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
        .from('entries')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error("Erro ao buscar dados do Supabase:", error);
        throw error;
    }
    return data;
}

// Salva ou atualiza um registro no Supabase
async function saveCloudEntry(entry) {
    if (!supabaseClient) return null;
    const user = await getCurrentUser();
    if (!user) return null;

    const entryId = String(entry.id).includes('_') ? String(entry.id) : `${entry.id}_${user.id.substring(0, 8)}`;

    const record = {
        id: entryId,
        user_id: user.id,
        date: entry.date,
        rides: entry.rides || 0,
        tips: entry.tips || 0,
        km: entry.km || 0,
        hours: entry.hours || 0,
        fuel: entry.fuel || 0,
        food: entry.food || 0,
        others: entry.others || 0,
        notes: entry.notes || ''
    };

    const { data, error } = await supabaseClient
        .from('entries')
        .upsert(record);

    if (error) {
        console.error("Erro ao salvar no Supabase:", error);
        throw error;
    }
    return data;
}

// Deleta um registro do Supabase
async function deleteCloudEntry(id) {
    if (!supabaseClient) return null;
    const user = await getCurrentUser();
    if (!user) return null;

    const entryId = String(id).includes('_') ? String(id) : `${id}_${user.id.substring(0, 8)}`;

    const { error } = await supabaseClient
        .from('entries')
        .delete()
        .eq('id', entryId);

    if (error) {
        console.error("Erro ao deletar no Supabase:", error);
        throw error;
    }
}

// Sincroniza em lote todos os lançamentos locais/recuperados para a nuvem
async function syncLocalEntriesToCloud(entriesList) {
    if (!supabaseClient) return false;
    const user = await getCurrentUser();
    if (!user) return false;

    const records = entriesList.map(entry => ({
        id: String(entry.id).includes('_') ? String(entry.id) : `${entry.id}_${user.id.substring(0, 8)}`,
        user_id: user.id,
        date: entry.date,
        rides: entry.rides || 0,
        tips: entry.tips || 0,
        km: entry.km || 0,
        hours: entry.hours || 0,
        fuel: entry.fuel || 0,
        food: entry.food || 0,
        others: entry.others || 0,
        notes: entry.notes || ''
    }));

    const { error } = await supabaseClient
        .from('entries')
        .upsert(records);

    if (error) {
        console.error("Erro ao sincronizar lote para a nuvem:", error);
        throw error;
    }
    return true;
}

// Torna os métodos acessíveis no escopo global
window.SupabaseBackend = {
    initSupabase,
    saveSupabaseConfig,
    signUpUser,
    signInUser,
    signOutUser,
    getCurrentUser,
    fetchCloudEntries,
    saveCloudEntry,
    deleteCloudEntry,
    syncLocalEntriesToCloud
};
