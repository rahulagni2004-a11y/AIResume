
import React, { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  Upload,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Settings,
  UserRound,
  Bell,
  Search,
  Sparkles,
  LogOut
} from "lucide-react";

function Dashboard() {

  const [stats, setStats] = useState({
    total_resumes: 0,
    total_analyses: 0,
    total_recommended_jobs: 0,
    total_applications: 0
  });

  // Fetch Dashboard Statistics
  useEffect(() => {

    const fetchDashboard = async () => {

      try {
        const response = await API.get("/dashboard");

        setStats(response.data.dashboard);

      } catch (error) {

        console.error(
          "Dashboard fetch error:",
          error.response?.data || error.message
        );

      }
    };

    fetchDashboard();

  }, []);

  // Logout with Confirmation
  const handleLogout = () => {

    const confirmLogout = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmLogout) {
      return;
    }

    localStorage.removeItem("access_token");
    window.location.href = "/login";

  };

  return (
    <div className="dashboard-layout">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">
          <Sparkles size={27} />
          <h2>AIResume</h2>
        </div>

        <p className="menu-label">WORKSPACE</p>

        <nav className="sidebar-nav">

          <Link className="nav-item active" to="/dashboard">
            <LayoutDashboard size={19} />
            Dashboard
          </Link>

          <Link className="nav-item" to="/upload">
            <Upload size={19} />
            Resume Upload
          </Link>

          <Link className="nav-item" to="/analysis">
            <ChartNoAxesCombined size={19} />
            ATS Analysis
          </Link>

          <Link className="nav-item" to="/jobs">
            <BriefcaseBusiness size={19} />
            Job Recommendations
          </Link>

          <Link className="nav-item" to="/applications">
            <FileText size={19} />
            Applications
          </Link>

        </nav>

        <div className="sidebar-bottom">

          <Link className="nav-item" to="/settings">
            <Settings size={19} />
            Settings
          </Link>

          <button
            className="nav-item"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            Logout
          </button>

        </div>

      </aside>

      {/* Main Content */}
      <main className="dashboard-main">

        <header className="topbar">

          <div>
            <h2>Dashboard</h2>
            <p>Welcome to your AI-powered career workspace.</p>
          </div>

          <div className="topbar-actions">

            <Link
              to="/jobs"
              className="icon-button"
              title="Search Jobs"
            >
              <Search size={20} />
            </Link>

            <Link
              to="/applications"
              className="icon-button"
              title="View Applications"
            >
              <Bell size={20} />
            </Link>

            <Link
              to="/settings"
              className="user-avatar"
              title="Settings"
            >
              <UserRound size={20} />
            </Link>

          </div>

        </header>

        {/* Welcome Banner */}
        <section className="welcome-banner">

          <div>

            <span className="welcome-tag">
              <Sparkles size={14} />
              AI CAREER ASSISTANT
            </span>

            <h1>Your career journey starts here.</h1>

            <p>
              Analyze your resume, improve your skills
              and discover better job opportunities.
            </p>

            <Link to="/analysis" className="primary-button">
              Explore AI Tools
            </Link>

          </div>

        </section>

        {/* Dashboard Statistics */}
        <section className="stats-grid">

          <Link to="/upload" className="stat-card">
            <FileText size={23} />
            <p>Resumes Uploaded</p>
            <h2>{stats.total_resumes}</h2>
          </Link>

          <Link to="/analysis" className="stat-card">
            <ChartNoAxesCombined size={23} />
            <p>ATS Analyses</p>
            <h2>{stats.total_analyses}</h2>
          </Link>

          <Link to="/jobs" className="stat-card">
            <BriefcaseBusiness size={23} />
            <p>Recommended Jobs</p>
            <h2>{stats.total_recommended_jobs}</h2>
          </Link>

          <Link to="/applications" className="stat-card">
            <Upload size={23} />
            <p>Applications</p>
            <h2>{stats.total_applications}</h2>
          </Link>

        </section>

        {/* Recent Activity and Quick Actions */}
        <section className="dashboard-bottom">

          {/* Recent Activity */}
          <div className="dashboard-panel">

            <div className="panel-heading">
              <h3>Recent Activity</h3>
              <span>Workspace overview</span>
            </div>

            <Link to="/upload" className="activity-item">

              <FileText size={20} />

              <div>
                <h4>Resume Uploads</h4>
                <p>
                  {stats.total_resumes} resume(s) available in your account.
                </p>
              </div>

            </Link>

            <Link to="/analysis" className="activity-item">

              <ChartNoAxesCombined size={20} />

              <div>
                <h4>Resume Analysis</h4>
                <p>
                  {stats.total_analyses} ATS analysis(es) completed.
                </p>
              </div>

            </Link>

            <Link to="/jobs" className="activity-item">

              <BriefcaseBusiness size={20} />

              <div>
                <h4>Job Recommendations</h4>
                <p>
                  {stats.total_recommended_jobs} matching job(s) available.
                </p>
              </div>

            </Link>

            <Link to="/applications" className="activity-item">

              <FileText size={20} />

              <div>
                <h4>Job Applications</h4>
                <p>
                  {stats.total_applications} application(s) submitted.
                </p>
              </div>

            </Link>

          </div>

          {/* Quick Actions */}
          <div className="dashboard-panel">

            <div className="panel-heading">
              <h3>Quick Actions</h3>
              <span>Get started</span>
            </div>

            <Link to="/upload" className="quick-action">
              <Upload size={20} />
              Upload Your Resume
            </Link>

            <Link to="/analysis" className="quick-action">
              <ChartNoAxesCombined size={20} />
              Analyze Your Resume
            </Link>

            <Link to="/jobs" className="quick-action">
              <BriefcaseBusiness size={20} />
              Explore Job Opportunities
            </Link>

            <Link to="/applications" className="quick-action">
              <FileText size={20} />
              Track Applications
            </Link>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;
