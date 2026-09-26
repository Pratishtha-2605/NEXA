
import { useState } from "react";

function TrialScreen({ experiment, onComplete }) {
  const trials = experiment?.trials || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  if (!trials.length) {
    return (
      <div className="trial-screen">
        <h2>No trials available</h2>
        <p>This experiment does not have any questions yet.</p>
      </div>
    );
  }

  const currentTrial = trials[currentIndex];

  const options = currentTrial.options || [];

  const selectedAnswer = selectedAnswers[currentIndex] ?? "";

  const displayedWord =
    currentTrial.stimulus || currentTrial.question || "";

  const inkColor = currentTrial.extra || "";

  function selectAnswer(option) {
    setSelectedAnswers((previous) => ({
      ...previous,
      [currentIndex]: option,
    }));
  }

  function handleFinish() {
    const answers = trials.map((trial, index) => {
      const selected = selectedAnswers[index] ?? "";

      return {
        trialId: trial.id,
        question: trial.question || trial.stimulus || "",
        selectedAnswer: selected,
        correct: selected === trial.correctAnswer,
      };
    });

    const result = {
      experimentId: experiment.id,
      experimentName: experiment.name,
      answers,
      completedAt: new Date().toISOString(),
    };

    onComplete(result);
    setFinished(true);
  }

  if (finished) {
    const correctCount = trials.filter(
      (trial, index) =>
        selectedAnswers[index] === trial.correctAnswer
    ).length;

    return (
      <div className="trial-screen completion-screen">
        <h2>Experiment Completed!</h2>
        <p>You have finished all the questions.</p>

        <div className="completion-score">
          <strong>
            {correctCount} / {trials.length}
          </strong>
          <span>Correct Answers</span>
        </div>
      </div>
    );
  }

  return (
    <div className="trial-screen">
      <div className="trial-progress">
        <span>
          Question {currentIndex + 1} of {trials.length}
        </span>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${((currentIndex + 1) / trials.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="participant-trial-card">
        <h2>
          {experiment.paradigm === "stroop"
            ? "Identify the ink color"
            : currentTrial.question || "Respond to the stimulus"}
        </h2>

        <div
          style={{
            textAlign: "center",
            padding: "30px 10px",
            fontSize: "36px",
            fontWeight: "bold",
            color: inkColor
              ? inkColor.toLowerCase()
              : "inherit",
          }}
        >
          {displayedWord}
        </div>

        <div
          className="participant-options-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          {options.map((option, optionIndex) => {
            const image =
              currentTrial.optionImages?.[optionIndex] || "";

            const isSelected = selectedAnswer === option;

            return (
              <button
                type="button"
                key={optionIndex}
                className={`participant-option ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => selectAnswer(option)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  padding: "18px",
                  border: isSelected
                    ? "2px solid #2563eb"
                    : "1px solid #d1d5db",
                  borderRadius: "10px",
                  background: isSelected ? "#eff6ff" : "#ffffff",
                  color: "#111827",
                  cursor: "pointer",
                  fontSize: "16px",
                  minHeight: "60px",
                }}
              >
                {image && (
                  <img
                    className="participant-option-image"
                    src={image}
                    alt={`Option ${String.fromCharCode(
                      65 + optionIndex
                    )}`}
                    style={{
                      maxWidth: "60px",
                      maxHeight: "60px",
                      objectFit: "contain",
                    }}
                  />
                )}

                <span className="participant-option-label">
                  {String.fromCharCode(65 + optionIndex)}.
                </span>

                <span>{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="trial-navigation"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginTop: "24px",
        }}
      >
        <button
          type="button"
          className="secondary-btn"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((index) => index - 1)}
        >
          Previous
        </button>

        {currentIndex < trials.length - 1 ? (
          <button
            type="button"
            className="primary-btn"
            disabled={!selectedAnswer}
            onClick={() => setCurrentIndex((index) => index + 1)}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="primary-btn"
            disabled={!selectedAnswer}
            onClick={handleFinish}
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}

export default TrialScreen;