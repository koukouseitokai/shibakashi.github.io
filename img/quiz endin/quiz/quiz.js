// Quiz data
const questions = [
    {
        question: "芝柏の学食のメニューは何種類？",
        choices: ["2種類", "3種類", "4種類"],
        correct: 3,
        explanation: "学食では、カレー、から揚げ、麺類(日替わり)、アラカルト(日替わり)を食べることができます。"
    },
    {
        question: "芝浦工業大学柏高等学校は何年に作られた？",
        choices: ["1960年", "1980年", "2000年"],
        correct: 2,
        explanation: "芝浦工業大学柏高等学校は1980年に創立しました。2030年には創立50周年を迎えます。"
    },
    {
        question: "芝柏のキャラクターの名前は？",
        choices: ["かしわばー", "しばかっしー", "しばもーり"],
        correct: 2,
        explanation: "しばかしのキャラクターはしばかっしーです。かわいいですね。"
    },
    {
        question: "芝柏に通う生徒数は？",
        choices: ["820名", "1160名", "1440名"],
        correct: 3,
        explanation: "芝柏には中学校15クラス540名、高校23クラス900名で合計1440名の生徒がいます。"
    },
    {
        question: "芝柏に入ると科学分野でどのようなことができるか？",
        choices: ["様々な科学イベントに参加できる", "科学は夏休みしか勉強できない", "科学に関する部活はない"],
        correct: 1,
        explanation: "芝柏はSSH指定校です。すべての生徒が探求活動をしています。また、芝柏にはまた芝柏に入れば様々な科学イベントに参加することができます。"
    }
];

// Game state
let currentQuestion = 0;
let selectedAnswer = null;
let showResult = false;
let userAnswers = [];
let score = 0;

// DOM elements
const elements = {
    questionScreen: document.getElementById('questionScreen'),
    completionScreen: document.getElementById('completionScreen'),
    resultScreen: document.getElementById('resultScreen'),
    resultsPage: document.getElementById('resultsPage'),
    progress: document.getElementById('progress'),
    question: document.getElementById('question'),
    dimmedQuestion: document.getElementById('dimmedQuestion'),
    resultMark: document.getElementById('resultMark'),
    answerLine: document.getElementById('answerLine'),
    correctLine: document.getElementById('correctLine'),
    explanationText: document.getElementById('explanationText'),
    finalScore: document.getElementById('finalScore'),
    resultsList: document.getElementById('resultsList'),
    reviewButton: document.getElementById('reviewButton'),
    choice1: document.getElementById('choice1'),
    choice2: document.getElementById('choice2'),
    choice3: document.getElementById('choice3')
};

// Initialize quiz
function initQuiz() {
    loadQuestion();
    updateChoiceTexts();
    
    // Add event listener for review button
    elements.reviewButton.addEventListener('click', showReview);
}

// Load current question
function loadQuestion() {
    const q = questions[currentQuestion];
    elements.progress.textContent = `${currentQuestion + 1}/${questions.length}`;
    elements.question.textContent = q.question;
    elements.dimmedQuestion.textContent = q.question;
    
    // Reset UI state
    elements.questionScreen.style.display = 'block';
    elements.completionScreen.style.display = 'none';
    elements.resultScreen.style.display = 'none';
    showResult = false;
    selectedAnswer = null;
}

// Update choice button texts
function updateChoiceTexts() {
    const q = questions[currentQuestion];
    const choices = [elements.choice1, elements.choice2, elements.choice3];
    
    choices.forEach((choice, index) => {
        const textElement = choice.querySelector('.choice-text');
        textElement.textContent = q.choices[index];
        
        // Adjust font size based on text length
        if (q.choices[index].length > 8) {
            textElement.style.fontSize = '0.7rem';
        } else {
            textElement.style.fontSize = '0.9rem';
        }
    });
}

// Select answer
function selectAnswer(answerIndex) {
    if (showResult) return;
    
    selectedAnswer = answerIndex;
    const isCorrect = answerIndex === questions[currentQuestion].correct;
    
    const newAnswer = {
        questionIndex: currentQuestion,
        selectedAnswer: answerIndex,
        correct: isCorrect
    };
    
    userAnswers.push(newAnswer);
    
    if (isCorrect) {
        score++;
    }
    
    showAnswerResult(isCorrect);
}

// Show answer result
function showAnswerResult(isCorrect) {
    showResult = true;
    const q = questions[currentQuestion];
    
    // Update result mark
    elements.resultMark.textContent = isCorrect ? '○' : '×';
    elements.resultMark.className = isCorrect ? 'result-mark correct' : 'result-mark incorrect';
    
    // Update explanation content
    elements.answerLine.innerHTML = `<strong>【回答】</strong>${q.choices[selectedAnswer]}`;
    elements.correctLine.innerHTML = `<strong>【正解】</strong>${q.choices[q.correct]}`;
    elements.explanationText.textContent = q.explanation;
    
    // Show result screen
    elements.questionScreen.style.display = 'none';
    elements.resultScreen.style.display = 'block';
}

// Next question
function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        loadQuestion();
        updateChoiceTexts();
    } else {
        showCompletion();
    }
}

// Show completion screen (inside quiz box)
function showCompletion() {
    elements.questionScreen.style.display = 'none';
    elements.resultScreen.style.display = 'none';
    elements.completionScreen.style.display = 'flex';
}

// Show review (results page)
function showReview() {
    elements.resultsPage.style.display = 'block';
    
    // Update final score
    elements.finalScore.textContent = `${score}/${questions.length} 問正解`;
    
    // Generate results list
    generateResultsList();
}

// Generate results list
function generateResultsList() {
    let resultsHTML = '';
    
    questions.forEach((q, index) => {
        const userAnswer = userAnswers.find(ua => ua.questionIndex === index);
        const isCorrect = userAnswer?.correct || false;
        
        resultsHTML += `
            <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="result-question">問題${index + 1}: ${q.question}</div>
                <div class="result-user-answer">あなたの回答: ${q.choices[userAnswer?.selectedAnswer || 0]}</div>
                <div class="result-correct-answer">正解: ${q.choices[q.correct]}</div>
                <div class="result-status ${isCorrect ? 'correct' : 'incorrect'}">
                    ${isCorrect ? '○ 正解' : '× 不正解'}
                </div>
            </div>
        `;
    });
    
    elements.resultsList.innerHTML = resultsHTML;
}

// Return to start
function returnToStart() {
    currentQuestion = 0;
    selectedAnswer = null;
    showResult = false;
    userAnswers = [];
    score = 0;
    
    // Reset UI
    elements.completionScreen.style.display = 'none';
    elements.resultsPage.style.display = 'none';
    
    // Reload first question
    loadQuestion();
    updateChoiceTexts();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initQuiz);