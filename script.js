// Global variables
let quizData = [];
let currentQuestionIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
  // Add navigation buttons (initially hidden)
  const navButtons = document.createElement('div');
  navButtons.className = 'navigation-buttons';
  navButtons.innerHTML = `
    <button id="prev-btn" disabled>Previous</button>
    <span id="question-counter">Question 0 of 0</span>
    <button id="next-btn" disabled>Next</button>
  `;
  const quizContainer = document.getElementById('quiz-container');
  quizContainer.after(navButtons);

  // Add check answer button (initially hidden)
  const checkButton = document.createElement('button');
  checkButton.id = 'check-btn';
  checkButton.innerText = 'Check Answer';
  checkButton.style.display = 'none';
  navButtons.after(checkButton);

  // Load the Excel file from the same directory
  fetch('quizData.xlsx')
    .then(response => response.arrayBuffer())
    .then(data => {
      const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });

      // Get the first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      quizData = XLSX.utils.sheet_to_json(worksheet);

      // Initialize the quiz
      currentQuestionIndex = 0;
      createQuiz();

      // Show navigation buttons
      document.getElementById('prev-btn').disabled = true;
      document.getElementById('next-btn').disabled = quizData.length <= 1;
      document.getElementById('question-counter').textContent = `Question 1 of ${quizData.length}`;
      document.getElementById('check-btn').style.display = 'block';
    })
    .catch(error => console.error('Error loading the Excel file:', error));

  // Add event listeners for navigation
  document.getElementById('prev-btn').addEventListener('click', showPreviousQuestion);
  document.getElementById('next-btn').addEventListener('click', showNextQuestion);
  document.getElementById('check-btn').addEventListener('click', checkCurrentAnswer);
});

// Generate the quiz showing only current question
function createQuiz() {
  const quizContainer = document.getElementById('quiz-container');
  quizContainer.innerHTML = ''; // Clear previous content
  if (quizData.length === 0 || currentQuestionIndex < 0 || currentQuestionIndex >= quizData.length) {
    return;
  }

  // Get current question
  const question = quizData[currentQuestionIndex];

  // Create question container
  const questionDiv = document.createElement('div');
  questionDiv.className = 'question';
  questionDiv.dataset.id = question.id;

  // Question text
  const questionText = document.createElement('p');
  questionText.className = 'question-text';
  questionText.innerHTML = `Question ${currentQuestionIndex + 1}: ${question.text}`;
  questionDiv.appendChild(questionText);

  // Parse options (split by \n)
  const options = question.options.split('\\n');

  // Create option elements
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'options';

  options.forEach(option => {
    const optionLabel = document.createElement('label');
    optionLabel.className = 'option';

    const optionInput = document.createElement('input');
    optionInput.type = 'radio';
    optionInput.name = `question-${question.id}`;
    optionInput.value = option.charAt(0); // Extract A, B, C from options

    optionLabel.appendChild(optionInput);

    const optionText = document.createElement('span');
    optionText.innerHTML = option;
    optionLabel.appendChild(optionText);

    optionsContainer.appendChild(optionLabel);
  });

  questionDiv.appendChild(optionsContainer);

  // Add feedback area (initially hidden)
  const feedbackArea = document.createElement('div');
  feedbackArea.className = 'feedback';
  feedbackArea.id = 'feedback-area';
  feedbackArea.style.display = 'none';
  questionDiv.appendChild(feedbackArea);

  // Store correct answer as data attribute (hidden from user)
  questionDiv.dataset.correct = question.correct_answer;

  // Store explanation
  questionDiv.dataset.explanation = question.explanation;

  quizContainer.appendChild(questionDiv);

  // Render LaTeX
  refreshMathJax();

  // Short delay to ensure DOM is updated
  setTimeout(refreshMathJax, 100); 
}

function showPreviousQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    createQuiz();
    updateNavigationButtons();
    const feedbackArea = document.getElementById('feedback-area');
    if (feedbackArea) {
      feedbackArea.style.display = 'none';
    }
  }
}

function showNextQuestion() {
  if (currentQuestionIndex < quizData.length - 1) {
    currentQuestionIndex++;
    createQuiz();
    updateNavigationButtons();

    // Clear feedback area
    const feedbackArea = document.getElementById('feedback-area');
    if (feedbackArea) {
      feedbackArea.style.display = 'none';
    }
  }
}

function updateNavigationButtons() {
  document.getElementById('prev-btn').disabled = (currentQuestionIndex === 0);
  document.getElementById('next-btn').disabled = (currentQuestionIndex === quizData.length - 1);
  document.getElementById('question-counter').textContent = `Question ${currentQuestionIndex + 1} of ${quizData.length}`;
}

function checkCurrentAnswer() {
  const question = document.querySelector('.question');
  const selectedOption = document.querySelector(`input[name="question-${question.dataset.id}"]:checked`);
  const feedbackArea = document.getElementById('feedback-area');
  if (!selectedOption) {
    feedbackArea.innerHTML = 'Please select an answer.';
    feedbackArea.className = 'feedback warning';
    feedbackArea.style.display = 'block';
    return;
  }

  const userAnswer = selectedOption.value;
  const correctAnswer = question.dataset.correct;
  const explanation = question.dataset.explanation;

  feedbackArea.style.display = 'block';

  if (userAnswer === correctAnswer) {
    feedbackArea.className = 'feedback correct';
    feedbackArea.innerHTML = 'Correct! 👍';
  } else {
    feedbackArea.className = 'feedback incorrect';
    feedbackArea.innerHTML = `Incorrect. The correct answer is ${correctAnswer}.`;
  }
  const explanationP = document.createElement('p');
  explanationP.className = 'explanation';
  explanationP.innerHTML = `Explanation: ${explanation}`;
  feedbackArea.appendChild(explanationP);
  refreshMathJax();
}

function refreshMathJax() {
  if (typeof MathJax !== 'undefined') {
    MathJax.typesetPromise().then(() => {
      console.log("MathJax rendering complete");
    }).catch((err) => {
      console.log("MathJax error:", err);
    });
  } else {
    console.error("MathJax not loaded");
  }
}
