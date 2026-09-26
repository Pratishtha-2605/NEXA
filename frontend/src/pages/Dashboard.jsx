
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [experiments, setExperiments] = useState([]);
  const [search, setSearch] = useState("");

  // Load saved experiments
  useEffect(() => {
    const savedExperiments = JSON.parse(
      localStorage.getItem("experiments") || "[]"
    );

    setExperiments(savedExperiments);
  }, []);

  // Delete an experiment
  function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this experiment?"
    );

    if (!confirmed) return;

    const updatedExperiments = experiments.filter(
      (experiment) => experiment.id !== id
    );

    setExperiments(updatedExperiments);

    localStorage.setItem(
      "experiments",
      JSON.stringify(updatedExperiments)
    );
  }

  // Filter experiments
  const filteredExperiments = experiments.filter((experiment) =>
    (experiment.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Calculate statistics
  const totalTrials = experiments.reduce(
    (total, experiment) =>
      total + Number(experiment.trialCount || 0),
    0
  );

  const completedExperiments = experiments.filter(
    (experiment) =>
      (experiment.status || "").toLowerCase() === "completed"
  ).length;

  const activeExperiments = experiments.filter(
    (experiment) =>
      (experiment.status || "").toLowerCase() !== "completed"
  ).length;

  return (
    <div className="dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your research overview.</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => navigate("/create-experiment")}
        >
          + Create Experiment
        </button>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Experiments</h3>
          <h2>{experiments.length}</h2>
        </div>

        <div className="stat-card">
          <h3>Total Trials</h3>
          <h2>{totalTrials}</h2>
        </div>

        <div className="stat-card">
          <h3>Completed Experiments</h3>
          <h2>{completedExperiments}</h2>
        </div>

        <div className="stat-card">
          <h3>Active Experiments</h3>
          <h2>{activeExperiments}</h2>
        </div>
      </div>

      {/* My Experiments */}
      <div className="experiments-section">
        <div className="section-header">
          <h2>My Experiments</h2>

          <input
            type="text"
            placeholder="Search experiments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {filteredExperiments.length === 0 ? (
          <div className="empty-state">
            <h3>
              {search ? "No experiments found" : "No experiments yet"}
            </h3>

            <p>
              {search
                ? "Try searching with a different name."
                : "Create your first experiment to get started."}
            </p>

            {!search && (
              <button
                className="primary-btn"
                onClick={() => navigate("/create-experiment")}
              >
                + Create Your First Experiment
              </button>
            )}
          </div>
        ) : (
          <div className="experiments-grid">
            {filteredExperiments.map((experiment) => {
              const status = experiment.status || "Pending";

              return (
                <div className="experiment-card" key={experiment.id}>
                  <h3>{experiment.name}</h3>

                  <p>
                    {experiment.description || "No description provided."}
                  </p>

                  <div className="experiment-details">
                    <span>
                      Trials: {experiment.trialCount || 0}
                    </span>

                    <span
                      className={`status-badge status-${status.toLowerCase()}`}
                    >
                      Status: {status}
                    </span>
                  </div>

                  <div className="experiment-actions">
                    <button
                      className="primary-btn"
                      onClick={() =>
                        navigate(`/experiment/${experiment.id}`)
                      }
                      disabled={!experiment.trials?.length}
                      title={
                        !experiment.trials?.length
                          ? "This experiment has no trials"
                          : "Start this experiment"
                      }
                    >
                      Start Experiment
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={() => navigate("/results")}
                    >
                      View Results
                    </button>
                    <button
  type="button"
  className="secondary-btn"
  onClick={() => navigate(`/edit-experiment/${experiment.id}`)}
>
  Edit Experiment
</button>

                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(experiment.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;