/**
 * Script.js - Frontend para Classificação de Reviews de Jogos
 * 
 * Este script gerencia a interação do usuário com a API de classificação,
 * enviando reviews para análise e exibindo os resultados.
 */

// ============================================================
// Configuração da API
// ============================================================

const API_URL = 'http://localhost:8000';

// ============================================================
// Elementos do DOM
// ============================================================

const reviewInput = document.getElementById('reviewInput');
const classifyBtn = document.getElementById('classifyBtn');
const btnText = document.querySelector('.btn-text');
const btnLoading = document.querySelector('.btn-loading');
const gameSelect = document.getElementById('gameSelect');

const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');

const sentimentBadge = document.getElementById('sentimentBadge');
const sentimentIcon = document.getElementById('sentimentIcon');
const sentimentText = document.getElementById('sentimentText');
const confidenceFill = document.getElementById('confidenceFill');
const confidenceValue = document.getElementById('confidenceValue');
const originalText = document.getElementById('originalText');
const cleanedText = document.getElementById('cleanedText');
const errorMessage = document.getElementById('errorMessage');

// Elementos do jogo
const gameInfo = document.getElementById('gameInfo');
const gameImage = document.getElementById('gameImage');
const gameName = document.getElementById('gameName');

// ============================================================
// Event Listeners
// ============================================================

// Classificar ao clicar no botão
classifyBtn.addEventListener('click', classifyReview);

// Classificar ao pressionar Enter (com Ctrl/Cmd)
reviewInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        classifyReview();
    }
});

// Limpar resultado ao digitar
reviewInput.addEventListener('input', () => {
    if (resultSection.style.display !== 'none' || errorSection.style.display !== 'none') {
        hideResults();
    }
});

// ============================================================
// Funções Principais
// ============================================================

/**
 * Classifica a review digitada pelo usuário
 */
async function classifyReview() {
    const text = reviewInput.value.trim();
    
    // Validar entrada
    if (!text) {
        showError('Por favor, digite uma review antes de classificar.');
        return;
    }
    
    if (text.length < 10) {
        showError('A review deve ter pelo menos 10 caracteres.');
        return;
    }
    
    // Obter informações do jogo selecionado
    const selectedGame = gameSelect.value;
    let game_id = null;
    let game_name = null;
    
    if (selectedGame) {
        [game_id, game_name] = selectedGame.split('|');
    }
    
    // Mostrar loading
    setLoading(true);
    hideResults();
    
    try {
        // Fazer requisição para a API
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                text: text,
                game_id: game_id,
                game_name: game_name
            })
        });
        
        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao processar a review');
        }
        
        // Obter resultado
        const result = await response.json();
        
        // Exibir resultado
        displayResult(result);
        
    } catch (error) {
        console.error('Erro:', error);
        
        // Verificar se é erro de conexão
        if (error.message.includes('Failed to fetch')) {
            showError('❌ Não foi possível conectar à API. Verifique se o backend está rodando em http://localhost:8000');
        } else {
            showError(error.message);
        }
    } finally {
        setLoading(false);
    }
}

/**
 * Exibe o resultado da classificação
 */
function displayResult(result) {
    // Atualizar badge de sentimento
    const isPositive = result.sentiment === 'Positivo';
    
    sentimentBadge.className = `sentiment-badge ${isPositive ? 'positive' : 'negative'}`;
    sentimentIcon.textContent = isPositive ? '✅' : '❌';
    sentimentText.textContent = result.sentiment;
    
    // Atualizar barra de confiança
    const confidencePercent = Math.round(result.confidence * 100);
    confidenceFill.style.width = `${confidencePercent}%`;
    confidenceFill.className = `progress-fill ${isPositive ? 'positive' : 'negative'}`;
    confidenceValue.textContent = `${confidencePercent}%`;
    
    // Atualizar textos
    originalText.textContent = result.text;
    cleanedText.textContent = result.cleaned_text || 'N/A';
    
    // Exibir informações do jogo se disponíveis
    if (result.game_info) {
        gameImage.src = result.game_info.game_image;
        gameName.textContent = result.game_info.game_name;
        gameInfo.style.display = 'flex';
    } else {
        gameInfo.style.display = 'none';
    }
    
    // Mostrar seção de resultado com animação
    resultSection.style.display = 'block';
    setTimeout(() => {
        resultSection.classList.add('fade-in');
    }, 10);
    
    // Scroll suave até o resultado
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Exibe mensagem de erro
 */
function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    
    // Auto-esconder após 5 segundos
    setTimeout(() => {
        errorSection.style.display = 'none';
    }, 5000);
}

/**
 * Esconde seções de resultado e erro
 */
function hideResults() {
    resultSection.style.display = 'none';
    resultSection.classList.remove('fade-in');
    errorSection.style.display = 'none';
}

/**
 * Controla estado de loading do botão
 */
function setLoading(isLoading) {
    if (isLoading) {
        classifyBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        reviewInput.disabled = true;
    } else {
        classifyBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        reviewInput.disabled = false;
    }
}

// ============================================================
// Verificação de Saúde da API
// ============================================================

/**
 * Verifica se a API está disponível ao carregar a página
 */
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            console.log(' API conectada e modelo carregado!');
        } else {
            console.warn(' API conectada, mas modelo não está carregado.');
            showError(' Modelo não carregado. Execute o notebook para gerar os arquivos do modelo.');
        }
    } catch (error) {
        console.warn(' Não foi possível conectar à API. Certifique-se de que o backend está rodando.');
    }
}

// Verificar saúde da API ao carregar a página
window.addEventListener('load', checkAPIHealth);

// ============================================================
// Exemplos de Reviews
// ============================================================

const exampleReviews = [
    "Este jogo é absolutamente incrível! Os gráficos são impressionantes e a jogabilidade é extremamente fluida. Melhor RPG que joguei em anos!",
    "Jogo terrível. Cheio de bugs, trava constantemente e a história não faz sentido nenhum. Completo desperdício de dinheiro.",
    "Jogo muito bom no geral. Alguns problemas menores, mas nada que quebre a experiência. Recomendaria para fãs do gênero.",
    "Pior compra de todas. Não comprem esse lixo. Os desenvolvedores claramente não se importam com os jogadores."
];

/**
 * Preenche o campo com uma review de exemplo (para testes)
 * Pode ser chamado via console: fillExample(0)
 */
function fillExample(index = 0) {
    if (index >= 0 && index < exampleReviews.length) {
        reviewInput.value = exampleReviews[index];
        console.log(` Review de exemplo ${index + 1} carregada!`);
    }
}

// Tornar função disponível globalmente para testes
window.fillExample = fillExample;

console.log(' Game Reviews Classifier - Frontend carregado!');
console.log(' Dica: Use fillExample(0-3) no console para testar com reviews de exemplo');
