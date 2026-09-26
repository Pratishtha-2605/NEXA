

function Results() {
  const trials = [
    { trial: 1, accuracy: "92%", rt: 623 },
    { trial: 2, accuracy: "88%", rt: 701 },
    { trial: 3, accuracy: "90%", rt: 671 },
    { trial: 4, accuracy: "85%", rt: 720 },
    { trial: 5, accuracy: "89%", rt: 680 },
    { trial: 6, accuracy: "91%", rt: 650 },
    { trial: 7, accuracy: "86%", rt: 710 },
    { trial: 8, accuracy: "88%", rt: 695 },
    { trial: 9, accuracy: "90%", rt: 660 },
    { trial: 10, accuracy: "87%", rt: 684 },
  ];

  const bars = [45, 70, 55, 85, 65, 95, 75, 60, 80, 50, 68, 40];

  return (
    <div className="results-page">
      <h1>Experiment Results</h1>

      <div className="results-meta">
        <span>
          Participants: <strong>42</strong>
        </span>
        <span>
          Trials: <strong>20</strong>
        </span>
      </div>

      <div className="results-stats">
        <div className="result-card">
          <p>Average Reaction Time</p>
          <h2>
            684 <small>ms</small>
          </h2>
        </div>

        <div className="result-card">
          <p>Accuracy</p>
          <h2>87.4%</h2>
        </div>
      </div>

      <div className="results-section">
        <h2>Reaction Time Distribution</h2>

        <div className="reaction-chart">
          {bars.map((height, index) => (
            <div className="bar-column" key={index}>
              <div
                className="bar"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="results-section">
        <h2>Trial Results</h2>

        <div className="results-table-wrapper">
          <table className="results-table">
            <thead>
              <tr>
                <th>Trial</th>
                <th>Accuracy</th>
                <th>Avg RT</th>
              </tr>
            </thead>

            <tbody>
              {trials.map((item) => (
                <tr key={item.trial}>
                  <td>{item.trial}</td>
                  <td>{item.accuracy}</td>
                  <td>{item.rt} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Results;