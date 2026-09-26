
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TrialBuilder from "../components/TrialBuilder.jsx";

function EditExperiment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [experiment, setExperiment] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trials, setTrials] = useState([]);

  useEffect(() => {
    const savedExperiments = JSON.parse(
      localStorage.getItem("experiments") || "[]"
    );

    const existingExperiment = savedExperiments.find(
      (item) => String(item.id) === id
    );

    if (existingExperiment) {
      setExperiment(existingExperiment);
      setName(existingExperiment.name || "");
      setDescription(existingExperiment.description || "");
      setTrials(existingExperiment.trials || []);
    }
  }, [id]);

  function handleSubmit(event) {
    event.preventDefault();

    if (!experiment) return;

    const savedExperiments = JSON.parse(
      localStorage.getItem("experiments") || "[]"
    );

    const updatedExperiments = savedExperiments.map((item) =>
      String(item.id) === id
        ? {
            ...item,
            name,
            description,
            trials,
            trialCount: trials.length,
          }
        : item
    );

    localStorage.setItem(
      "experiments",
      JSON.stringify(updatedExperiments)
    );

    navigate("/dashboard");
  }

  if (!experiment) {
    return (
      <div className="page-content">
        <h2>Experiment not found</h2>
        <button
          type="button"
          className="primary-btn"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h1>Edit Experiment</h1>
      <p>Update your experiment details and add or edit trials.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Experiment Name *</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
          />
        </div>

        <TrialBuilder trials={trials} onChange={setTrials} />

        <div className="experiment-form-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </button>

          <button type="submit" className="primary-btn">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditExperiment;