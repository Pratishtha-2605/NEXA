
import { useEffect } from "react";

const COLORS = ["Red", "Green", "Blue", "Yellow"];

const paradigmSettings = {
  stroop: {
    title: "Stroop Trial",
    stimulusLabel: "Word to Display",
    stimulusPlaceholder: "Enter a word, e.g. BLUE",
    options: COLORS,
  },
  "simple-reaction-time": {
    title: "Reaction Time Trial",
    stimulusLabel: "Stimulus",
    stimulusPlaceholder: "e.g. Green circle",
    options: ["Click"],
  },
  "go-no-go": {
    title: "Go/No-Go Trial",
    stimulusLabel: "Stimulus",
    stimulusPlaceholder: "e.g. Green circle or Red circle",
    options: ["Respond", "Withhold"],
  },
  flanker: {
    title: "Flanker Trial",
    stimulusLabel: "Arrow Pattern",
    stimulusPlaceholder: "e.g. <<<<< or <<><<",
    options: ["Left", "Right"],
  },
  "lexical-decision": {
    title: "Lexical Decision Trial",
    stimulusLabel: "Word or Non-word",
    stimulusPlaceholder: "Enter a word or non-word",
    options: ["Word", "Non-word"],
  },
};

function createTrial(paradigm) {
  const settings =
    paradigmSettings[paradigm] || paradigmSettings.stroop;

  return {
    id: Date.now() + Math.random(),
    question: "",
    stimulus: "",
    extra: "",
    options: [...settings.options],
    correctAnswer: "",
    timeLimit: 2000,
  };
}

function TrialBuilder({ paradigm, trials = [], onChange }) {
  const settings =
    paradigmSettings[paradigm] || paradigmSettings.stroop;

  useEffect(() => {
    if (trials.length === 0) {
      onChange([createTrial(paradigm)]);
    }
  }, [paradigm, trials.length, onChange]);

  function updateTrial(index, field, value) {
    const updatedTrials = trials.map((trial, i) =>
      i === index ? { ...trial, [field]: value } : trial
    );

    onChange(updatedTrials);
  }

  function addTrial() {
    onChange([...trials, createTrial(paradigm)]);
  }

  function deleteTrial(index) {
    if (trials.length <= 1) return;

    onChange(trials.filter((_, i) => i !== index));
  }

  function duplicateTrial(index) {
    const copy = {
      ...trials[index],
      id: Date.now() + Math.random(),
      options: [...(trials[index].options || [])],
    };

    const updatedTrials = [...trials];
    updatedTrials.splice(index + 1, 0, copy);
    onChange(updatedTrials);
  }

  function updateOption(index, optionIndex, value) {
    const trial = trials[index];
    const oldOption = trial.options?.[optionIndex];

    const updatedOptions = [...(trial.options || [])];
    updatedOptions[optionIndex] = value;

    const updatedTrial = {
      ...trial,
      options: updatedOptions,
      correctAnswer:
        trial.correctAnswer === oldOption
          ? value
          : trial.correctAnswer,
    };

    onChange(
      trials.map((item, i) =>
        i === index ? updatedTrial : item
      )
    );
  }

  function updateGoNoGoType(index, type) {
    const correctAnswer =
      type === "Go" ? "Respond" : "Withhold";

    const updatedTrials = trials.map((trial, i) =>
      i === index
        ? {
            ...trial,
            extra: type,
            correctAnswer,
          }
        : trial
    );

    onChange(updatedTrials);
  }

  return (
    <section className="trial-builder">
      <div className="trial-builder-header">
        <div>
          <h2>Trial Builder</h2>
          <p>
            Add and configure the trials for your experiment.
          </p>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={addTrial}
        >
          + Add Trial
        </button>
      </div>

      {trials.map((trial, index) => (
        <div className="trial-card" key={trial.id || index}>
          <div className="trial-card-header">
            <h3>
              {settings.title} {index + 1}
            </h3>

            <div className="trial-card-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => duplicateTrial(index)}
              >
                Duplicate
              </button>

              <button
                type="button"
                className="delete-btn"
                onClick={() => deleteTrial(index)}
                disabled={trials.length <= 1}
              >
                Delete
              </button>
            </div>
          </div>

          {/* STROOP */}
          {paradigm === "stroop" && (
            <>
              <div className="form-group">
                <label>Word to Display</label>
                <input
                  type="text"
                  value={trial.stimulus || ""}
                  onChange={(e) =>
                    updateTrial(
                      index,
                      "stimulus",
                      e.target.value
                    )
                  }
                  placeholder="Enter a word, e.g. BLUE"
                  required
                />
              </div>

              <div className="form-group">
                <label>Ink Color</label>
                <select
                  value={trial.extra || ""}
                  onChange={(e) => {
                    const color = e.target.value;

                    const updatedTrial = {
                      ...trial,
                      extra: color,
                      correctAnswer: color,
                    };

                    onChange(
                      trials.map((item, i) =>
                        i === index ? updatedTrial : item
                      )
                    );
                  }}
                  required
                >
                  <option value="">Select ink color</option>
                  {COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Preview</label>
                <div
                  style={{
                    color: trial.extra
                      ? trial.extra.toLowerCase()
                      : "#64748b",
                    fontSize: "32px",
                    fontWeight: "bold",
                    textAlign: "center",
                    padding: "20px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                >
                  {trial.stimulus || "Your word will appear here"}
                </div>
              </div>
            </>
          )}

          {/* OTHER PARADIGMS */}
          {paradigm !== "stroop" && (
            <div className="form-group">
              <label>{settings.stimulusLabel}</label>
              <input
                type="text"
                value={trial.stimulus || ""}
                onChange={(e) =>
                  updateTrial(
                    index,
                    "stimulus",
                    e.target.value
                  )
                }
                placeholder={settings.stimulusPlaceholder}
                required
              />
            </div>
          )}

          {/* GO / NO-GO TRIAL TYPE */}
          {paradigm === "go-no-go" && (
            <div className="form-group">
              <label>Trial Type</label>
              <select
                value={trial.extra || ""}
                onChange={(e) =>
                  updateGoNoGoType(index, e.target.value)
                }
                required
              >
                <option value="">Select trial type</option>
                <option value="Go">Go</option>
                <option value="No-Go">No-Go</option>
              </select>
            </div>
          )}

          {/* RESPONSE OPTIONS */}
          <div className="form-group">
            <label>Response Options</label>

            {paradigm === "stroop" ? (
              <div className="response-options">
                {COLORS.map((color) => (
                  <span className="response-option" key={color}>
                    {color}
                  </span>
                ))}
              </div>
            ) : (
              (trial.options || []).map((option, optionIndex) => (
                <div className="option-row" key={optionIndex}>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) =>
                      updateOption(
                        index,
                        optionIndex,
                        e.target.value
                      )
                    }
                    placeholder={`Option ${optionIndex + 1}`}
                    required
                  />
                </div>
              ))
            )}
          </div>

          {/* CORRECT ANSWER */}
          <div className="form-group">
            <label>Correct Answer</label>

            <select
              value={trial.correctAnswer || ""}
              onChange={(e) =>
                updateTrial(
                  index,
                  "correctAnswer",
                  e.target.value
                )
              }
              required
            >
              <option value="">Select correct answer</option>

              {(paradigm === "stroop"
                ? COLORS
                : trial.options || []
              ).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* TIME LIMIT */}
          <div className="form-group">
            <label>Time Limit (milliseconds)</label>
            <input
              type="number"
              min="100"
              value={trial.timeLimit ?? 2000}
              onChange={(e) =>
                updateTrial(
                  index,
                  "timeLimit",
                  Number(e.target.value)
                )
              }
              required
            />
          </div>
        </div>
      ))}
    </section>
  );
}

export default TrialBuilder;