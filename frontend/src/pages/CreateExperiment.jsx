
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TrialBuilder from "../components/TrialBuilder.jsx";

const paradigms = [
  { value: "stroop", label: "Stroop" },
  { value: "simple-reaction-time", label: "Simple Reaction Time" },
  { value: "go-no-go", label: "Go/No-Go" },
  { value: "flanker", label: "Flanker" },
  { value: "lexical-decision", label: "Lexical Decision" },
];

function CreateExperiment() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [paradigm, setParadigm] = useState("");
  const [trials, setTrials] = useState([]);

  function handleParadigmChange(value) {
    setParadigm(value);
    setTrials([]);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!paradigm) {
      alert("Please select an experiment paradigm.");
      return;
    }

    if (trials.length === 0) {
      alert("Please add at least one trial.");
      return;
    }

    const experiment = {
      id: Date.now(),
      name,
      description,
      paradigm,
      trialCount: trials.length,
      trials,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    const savedExperiments = JSON.parse(
      localStorage.getItem("experiments") || "[]"
    );

    savedExperiments.push(experiment);

    localStorage.setItem(
      "experiments",
      JSON.stringify(savedExperiments)
    );

    navigate("/dashboard");
  }

  return (
    <div className="page-content">
      <div className="dashboard-header">
        <div>
          <h1>Create Experiment</h1>
          <p>
            Set up your experiment, choose a paradigm, and
            add trials for your participants.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="experiment-form">
        <label>Experiment Name</label>
        <input
          type="text"
          placeholder="Enter experiment name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>Description</label>
        <textarea
          placeholder="Describe your experiment"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <label htmlFor="paradigm">Select Experiment Paradigm</label>
        <select
          id="paradigm"
          value={paradigm}
          onChange={(e) => handleParadigmChange(e.target.value)}
          required
        >
          <option value="">Choose a paradigm</option>
          {paradigms.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        {paradigm && (
          <TrialBuilder
            key={paradigm}
            paradigm={paradigm}
            trials={trials}
            onChange={setTrials}
          />
        )}

        <button type="submit" className="primary-btn">
          Create Experiment
        </button>
      </form>
    </div>
  );
}

export default CreateExperiment;