
import { Link } from "react-router-dom";
import {
  Brain,
  FlaskConical,
  Timer,
  ShieldCheck,
  ArrowRight,
  Menu,
} from "lucide-react";

function Home() {
  return (
    <div className="home-page">
      {/* NAVIGATION */}
      <header className="home-navbar">
        <Link to="/" className="home-logo">
          <Brain size={30} />
          <span>NeuroLab</span>
        </Link>

        <nav className="home-nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </nav>

        <div className="home-nav-actions">
          <Link to="/login" className="home-login-btn">
            Login
          </Link>

          <Link to="/login" className="home-start-btn">
            Get Started
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Brain size={16} />
            <span>Research without boundaries</span>
          </div>

          <h1>
            Bring your research
            <br />
            <span>to the world.</span>
          </h1>

          <p className="hero-description">
            Design, launch, and analyze behavioral experiments
            online. NeuroLab helps researchers reach diverse
            participants with a flexible experiment-building
            platform.
          </p>

          <div className="hero-actions">
            <Link to="/login" className="hero-primary-btn">
              Start Building
              <ArrowRight size={18} />
            </Link>

            <a href="#features" className="hero-secondary-btn">
              Explore Features
            </a>
          </div>

          <p className="hero-note">
            Built for cognitive science and behavioral research.
          </p>
        </div>

        <div className="hero-visual">
          <div className="experiment-preview">
            <div className="preview-header">
              <span className="preview-dot"></span>
              <span className="preview-dot"></span>
              <span className="preview-dot"></span>
              <span className="preview-title">
                Experiment Preview
              </span>
            </div>

            <div className="preview-body">
              <span className="preview-label">
                REACTION TIME TASK
              </span>

              <div className="fixation-cross">+</div>

              <p>Press the spacebar when you see the target.</p>

              <div className="preview-progress">
                <div></div>
              </div>

              <span className="preview-step">
                Trial 1 of 20
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features-section" id="features">
        <div className="section-heading">
          <span>PLATFORM FEATURES</span>
          <h2>Everything you need to run research</h2>
          <p>
            Build experiments, measure responses, and organize
            your research in one workspace.
          </p>
        </div>

        <div className="features-grid">
          <article className="feature-card">
            <div className="feature-icon blue">
              <FlaskConical size={25} />
            </div>

            <h3>Visual Experiment Builder</h3>

            <p>
              Create trials, configure stimuli, and design
              experiment flows using an intuitive visual
              interface.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-icon purple">
              <Timer size={25} />
            </div>

            <h3>Precision Timing</h3>

            <p>
              Build browser-based tasks with response-time
              measurement and carefully controlled stimulus
              presentation.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-icon green">
              <ShieldCheck size={25} />
            </div>

            <h3>Privacy-Focused Research</h3>

            <p>
              Design research workflows around participant
              anonymity, data protection, and responsible
              data collection.
            </p>
          </article>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="about-section" id="about">
        <h2>Research made more accessible.</h2>

        <p>
          NeuroLab aims to help researchers move beyond
          traditional laboratory settings by making online
          behavioral experiments easier to create and manage.
        </p>

        <Link to="/login" className="about-btn">
          Get Started
          <ArrowRight size={17} />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <Link to="/" className="home-logo">
          <Brain size={23} />
          <span>NeuroLab</span>
        </Link>

        <p>© 2026 NeuroLab. Research without boundaries.</p>
      </footer>
    </div>
  );
}

export default Home;