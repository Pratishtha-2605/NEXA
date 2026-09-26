
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import TrialScreen from "../components/TrialScreen.jsx";

function Experiment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [experiment, setExperiment] = useState(null);

  useEffect(() => {
    const savedExperiments = JSON.parse(
      localStorage.getItem("experiments") || "[]"
    );

    const selectedExperiment = savedExperiments.find(
      (item) => String(item.id) === id
    );

    setExperiment(selectedExperiment || null);
  }, [id]);

  function handleComplete(result) {
    const savedResults = JSON.parse(
      localStorage.getItem("experimentResults") || "[]"
    );

    savedResults.push(result);

    localStorage.setItem(
      "experimentResults",
      JSON.stringify(savedResults)
    );

    const savedExperiments = JSON.parse(
      localStorage.getItem("experiments") || "[]"
    );

    const updatedExperiments = savedExperiments.map((item) =>
      String(item.id) === id
        ? { ...item, status: "Completed" }
        : item
    );

    localStorage.setItem(
      "experiments",
      JSON.stringify(updatedExperiments)
    );
  }

  if (!experiment) {
    return (
      <div className="page-content">
        <h1>Experiment not found</h1>
        <p>This experiment may have been deleted or does not exist.</p>

        <button
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
      <button
        className="secondary-btn"
        onClick={() => navigate("/dashboard")}
        style={{ marginBottom: "20px" }}
      >
        ← Back to Dashboard
      </button>

      <TrialScreen
        experiment={experiment}
        onComplete={handleComplete}
      />
    </div>
  );
}

export default Experiment;