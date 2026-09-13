document.addEventListener("DOMContentLoaded", async () => {
  const progressEl = document.getElementById("quiz-progress");
  const questionEl = document.getElementById("quiz-question");
  const optionsEl = document.getElementById("quiz-options");
  const feedbackEl = document.getElementById("quiz-feedback");
  const nextBtn = document.getElementById("quiz-next");
  const scoreEl = document.getElementById("quiz-score");
  const restartBtn = document.getElementById("quiz-restart");

  let questions = [];
  let order = [];
  let idx = 0;
  let score = 0;
  let answered = false;

  async function loadQuestions() {
    const res = await fetch("data/questions.json");
    questions = await res.json();
    order = questions.map((_, i) => i).sort(() => Math.random() - 0.5);
    idx = 0;
    score = 0;
    answered = false;
    nextBtn.hidden = true;
    scoreEl.textContent = "";
    restartBtn.hidden = true;
    render();
  }

  function render() {
    if (idx >= order.length) {
      progressEl.textContent = "";
      questionEl.textContent = "That's everything!";
      optionsEl.innerHTML = "";
      feedbackEl.textContent = "";
      scoreEl.textContent = `You scored ${score} out of ${order.length}.`;
      restartBtn.hidden = false;
      nextBtn.hidden = true;
      return;
    }
    const q = questions[order[idx]];
    answered = false;
    feedbackEl.textContent = "";
    nextBtn.hidden = true;
    progressEl.textContent = `Question ${idx + 1} of ${order.length}`;
    questionEl.textContent = q.question;
    optionsEl.innerHTML = "";
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.textContent = opt;
      btn.addEventListener("click", () => selectAnswer(i, q));
      optionsEl.appendChild(btn);
    });
  }

  function selectAnswer(i, q) {
    if (answered) return;
    answered = true;
    const correct = i === q.answerIndex;
    if (correct) score += 1;
    [...optionsEl.children].forEach((btn, bi) => {
      if (bi === q.answerIndex) btn.classList.add("correct");
      if (bi === i && !correct) btn.classList.add("incorrect");
    });
    feedbackEl.textContent = correct ? "Got it." : "Not quite — the right one's highlighted.";
    nextBtn.hidden = false;
  }

  nextBtn.addEventListener("click", () => {
    idx += 1;
    render();
  });
  restartBtn.addEventListener("click", loadQuestions);

  loadQuestions();
});
