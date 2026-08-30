// Endpoint da Open Trivia DB: 10 perguntas de múltipla escolha
// (a API não tem opção de idioma, então traduzimos o conteúdo depois de buscar)
const API_URL = "https://opentdb.com/api.php?amount=10&type=multiple";

// API gratuita de tradução automática, sem necessidade de chave
const TRANSLATE_URL = "https://api.mymemory.translated.net/get";

// Separador usado para juntar vários textos numa única chamada de tradução
// (reduz de 5 chamadas por pergunta para apenas 1)
const TRANSLATE_DELIMITER = " @@ ";

// Elementos dos diferentes estados da tela
const loadingState = document.getElementById("loading-state");
const errorState = document.getElementById("error-state");
const questionState = document.getElementById("question-state");
const resultState = document.getElementById("result-state");

// Elementos usados dentro do estado de pergunta
const questionCounter = document.getElementById("question-counter");
const scoreCounter = document.getElementById("score-counter");
const progressFill = document.getElementById("progress-fill");
const questionCategory = document.getElementById("question-category");
const questionText = document.getElementById("question-text");
const optionsGrid = document.getElementById("options-grid");
const nextButton = document.getElementById("next-button");

// Elementos do estado de resultado final
const resultEmoji = document.getElementById("result-emoji");
const resultScore = document.getElementById("result-score");
const resultMessage = document.getElementById("result-message");

const retryButton = document.getElementById("retry-button");
const restartButton = document.getElementById("restart-button");

// Estado do quiz em memória
let questions = [];
let currentIndex = 0;
let score = 0;
let hasAnswered = false;

// Letras usadas para identificar cada alternativa (A, B, C, D...)
const OPTION_LETTERS = ["A", "B", "C", "D"];

// Mostra apenas um dos estados (loading, erro, pergunta ou resultado) por vez
function showState(state) {

    [loadingState, errorState, questionState, resultState].forEach(el => {

        el.classList.toggle("hidden", el !== state);

    });

}

// Traduz uma pergunta inteira (categoria + pergunta + alternativas) numa única chamada,
// juntando tudo com um separador e depois separando de volta.
// Se a tradução falhar por qualquer motivo, devolve o item original em inglês
// (assim, um problema pontual na tradução não quebra o quiz inteiro).
async function translateQuestion(item) {

    const originalParts = [
        item.category,
        item.question,
        item.correctAnswer,
        ...item.incorrectAnswers
    ];

    const combinedText = originalParts.join(TRANSLATE_DELIMITER);

    try {

        const url = `${TRANSLATE_URL}?q=${encodeURIComponent(combinedText)}&langpair=en|pt-BR`;

        const response = await fetch(url);

        if (!response.ok) {

            throw new Error("Falha na resposta da API de tradução");

        }

        const data = await response.json();

        const translatedText = data?.responseData?.translatedText;

        if (!translatedText) {

            throw new Error("Tradução vazia");

        }

        const translatedParts = translatedText
            .split(TRANSLATE_DELIMITER.trim())
            .map(part => part.trim());

        // Se a quantidade de partes não bater, a tradução saiu em formato inesperado
        if (translatedParts.length !== originalParts.length) {

            throw new Error("Formato de tradução inesperado");

        }

        return {

            category: translatedParts[0],
            question: translatedParts[1],
            correctAnswer: translatedParts[2],
            incorrectAnswers: translatedParts.slice(3)

        };

    } catch (error) {

        console.warn("Não foi possível traduzir esta pergunta, mantendo em inglês:", error);

        return item;

    }

}

// Traduz várias perguntas em sequência (uma de cada vez, pra não sobrecarregar a API gratuita)
async function translateQuestions(items) {

    const translated = [];

    for (const item of items) {

        translated.push(await translateQuestion(item));

    }

    return translated;

}

// A Open Trivia DB retorna o texto em HTML-encoded (ex: "&quot;", "&#039;")
// Essa função usa um <textarea> para decodificar isso de volta pra texto normal
function decodeHTML(text) {

    const textarea = document.createElement("textarea");

    textarea.innerHTML = text;

    return textarea.value;

}

// Embaralha um array (algoritmo de Fisher-Yates), sem alterar o original
function shuffleArray(array) {

    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];

    }

    return shuffled;

}

// Busca as perguntas na API e prepara os dados para uso na interface
async function fetchQuestions() {

    showState(loadingState);

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {

            throw new Error("Falha na resposta da API");

        }

        const data = await response.json();

        if (data.response_code !== 0 || !data.results.length) {

            throw new Error("Nenhuma pergunta retornada");

        }

        const decodedItems = data.results.map(item => ({

            category: decodeHTML(item.category),
            question: decodeHTML(item.question),
            correctAnswer: decodeHTML(item.correct_answer),
            incorrectAnswers: item.incorrect_answers.map(decodeHTML)

        }));

        const translatedItems = await translateQuestions(decodedItems);

        questions = translatedItems.map(item => ({

            category: item.category,
            question: item.question,
            correctAnswer: item.correctAnswer,
            options: shuffleArray([...item.incorrectAnswers, item.correctAnswer])

        }));

        currentIndex = 0;
        score = 0;

        showQuestion();

    } catch (error) {

        console.error("Erro ao buscar perguntas:", error);

        showState(errorState);

    }

}

// Exibe a pergunta atual na tela
function showQuestion() {

    showState(questionState);

    hasAnswered = false;

    nextButton.classList.add("hidden");

    const question = questions[currentIndex];

    questionCounter.textContent = `${currentIndex + 1} / ${questions.length}`;
    scoreCounter.textContent = `${score} pontos`;

    progressFill.style.width = `${(currentIndex / questions.length) * 100}%`;

    questionCategory.textContent = question.category;
    questionText.textContent = question.question;

    optionsGrid.innerHTML = "";

    question.options.forEach((optionText, index) => {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "option-button";

        const letter = document.createElement("span");

        letter.className = "option-letter";
        letter.textContent = OPTION_LETTERS[index];

        const label = document.createElement("span");

        label.textContent = optionText;

        button.append(letter, label);

        button.addEventListener("click", () => selectAnswer(button, optionText, question.correctAnswer));

        optionsGrid.appendChild(button);

    });

}

// Processa a escolha do usuário: marca certo/errado e trava as demais opções
function selectAnswer(selectedButton, selectedText, correctAnswer) {

    if (hasAnswered) {

        return;

    }

    hasAnswered = true;

    const isCorrect = selectedText === correctAnswer;

    if (isCorrect) {

        score += 1;

    }

    // Percorre todas as opções: desabilita todas e destaca certo/errado
    optionsGrid.querySelectorAll(".option-button").forEach(button => {

        button.disabled = true;

        const buttonText = button.querySelector("span:last-child").textContent;

        if (buttonText === correctAnswer) {

            button.classList.add("correct");

        } else if (button === selectedButton) {

            button.classList.add("incorrect");

        }

    });

    scoreCounter.textContent = `${score} pontos`;

    nextButton.classList.remove("hidden");
    nextButton.textContent = currentIndex === questions.length - 1 ? "Ver resultado →" : "Próxima →";

}

// Avança para a próxima pergunta, ou mostra o resultado final se acabou
function goToNext() {

    currentIndex += 1;

    if (currentIndex >= questions.length) {

        showResult();

        return;

    }

    showQuestion();

}

// Exibe a tela de resultado final, com mensagem de acordo com a pontuação
function showResult() {

    showState(resultState);

    progressFill.style.width = "100%";

    const percentage = Math.round((score / questions.length) * 100);

    resultScore.textContent = `${score} / ${questions.length}`;

    if (percentage === 100) {

        resultEmoji.textContent = "🏆";
        resultMessage.textContent = "Perfeito! Você acertou todas.";

    } else if (percentage >= 70) {

        resultEmoji.textContent = "🔥";
        resultMessage.textContent = "Muito bem, mandou bem!";

    } else if (percentage >= 40) {

        resultEmoji.textContent = "🙂";
        resultMessage.textContent = "Nada mal, dá pra melhorar!";

    } else {

        resultEmoji.textContent = "🤔";
        resultMessage.textContent = "Bora tentar de novo?";

    }

}

// Eventos dos botões de ação
nextButton.addEventListener("click", goToNext);
retryButton.addEventListener("click", fetchQuestions);
restartButton.addEventListener("click", fetchQuestions);

// Busca as perguntas assim que a página carrega
fetchQuestions();