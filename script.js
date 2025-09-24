// DOM Elements
const loginContainer = document.getElementById('login-container');
const registerContainer = document.getElementById('register-container');
const appContainer = document.getElementById('app');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout-btn');
const abastecimentoForm = document.getElementById('abastecimento-form');
const tabelaAbastecimentos = document.getElementById('tabela-abastecimentos');
const relatorioPessoas = document.getElementById('relatorio-pessoas');
const filtroNome = document.getElementById('filtro-nome');
const filtroData = document.getElementById('filtro-data');
const filtroDias = document.getElementById('filtro-dias');
const limparFiltrosBtn = document.getElementById('limpar-filtros');
const exportarCsvBtn = document.getElementById('exportar-csv');
const importarCsvBtn = document.getElementById('importar-csv');
const fileInput = document.getElementById('file-input');
const editarModal = new bootstrap.Modal(document.getElementById('editarModal'));
const editarForm = document.getElementById('editar-form');
const salvarEdicaoBtn = document.getElementById('salvar-edicao');
const filtroInicio = document.getElementById('filtro-inicio');
const filtroFim = document.getElementById('filtro-fim');
const resumoPeriodo = document.getElementById('resumo-periodo');
const exportarRelatorioCsvBtn = document.getElementById('exportar-relatorio-csv');
const graficoRelatorioCanvas = document.getElementById('grafico-relatorio');
const exportarJsonBtn = document.getElementById('exportar-json');
const importarJsonBtn = document.getElementById('importar-json');
const fileInputJson = document.getElementById('file-input-json');
const gerarAleatoriosBtn = document.getElementById('gerar-aleatorios');

// State
let abastecimentos = [];
let currentUser = null;
let editId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        showApp();
    } else {
        showLogin();
    }

// JSON Backup/Restore
async function exportToJsonBackup() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const data = {
            version: 1,
            exportedAt: new Date().toISOString(),
            users,
            abastecimentos
        };
        const jsonStr = JSON.stringify(data, null, 2);
        const fileName = `backup_abastecimentos_${new Date().toISOString().slice(0,10)}.json`;

        if (window.showSaveFilePicker) {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
            });
            const writable = await handle.createWritable();
            await writable.write(new Blob([jsonStr], { type: 'application/json' }));
            await writable.close();
        } else {
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        showAlert('Backup JSON salvo com sucesso no seu computador.', 'success');
    } catch (err) {
        console.error('Erro ao exportar JSON:', err);
        showAlert('Erro ao salvar backup JSON.', 'danger');
    }
}

function importFromJsonBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const data = JSON.parse(content);
            if (!data || !Array.isArray(data.abastecimentos)) {
                showAlert('Arquivo inválido: estrutura de dados não reconhecida.', 'danger');
                event.target.value = '';
                return;
            }
            const users = Array.isArray(data.users) ? data.users : JSON.parse(localStorage.getItem('users') || '[]');
            // Persist
            localStorage.setItem('users', JSON.stringify(users));
            abastecimentos = data.abastecimentos;
            saveAbastecimentos();
            // Re-render
            renderAbastecimentos();
            updateRelatorio();
            showAlert('Backup restaurado com sucesso!', 'success');
        } catch (err) {
            console.error('Erro ao importar JSON:', err);
            showAlert('Erro ao restaurar backup JSON.', 'danger');
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}

// Chart handling
let relatorioChartInstance = null;
function renderReportChart(pessoasArray) {
    if (!graficoRelatorioCanvas || typeof Chart === 'undefined') return;
    const labels = pessoasArray.map(p => p.nome);
    const data = pessoasArray.map(p => Number(p.totalLitros.toFixed(2)));
    const ctx = graficoRelatorioCanvas.getContext('2d');
    if (relatorioChartInstance) {
        relatorioChartInstance.destroy();
    }
    relatorioChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Total de Litros',
                data,
                backgroundColor: 'rgba(13, 110, 253, 0.5)',
                borderColor: 'rgba(13, 110, 253, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { display: true }
            }
        }
    });
}

// Export filtered report CSV
function exportFilteredReportToCsv() {
    // Recompute the same filtered dataset used in updateRelatorio
    let filtered = [...abastecimentos].filter(a => a.userId === currentUser.id);
    if (filtroData.value) filtered = filtered.filter(a => a.data === filtroData.value);
    if (filtroDias.value) {
        const days = parseInt(filtroDias.value);
        const date = new Date();
        date.setDate(date.getDate() - days);
        filtered = filtered.filter(a => new Date(a.data) >= date);
    }
    if (filtroInicio && filtroInicio.value) {
        const start = new Date(filtroInicio.value);
        filtered = filtered.filter(a => new Date(a.data) >= start);
    }
    if (filtroFim && filtroFim.value) {
        const end = new Date(filtroFim.value);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(a => new Date(a.data) <= end);
    }

    const pessoas = {};
    filtered.forEach(a => {
        if (!pessoas[a.nome]) pessoas[a.nome] = { totalLitros: 0, count: 0 };
        pessoas[a.nome].totalLitros += a.litros;
        pessoas[a.nome].count++;
    });
    const pessoasArray = Object.entries(pessoas)
        .map(([nome, data]) => ({ nome, totalLitros: data.totalLitros, media: data.totalLitros / data.count }))
        .sort((a, b) => b.totalLitros - a.totalLitros);

    if (pessoasArray.length === 0) {
        showAlert('Nenhum dado para exportar no período selecionado.', 'warning');
        return;
    }

    const periodoDesc = getPeriodoDescricao();
    const headers = ['Pessoa', 'Total de Litros', 'Média por Abastecimento', 'Período'];
    const csvContent = [
        headers.join(','),
        ...pessoasArray.map(p => [
            `"${p.nome}"`,
            p.totalLitros.toFixed(2),
            p.media.toFixed(2),
            `"${periodoDesc}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_abastecimentos_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
    
    // Load data from localStorage
    loadAbastecimentos();
    
    // Set today's date as default
    document.getElementById('data').valueAsDate = new Date();
    document.getElementById('editar-data').valueAsDate = new Date();
    
    // Set up event listeners
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // Auth events
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (showRegisterBtn) showRegisterBtn.addEventListener('click', showRegister);
    if (showLoginBtn) showLoginBtn.addEventListener('click', showLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // Abastecimento form
    if (abastecimentoForm) abastecimentoForm.addEventListener('submit', handleAddAbastecimento);
    
    // Filter events
    if (filtroNome) filtroNome.addEventListener('input', applyFilters);
    if (filtroData) filtroData.addEventListener('change', applyFilters);
    if (filtroDias) filtroDias.addEventListener('change', applyFilters);
    if (filtroInicio) filtroInicio.addEventListener('change', applyFilters);
    if (filtroFim) filtroFim.addEventListener('change', applyFilters);
    if (limparFiltrosBtn) limparFiltrosBtn.addEventListener('click', clearFilters);
    
    // Import/Export
    if (exportarCsvBtn) exportarCsvBtn.addEventListener('click', exportToCsv);
    if (importarCsvBtn) importarCsvBtn.addEventListener('click', () => fileInput.click());
    if (fileInput) fileInput.addEventListener('change', importFromCsv);
    if (exportarRelatorioCsvBtn) exportarRelatorioCsvBtn.addEventListener('click', exportFilteredReportToCsv);
    if (exportarJsonBtn) exportarJsonBtn.addEventListener('click', exportToJsonBackup);
    if (importarJsonBtn) importarJsonBtn.addEventListener('click', () => fileInputJson.click());
    if (fileInputJson) fileInputJson.addEventListener('change', importFromJsonBackup);
    if (gerarAleatoriosBtn) gerarAleatoriosBtn.addEventListener('click', gerarAbastecimentosAleatorios);
    
    // Edit modal
    if (salvarEdicaoBtn) salvarEdicaoBtn.addEventListener('click', saveEdit);
}

// Auth functions
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showApp();
        showAlert('Login realizado com sucesso!', 'success');
    } else {
        showAlert('Usuário ou senha inválidos!', 'danger');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
        showAlert('As senhas não coincidem!', 'danger');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.some(u => u.username === username)) {
        showAlert('Nome de usuário já está em uso!', 'danger');
        return;
    }
    
    const newUser = { id: Date.now().toString(), username, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    showAlert('Conta criada com sucesso! Faça login para continuar.', 'success');
    showLogin();
    registerForm.reset();
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    // Clear UI state
    try { if (abastecimentoForm) abastecimentoForm.reset(); } catch (e) {}
    clearFilters();
    // Hide app and show login
    showLogin();
    // Update title
    document.title = 'Sistema de Controle de Abastecimento';
    showAlert('Logout realizado com sucesso!', 'success');
}

// Abastecimento CRUD
function handleAddAbastecimento(e) {
    e.preventDefault();
    
    const abastecimento = {
        id: Date.now().toString(),
        nome: document.getElementById('nome').value,
        data: document.getElementById('data').value,
        combustivel: document.getElementById('combustivel').value,
        litros: parseFloat(document.getElementById('litros').value),
        local: document.getElementById('local').value,
        userId: currentUser.id,
        createdAt: new Date().toISOString()
    };
    
    abastecimentos.push(abastecimento);
    saveAbastecimentos();
    abastecimentoForm.reset();
    renderAbastecimentos();
    updateRelatorio();
    showAlert('Abastecimento registrado com sucesso!', 'success');
}

function editAbastecimento(id) {
    const abastecimento = abastecimentos.find(a => a.id === id);
    if (!abastecimento) return;
    
    editId = id;
    document.getElementById('editar-nome').value = abastecimento.nome;
    document.getElementById('editar-data').value = abastecimento.data;
    document.getElementById('editar-combustivel').value = abastecimento.combustivel;
    document.getElementById('editar-litros').value = abastecimento.litros;
    document.getElementById('editar-local').value = abastecimento.local;
    
    editarModal.show();
}

function saveEdit() {
    const abastecimentoIndex = abastecimentos.findIndex(a => a.id === editId);
    if (abastecimentoIndex === -1) return;
    
    abastecimentos[abastecimentoIndex] = {
        ...abastecimentos[abastecimentoIndex],
        nome: document.getElementById('editar-nome').value,
        data: document.getElementById('editar-data').value,
        combustivel: document.getElementById('editar-combustivel').value,
        litros: parseFloat(document.getElementById('editar-litros').value),
        local: document.getElementById('editar-local').value
    };
    
    saveAbastecimentos();
    editarModal.hide();
    renderAbastecimentos();
    updateRelatorio();
    showAlert('Abastecimento atualizado com sucesso!', 'success');
}

function deleteAbastecimento(id) {
    if (!confirm('Tem certeza que deseja excluir este abastecimento?')) return;
    
    abastecimentos = abastecimentos.filter(a => a.id !== id);
    saveAbastecimentos();
    renderAbastecimentos();
    updateRelatorio();
    showAlert('Abastecimento excluído com sucesso!', 'success');
}

// Filter functions
function applyFilters() {
    renderAbastecimentos();
    updateRelatorio();
}

function clearFilters() {
    filtroNome.value = '';
    filtroData.value = '';
    filtroDias.value = '';
    if (filtroInicio) filtroInicio.value = '';
    if (filtroFim) filtroFim.value = '';
    renderAbastecimentos();
    updateRelatorio();
}

// Render functions
function renderAbastecimentos() {
    if (!tabelaAbastecimentos) return;
    
    let filtered = [...abastecimentos]
        .filter(a => a.userId === currentUser.id);
    
    // Apply filters
    if (filtroNome.value) {
        const term = filtroNome.value.toLowerCase();
        filtered = filtered.filter(a => a.nome.toLowerCase().includes(term));
    }
    
    if (filtroData.value) {
        filtered = filtered.filter(a => a.data === filtroData.value);
    }
    
    if (filtroDias.value) {
        const days = parseInt(filtroDias.value);
        const date = new Date();
        date.setDate(date.getDate() - days);
        filtered = filtered.filter(a => new Date(a.data) >= date);
    }
    
    // Date range filter
    if (filtroInicio && filtroInicio.value) {
        const start = new Date(filtroInicio.value);
        filtered = filtered.filter(a => new Date(a.data) >= start);
    }
    if (filtroFim && filtroFim.value) {
        const end = new Date(filtroFim.value);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(a => new Date(a.data) <= end);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // Render table
    tabelaAbastecimentos.innerHTML = filtered.length > 0 
        ? filtered.map(abastecimento => `
            <tr>
                <td>${abastecimento.nome}</td>
                <td>${formatDate(abastecimento.data)}</td>
                <td>${abastecimento.combustivel}</td>
                <td>${abastecimento.litros.toFixed(2)} L</td>
                <td>${abastecimento.local}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editAbastecimento('${abastecimento.id}')">
                        Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteAbastecimento('${abastecimento.id}')">
                        Excluir
                    </button>
                </td>
            </tr>
        `).join('')
        : '<tr><td colspan="6" class="text-center">Nenhum abastecimento encontrado</td></tr>';
}

// Random data generation
function gerarAbastecimentosAleatorios() {
    if (!currentUser) {
        showAlert('Faça login para gerar registros.', 'warning');
        return;
    }
    const qtdStr = prompt('Quantos abastecimentos aleatórios deseja gerar? (1-200)', '20');
    if (qtdStr === null) return;
    let qtd = parseInt(qtdStr, 10);
    if (isNaN(qtd) || qtd < 1) qtd = 20;
    if (qtd > 200) qtd = 200;

    const nomes = [
        'Ana Souza','Bruno Lima','Carlos Eduardo','Daniela Martins','Eduarda Rocha','Felipe Alves',
        'Gabriela Freitas','Henrique Castro','Isabela Nunes','João Victor','Karina Ribeiro','Luiz Fernando',
        'Mariana Silva','Nathalia Gomes','Otávio Pereira','Patrícia Santos','Ricardo Oliveira','Sabrina Costa',
        'Thiago Rodrigues','Ursula Mendes','Vitor Hugo','Wellington Araújo','Yasmin Carvalho','Zeca Almeida'
    ];
    const locais = ['Posto Shell Centro','Posto Ipiranga Norte','Posto BR Sul','Auto Posto Avenida','Posto do Trevo','Posto Central'];
    const hoje = new Date();
    const diasJanela = 180; // últimos 6 meses

    const novos = [];
    for (let i = 0; i < qtd; i++) {
        const nome = nomes[Math.floor(Math.random() * nomes.length)];
        const litros = Math.round((10 + Math.random() * 90) * 100) / 100; // 10 a 100 L
        const diasAtras = Math.floor(Math.random() * diasJanela);
        const d = new Date(hoje);
        d.setDate(hoje.getDate() - diasAtras);
        const dataISO = d.toISOString().slice(0,10);
        const local = locais[Math.floor(Math.random() * locais.length)];
        novos.push({
            id: Date.now().toString() + '_' + i,
            nome,
            data: dataISO,
            combustivel: 'Diesel',
            litros,
            local,
            userId: currentUser.id,
            createdAt: new Date().toISOString()
        });
    }
    abastecimentos = abastecimentos.concat(novos);
    saveAbastecimentos();
    renderAbastecimentos();
    updateRelatorio();
    showAlert(`${novos.length} abastecimentos aleatórios gerados com sucesso.`, 'success');
}

function updateRelatorio() {
    if (!relatorioPessoas) return;
    
    // Get filtered abastecimentos
    let filtered = [...abastecimentos]
        .filter(a => a.userId === currentUser.id);
    
    // Apply filters
    if (filtroData.value) {
        filtered = filtered.filter(a => a.data === filtroData.value);
    }
    
    if (filtroDias.value) {
        const days = parseInt(filtroDias.value);
        const date = new Date();
        date.setDate(date.getDate() - days);
        filtered = filtered.filter(a => new Date(a.data) >= date);
    }
    
    // Group by person and calculate totals
    const pessoas = {};
    
    filtered.forEach(a => {
        if (!pessoas[a.nome]) {
            pessoas[a.nome] = {
                totalLitros: 0,
                count: 0
            };
        }
        
        pessoas[a.nome].totalLitros += a.litros;
        pessoas[a.nome].count++;
    });
    
    // Convert to array and sort by totalLitros (descending)
    const pessoasArray = Object.entries(pessoas)
        .map(([nome, data]) => ({
            nome,
            totalLitros: data.totalLitros,
            media: data.totalLitros / data.count
        }))
        .sort((a, b) => b.totalLitros - a.totalLitros);
    
    // Render report
    relatorioPessoas.innerHTML = pessoasArray.length > 0
        ? pessoasArray.map((pessoa, idx) => `
            <tr>
                <td>${idx === 0 ? '<span class="badge bg-success me-1">Top</span>' : ''}${pessoa.nome}</td>
                <td>${pessoa.totalLitros.toFixed(2)} L</td>
                <td>${pessoa.media.toFixed(2)} L/abastecimento</td>
            </tr>
        `).join('')
        : '<tr><td colspan="3" class="text-center">Nenhum dado disponível</td></tr>';

    // Render summary (period + top person)
    if (resumoPeriodo) {
        const top = pessoasArray[0];
        const totalGeral = pessoasArray.reduce((acc, p) => acc + p.totalLitros, 0);
        const periodoDesc = getPeriodoDescricao();
        if (pessoasArray.length > 0) {
            resumoPeriodo.innerHTML = `
                <span>Período: <strong>${periodoDesc}</strong></span> · 
                <span>Total geral: <strong>${totalGeral.toFixed(2)} L</strong></span> · 
                <span>Maior abastecedor: <strong>${top.nome}</strong> com <strong>${top.totalLitros.toFixed(2)} L</strong></span>
            `;
        } else {
            resumoPeriodo.innerHTML = `<span>Período: <strong>${periodoDesc}</strong></span> · <span>Nenhum dado no período selecionado.</span>`;
        }
    }

    // Render chart
    renderReportChart(pessoasArray);
}

// Import/Export functions
function exportToCsv() {
    const userAbastecimentos = abastecimentos.filter(a => a.userId === currentUser.id);
    
    if (userAbastecimentos.length === 0) {
        showAlert('Nenhum dado para exportar!', 'warning');
        return;
    }
    
    // Define the headers
    const headers = ['Nome', 'Data', 'Combustível', 'Litros', 'Local', 'Data de Criação'];
    
    // Convert data to CSV
    const csvContent = [
        headers.join(','),
        ...userAbastecimentos.map(item => [
            `"${item.nome}"`,
            `"${item.data}"`,
            `"${item.combustivel}"`,
            item.litros,
            `"${item.local}"`,
            `"${item.createdAt}"`
        ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `abastecimentos_${formatDate(new Date().toISOString().split('T')[0])}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importFromCsv(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.replace(/["']/g, '').trim());
            
            const imported = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                
                const values = lines[i].match(/\s*("[^"]*"|[^,]*)\s*(?:,|$)/g)
                    .map(v => v.replace(/[,\s]*$/, '').replace(/^\s*"?|\s*"?$/g, '').trim());
                
                if (values.length < headers.length) continue;
                
                const item = {};
                headers.forEach((header, index) => {
                    item[header.toLowerCase()] = values[index];
                });
                
                // Skip if required fields are missing
                if (!item.nome || !item.data || !item.combustivel || !item.litros || !item.local) {
                    continue;
                }
                
                // Convert to the correct format
                imported.push({
                    id: Date.now().toString() + i,
                    nome: item.nome,
                    data: item.data,
                    combustivel: item.combustivel,
                    litros: parseFloat(item.litros) || 0,
                    local: item.local,
                    userId: currentUser.id,
                    createdAt: item['data de criação'] || new Date().toISOString()
                });
            }
            
            if (imported.length > 0) {
                abastecimentos = [...abastecimentos, ...imported];
                saveAbastecimentos();
                renderAbastecimentos();
                updateRelatorio();
                showAlert(`${imported.length} abastecimentos importados com sucesso!`, 'success');
            } else {
                showAlert('Nenhum dado válido encontrado no arquivo!', 'warning');
            }
            
        } catch (error) {
            console.error('Erro ao importar CSV:', error);
            showAlert('Erro ao importar o arquivo CSV!', 'danger');
        }
        
        // Reset file input
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

function getPeriodoDescricao() {
    // Descreve o período aplicado pelos filtros
    if (filtroData && filtroData.value) {
        return `dia ${formatDate(filtroData.value)}`;
    }
    const hasInicio = filtroInicio && filtroInicio.value;
    const hasFim = filtroFim && filtroFim.value;
    if (hasInicio && hasFim) return `${formatDate(filtroInicio.value)} a ${formatDate(filtroFim.value)}`;
    if (hasInicio) return `a partir de ${formatDate(filtroInicio.value)}`;
    if (hasFim) return `até ${formatDate(filtroFim.value)}`;
    if (filtroDias && filtroDias.value) return `últimos ${filtroDias.value} dias`;
    return 'todos os registros';
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

// View management
function showLogin() {
    if (loginContainer) loginContainer.classList.remove('d-none');
    if (registerContainer) registerContainer.classList.add('d-none');
    if (appContainer) appContainer.classList.add('d-none');
}

function showRegister() {
    if (loginContainer) loginContainer.classList.add('d-none');
    if (registerContainer) registerContainer.classList.remove('d-none');
    if (appContainer) appContainer.classList.add('d-none');
}

function showApp() {
    if (loginContainer) loginContainer.classList.add('d-none');
    if (registerContainer) registerContainer.classList.add('d-none');
    if (appContainer) appContainer.classList.remove('d-none');
    
    document.title = `Controle de Abastecimento - ${currentUser.username}`;
    renderAbastecimentos();
    updateRelatorio();
}

// Data persistence
function loadAbastecimentos() {
    abastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');
}

function saveAbastecimentos() {
    localStorage.setItem('abastecimentos', JSON.stringify(abastecimentos));
}

// Make functions available globally
window.editAbastecimento = editAbastecimento;
window.deleteAbastecimento = deleteAbastecimento;
