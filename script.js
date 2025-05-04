// Global variables
let quizData = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // Para seguir las respuestas del usuario
let questionsPerPage = 100; // Number of questions to show per page in the index

document.addEventListener('DOMContentLoaded', function() {
  // Ya no necesitamos crear el contenedor del índice de preguntas porque está en el HTML
  // Sólo verificamos que exista
  const indexContainer = document.getElementById('question-index');
  if (!indexContainer) {
    console.error("El contenedor del índice de preguntas no existe en el HTML");
  } else {
    // Add search box for questions
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
      <input type="text" id="question-search" placeholder="Search questions...">
    `;
    indexContainer.prepend(searchContainer);
    
    // Add event listener for search
    document.getElementById('question-search').addEventListener('input', filterQuestions);
  }

  // Add navigation buttons
  const navButtons = document.createElement('div');
  navButtons.className = 'navigation-buttons';
  navButtons.innerHTML = `
    <button id="prev-btn" disabled>Previous</button>
    <span id="question-counter">Question 0 of 0</span>
    <button id="next-btn" disabled>Next</button>
  `;
  const quizContainer = document.getElementById('quiz-container');
  quizContainer.after(navButtons);

  // Add check answer button
  const checkButton = document.createElement('button');
  checkButton.id = 'check-btn';
  checkButton.innerText = 'Check Answer';
  checkButton.style.display = 'none';
  navButtons.after(checkButton);

  // Load the JSON file from the same directory
  fetch('Data/Banco.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      quizData = data;

      // Initialize the quiz
      currentQuestionIndex = 0;
      // Inicializar el objeto de respuestas del usuario
      quizData.forEach(question => {
        userAnswers[question.id] = {
          answered: false,
          correct: false,
          selectedOption: null
        };
      });

      createQuestionIndex();
      createQuiz();

      // Show navigation buttons
      document.getElementById('prev-btn').disabled = true;
      document.getElementById('next-btn').disabled = quizData.length <= 1;
      document.getElementById('question-counter').textContent = `Question 1 of ${quizData.length}`;
      document.getElementById('check-btn').style.display = 'block';
      
      // Add jump buttons if more than 50 questions
      if (quizData.length > 50) {
        addJumpButtons();
      }
    })
    .catch(error => console.error('Error loading the JSON file:', error));

  // Add event listeners for navigation
  document.getElementById('prev-btn').addEventListener('click', showPreviousQuestion);
  document.getElementById('next-btn').addEventListener('click', showNextQuestion);
  document.getElementById('check-btn').addEventListener('click', checkCurrentAnswer);
});

// Filter questions based on search input
function filterQuestions() {
  const searchTerm = document.getElementById('question-search').value.toLowerCase();
  const indexItems = document.querySelectorAll('.index-item');
  
  // If search is empty, show all items
  if (!searchTerm) {
    indexItems.forEach(item => {
      item.style.display = 'flex';
    });
    return;
  }
  
  // Otherwise, filter based on question content
  indexItems.forEach((item, index) => {
    const questionIndex = parseInt(item.dataset.index);
    const question = quizData[questionIndex];
    const questionText = question.text.toLowerCase();
    
    if (questionText.includes(searchTerm) || 
        (questionIndex + 1).toString().includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// Add jump buttons for large question sets
function addJumpButtons() {
  const indexContainer = document.getElementById('question-index');
  const jumpSection = document.createElement('div');
  jumpSection.className = 'jump-section';
  
  // Calculate number of sections
  const numberOfSections = Math.ceil(quizData.length / 25);
  
  for (let i = 0; i < numberOfSections; i++) {
    const startNum = i * 25 + 1;
    const endNum = Math.min((i + 1) * 25, quizData.length);
    
    const jumpBtn = document.createElement('button');
    jumpBtn.className = 'jump-btn';
    jumpBtn.textContent = `${startNum}-${endNum}`;
    jumpBtn.addEventListener('click', function() {
      // Scroll to this section
      const targetElement = document.querySelector(`.index-item[data-index="${startNum - 1}"]`);
      if (targetElement) {
        const indexList = document.querySelector('.index-list');
        indexList.scrollTop = targetElement.offsetTop - indexList.offsetTop;
      }
    });
    
    jumpSection.appendChild(jumpBtn);
  }
  
  // Insert after search but before index list
  const searchContainer = document.querySelector('.search-container');
  if (searchContainer) {
    searchContainer.after(jumpSection);
  } else {
    const indexTitle = document.querySelector('#question-index h3');
    if (indexTitle) {
      indexTitle.after(jumpSection);
    } else {
      indexContainer.prepend(jumpSection);
    }
  }
}

// Create question index for direct navigation
function createQuestionIndex() {
  const indexContainer = document.getElementById('question-index');
  if (!indexContainer) return; // Si no existe el contenedor, salimos
  
  // Add heading if it doesn't exist
  if (!indexContainer.querySelector('h3')) {
    const heading = document.createElement('h3');
    heading.textContent = 'Índice de Preguntas';
    indexContainer.appendChild(heading);
  }
  
  const indexList = document.createElement('div');
  indexList.className = 'index-list';
  
  quizData.forEach((question, index) => {
    const indexItem = document.createElement('button');
    indexItem.className = 'index-item';
    indexItem.textContent = `Question ${index + 1}`;
    indexItem.dataset.index = index;
    indexItem.dataset.id = question.id;
    
    // Highlight current question and show answered status
    if (index === currentQuestionIndex) {
      indexItem.classList.add('current');
    }
    
    // Add answered status if applicable
    if (userAnswers[question.id] && userAnswers[question.id].answered) {
      if (userAnswers[question.id].correct) {
        indexItem.classList.add('answered');
      } else {
        indexItem.classList.add('incorrect');
      }
    }
    
    // Add click event to jump to specific question
    indexItem.addEventListener('click', function() {
      currentQuestionIndex = parseInt(this.dataset.index);
      createQuiz();
      updateNavigationButtons();
      updateQuestionIndex();
      
      // Clear feedback area
      const feedbackArea = document.getElementById('feedback-area');
      if (feedbackArea) {
        feedbackArea.style.display = 'none';
      }
      
      // If already answered, show feedback
      const questionId = quizData[currentQuestionIndex].id;
      if (userAnswers[questionId] && userAnswers[questionId].answered) {
        setTimeout(() => {
          showFeedback(
            userAnswers[questionId].selectedOption, 
            quizData[currentQuestionIndex].correct_answer,
            quizData[currentQuestionIndex].explanation
          );
        }, 100);
      }
      
      // Scroll to make sure current question is visible in index
      this.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    
    indexList.appendChild(indexItem);
  });
  
  indexContainer.appendChild(indexList);
  
  // Scroll to current question in index
  setTimeout(() => {
    const currentItem = document.querySelector('.index-item.current');
    if (currentItem) {
      currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 100);
}

// Update the question index highlighting
function updateQuestionIndex() {
  const indexItems = document.querySelectorAll('.index-item');
  indexItems.forEach((item) => {
    const index = parseInt(item.dataset.index);
    const id = item.dataset.id;
    
    // Reset all current classes
    item.classList.remove('current');
    
    // Add current class to current question
    if (index === currentQuestionIndex) {
      item.classList.add('current');
      
      // Scroll into view if not visible
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Add answered status if applicable
    item.classList.remove('answered', 'incorrect');
    if (userAnswers[id] && userAnswers[id].answered) {
      if (userAnswers[id].correct) {
        item.classList.add('answered');
      } else {
        item.classList.add('incorrect');
      }
    }
  });
}

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

  // Add image if exists
  if (question.image) {
    const imageEl = document.createElement('img');
    imageEl.src = question.image;
    imageEl.className = 'question-image';
    imageEl.alt = 'Question image';
    questionDiv.appendChild(imageEl);
  }

  // Create option elements
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'options';

  question.options.forEach(option => {
    const optionLabel = document.createElement('label');
    optionLabel.className = 'option';

    const optionInput = document.createElement('input');
    optionInput.type = 'radio';
    optionInput.name = `question-${question.id}`;
    optionInput.value = option.charAt(0); // Extract A, B, C from options
    
    // Si ya se ha respondido esta pregunta, seleccionar la opción previamente elegida
    if (userAnswers[question.id] && 
        userAnswers[question.id].answered && 
        userAnswers[question.id].selectedOption === option.charAt(0)) {
      optionInput.checked = true;
    }

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
  questionDiv.dataset.explanation = question.explanation || "No explanation provided.";

  quizContainer.appendChild(questionDiv);

  // Si ya se ha respondido esta pregunta, mostrar el feedback
  if (userAnswers[question.id] && userAnswers[question.id].answered) {
    setTimeout(() => {
      showFeedback(
        userAnswers[question.id].selectedOption, 
        question.correct_answer, 
        question.explanation
      );
    }, 100);
  }

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
    updateQuestionIndex();
  }
}

function showNextQuestion() {
  if (currentQuestionIndex < quizData.length - 1) {
    currentQuestionIndex++;
    createQuiz();
    updateNavigationButtons();
    updateQuestionIndex();
  }
}

function updateNavigationButtons() {
  document.getElementById('prev-btn').disabled = (currentQuestionIndex === 0);
  document.getElementById('next-btn').disabled = (currentQuestionIndex === quizData.length - 1);
  document.getElementById('question-counter').textContent = `Question ${currentQuestionIndex + 1} of ${quizData.length}`;
}

function showFeedback(userAnswer, correctAnswer, explanation) {
  const feedbackArea = document.getElementById('feedback-area');
  feedbackArea.innerHTML = '';
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

function checkCurrentAnswer() {
  const question = document.querySelector('.question');
  const questionId = question.dataset.id;
  const selectedOption = document.querySelector(`input[name="question-${questionId}"]:checked`);
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

  // Store user's answer
  userAnswers[questionId] = {
    answered: true,
    correct: userAnswer === correctAnswer,
    selectedOption: userAnswer
  };
  
  // Update the question index to show answer status
  updateQuestionIndex();
  
  // Show feedback
  showFeedback(userAnswer, correctAnswer, explanation);
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