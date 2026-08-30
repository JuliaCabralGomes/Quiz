Quiz Relâmpago

Um quiz de múltipla escolha com perguntas dinâmicas, traduzidas automaticamente para português, num visual neo (bordas grossas, sombras duras e cores vibrantes).

Funcionalidades

- Busca 10 perguntas aleatórias de múltipla escolha a cada partida
- Alternativas embaralhadas a cada pergunta
- Feedback visual imediato (verde para certo, vermelho para errado)
- Contador de pontuação e barra de progresso em tempo real
- Tela de resultado final com mensagem de acordo com o desempenho
- Tratamento de erro de rede, com opção de tentar novamente
- Layout fixo no centro da tela, sem "pular" conforme o tamanho das perguntas muda

Tecnologias

- HTML, CSS e JavaScript puros (sem frameworks ou bibliotecas)
- [Open Trivia DB](https://opentdb.com/) — API pública de perguntas de quiz
- [MyMemory Translation API](https://mymemory.translated.net/) — tradução automática do conteúdo (a Open Trivia DB só retorna perguntas em inglês)

Conceitos praticados

Esse projeto foi construído como parte de uma trilha de aprendizado, focado em consumo de API:

- `fetch()` e `async/await` para requisições assíncronas
- `try/catch` para tratamento de erros de rede
- Consumo e combinação de duas APIs externas diferentes
- Decodificação de entidades HTML retornadas pela API (`&quot;`, `&#039;`, etc.)
- Gerenciamento de múltiplos estados de interface (carregando, erro, pergunta, resultado)
- Degradação graciosa: se a tradução de uma pergunta específica falhar, o quiz continua normalmente (só aquela pergunta permanece em inglês)

Como rodar

1. Clone este repositório
2. Abra o arquivo `index.html` no navegador (não precisa de servidor ou instalação)

