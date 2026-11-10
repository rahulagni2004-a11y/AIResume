
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

import {
  LayoutDashboard,
  FileText,
  Upload,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Settings as SettingsIcon,
  UserRound,
  Bell,
  Search,
  Sparkles,
  LogOut,
  Lock,
  ShieldCheck,
  Mail,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  MonitorSmartphone,
  RefreshCw,
  Clock,
  Globe
} from "lucide-react";

// Identify browser and device using the session user-agent
const getDeviceLabel = (userAgent = "") => {
  let browser = "Unknown Browser";
  let device = "Unknown Device";

  if (/Edg\//i.test(userAgent)) browser = "Microsoft Edge";
  else if (/Chrome\//i.test(userAgent)) browser = "Google Chrome";
  else if (/Firefox\//i.test(userAgent)) browser = "Firefox";
  else if (/Safari\//i.test(userAgent)) browser = "Safari";

  if (/iPhone/i.test(userAgent)) device = "iPhone";
  else if (/iPad/i.test(userAgent)) device = "iPad";
  else if (/Android/i.test(userAgent)) device = "Android Device";
  else if (/Windows/i.test(userAgent)) device = "Windows PC";
  else if (/Macintosh|Mac OS/i.test(userAgent)) device = "Mac";
  else if (/Linux/i.test(userAgent)) device = "Linux Device";

  return `${browser} on ${device}`;
};

// Format session dates
const formatDate = (dateValue) => {
  if (!dateValue) return "Not available";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString();
};

function Settings() {
  const [profile, setProfile] = useState(null);

  // Password states
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  // Login session states
  const [sessions, setSessions] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionActionLoading, setSessionActionLoading] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");
  const [sessionMessageType, setSessionMessageType] = useState("");

  // Fetch profile information
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get("/profile");
        setProfile(response.data);
      } catch (error) {
        console.error(
          "Profile fetch error:",
          error.response?.data || error.message
        );
      }
    };

    fetchProfile();
  }, []);

  // Fetch active login sessions
  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);

    try {
      const response = await API.get("/sessions");

      setSessions(response.data.sessions || []);
      setTotalSessions(response.data.total_sessions || 0);
    } catch (error) {
      console.error(
        "Session fetch error:",
        error.response?.data || error.message
      );

      setSessionMessage(
        error.response?.data?.detail ||
        "Unable to load login sessions."
      );

      setSessionMessageType("error");
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Password form handlers
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field]
    }));
  };

  const togglePasswordForm = () => {
    setPasswordOpen((previous) => !previous);
    setMessage("");
    setMessageType("");
  };

  // Change password
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage("New password and confirm password do not match.");
      setMessageType("error");
      return;
    }

    if (passwordData.current_password === passwordData.new_password) {
      setMessage("New password must be different from current password.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/change-password", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      setMessage(response.data.message);
      setMessageType("success");

      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });

      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });

      setPasswordOpen(false);

    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        "Unable to change password. Please try again."
      );

      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  // Refresh login sessions
  const handleRefreshSessions = () => {
    setSessionMessage("");
    setSessionMessageType("");
    fetchSessions();
  };

  // Toggle Login Sessions section
  const toggleSessions = () => {
    setSessionsOpen((previous) => !previous);
  };

  // Logout from other devices
  const handleLogoutOthers = async () => {
    if (!window.confirm("Are you sure you want to log out from all other devices?")) {
      return;
    }

    setSessionActionLoading("others");
    setSessionMessage("");
    setSessionMessageType("");

    try {
      const response = await API.delete("/sessions/others");

      setSessionMessage(
        `${response.data.message}. Sessions revoked: ${response.data.sessions_revoked}`
      );

      setSessionMessageType("success");

      await fetchSessions();

    } catch (error) {
      setSessionMessage(
        error.response?.data?.detail ||
        "Unable to log out from other sessions."
      );

      setSessionMessageType("error");

    } finally {
      setSessionActionLoading("");
    }
  };

  // Logout from all devices
  const handleLogoutAll = async () => {
    if (!window.confirm("This will log you out from every device, including this one. Continue?")) {
      return;
    }

    setSessionActionLoading("all");
    setSessionMessage("");
    setSessionMessageType("");

    try {
      await API.delete("/sessions/all");

      localStorage.removeItem("access_token");
      window.location.href = "/login";

    } catch (error) {
      setSessionMessage(
        error.response?.data?.detail ||
        "Unable to log out from all devices."
      );

      setSessionMessageType("error");
      setSessionActionLoading("");
    }
  };

  // Regular logout
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

          <Link className="nav-item" to="/dashboard">
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

          <Link className="nav-item active" to="/settings">
            <SettingsIcon size={19} />
            Settings
          </Link>

          <button className="nav-item" onClick={handleLogout}>
            <LogOut size={19} />
            Logout
          </button>

        </div>

      </aside>

      {/* Main Content */}
      <main className="dashboard-main">

        <header className="topbar">

          <div>
            <h2>Settings</h2>
            <p>Manage your account and security preferences.</p>
          </div>

          <div className="topbar-actions">

            <Link to="/jobs" className="icon-button" title="Search Jobs">
              <Search size={20} />
            </Link>

            <Link
              to="/applications"
              className="icon-button"
              title="View Applications"
            >
              <Bell size={20} />
            </Link>

            <Link to="/settings" className="user-avatar" title="Settings">
              <UserRound size={20} />
            </Link>

          </div>

        </header>

        {/* Profile Section */}
        <section className="settings-card">

          <div className="settings-card-heading">
            <UserRound size={23} />

            <div>
              <h3>Profile Information</h3>
              <p>Your account details</p>
            </div>
          </div>

          <div className="settings-profile-row">

            <div className="settings-avatar">
              <UserRound size={30} />
            </div>

            <div>
              <h3>{profile?.email || "Loading profile..."}</h3>
              <p>AIResume Account</p>
            </div>

          </div>

          <div className="settings-info-grid">

            <div className="settings-info-item">
              <Mail size={19} />

              <div>
                <span>Email Address</span>
                <p>{profile?.email || "Loading..."}</p>
              </div>
            </div>

            <div className="settings-info-item">
              <UserRound size={19} />

              <div>
                <span>User ID</span>
                <p>{profile?.user_id || "Loading..."}</p>
              </div>
            </div>

          </div>

        </section>

        {/* Change Password Section */}
        <section className="settings-card">

          <div className="settings-card-heading">
            <Lock size={23} />

            <div>
              <h3>Change Password</h3>
              <p>Update your account password securely.</p>
            </div>
          </div>

          <button
            type="button"
            className="settings-submit-button"
            onClick={togglePasswordForm}
            style={{ marginBottom: passwordOpen ? "20px" : "0" }}
          >
            <KeyRound size={18} />
            Change Password

            {passwordOpen
              ? <ChevronUp size={18} />
              : <ChevronDown size={18} />
            }

          </button>

          {passwordOpen && (

            <form
              className="settings-form"
              onSubmit={handleSubmit}
            >

              {/* Current Password */}
              <label>Current Password</label>

              <div className="password-input-wrapper">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="current_password"
                  placeholder="Enter current password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  required
                />

                <button
                  type="button"
                  className="password-eye-button"
                  onClick={() => togglePasswordVisibility("current")}
                  aria-label="Toggle current password visibility"
                >
                  {showPasswords.current
                    ? <EyeOff size={19} />
                    : <Eye size={19} />
                  }
                </button>
              </div>

              {/* New Password */}
              <label>New Password</label>

              <div className="password-input-wrapper">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="new_password"
                  placeholder="Enter new password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  minLength={8}
                  maxLength={64}
                  required
                />

                <button
                  type="button"
                  className="password-eye-button"
                  onClick={() => togglePasswordVisibility("new")}
                  aria-label="Toggle new password visibility"
                >
                  {showPasswords.new
                    ? <EyeOff size={19} />
                    : <Eye size={19} />
                  }
                </button>
              </div>

              {/* Confirm New Password */}
              <label>Confirm New Password</label>

              <div className="password-input-wrapper">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirm_password"
                  placeholder="Confirm new password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  minLength={8}
                  maxLength={64}
                  required
                />

                <button
                  type="button"
                  className="password-eye-button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  aria-label="Toggle confirm password visibility"
                >
                  {showPasswords.confirm
                    ? <EyeOff size={19} />
                    : <Eye size={19} />
                  }
                </button>
              </div>

              <p className="settings-password-note">
                Password must contain at least 8 characters,
                including one letter and one number.
              </p>

              <button
                type="submit"
                className="settings-submit-button"
                disabled={loading}
              >
                <KeyRound size={18} />
                {loading ? "Updating..." : "Update Password"}
              </button>

            </form>

          )}

          {message && (
            <p className={`settings-message ${messageType}`}>
              {message}
            </p>
          )}

        </section>

        {/* Account Security Section */}
        <section className="settings-card">

          <div className="settings-card-heading">
            <ShieldCheck size={23} />

            <div>
              <h3>Account Security</h3>
              <p>Manage your account protection and login sessions.</p>
            </div>
          </div>

          {/* JWT Authentication */}
          <div className="settings-security-item">
            <ShieldCheck size={21} />

            <div>
              <h4>JWT Authentication</h4>
              <p>Your account uses token-based authentication.</p>
            </div>

            <span className="settings-security-status">
              Enabled
            </span>
          </div>

          {/* Password Protection */}
          <div className="settings-security-item">
            <Lock size={21} />

            <div>
              <h4>Password Protection</h4>
              <p>Your password is stored in hashed format.</p>
            </div>

            <span className="settings-security-status">
              Enabled
            </span>
          </div>

          {/* Expandable Login Sessions */}
          <div className="settings-sessions-section">

            <button
              type="button"
              className="settings-session-toggle"
              onClick={toggleSessions}
              aria-expanded={sessionsOpen}
            >

              <span className="settings-session-toggle-title">
                <MonitorSmartphone size={22} />

                <span>
                  <strong>Login Sessions</strong>
                  <small>
                    Manage devices where your account is logged in.
                  </small>
                </span>
              </span>

              {sessionsOpen
                ? <ChevronUp size={20} />
                : <ChevronDown size={20} />
              }

            </button>

            {sessionsOpen && (

              <div className="settings-sessions-content">

                {/* Session Heading */}
                <div className="settings-sessions-heading">

                  <span>Manage your active sessions</span>

                  <button
                    type="button"
                    className="settings-refresh-button"
                    onClick={handleRefreshSessions}
                    disabled={sessionsLoading}
                    title="Refresh sessions"
                  >
                    <RefreshCw
                      size={17}
                      className={sessionsLoading ? "session-spinning" : ""}
                    />
                    Refresh
                  </button>

                </div>

                {/* Active Session Count */}
                <div className="settings-session-count">
                  <span>Active Sessions</span>

                  <strong>
                    {sessionsLoading ? "..." : totalSessions}
                  </strong>
                </div>

                {/* Session List */}
                {sessionsLoading ? (

                  <p className="settings-session-empty">
                    Loading login sessions...
                  </p>

                ) : (

                  <div className="settings-session-list">

                    {sessions.length > 0 ? (

                      sessions.map((session) => (

                        <div className="settings-session-details">

  <div className="settings-session-device">
    <h4>
      {getDeviceLabel(session.user_agent)}
    </h4>

    {session.is_current && (
      <span className="settings-current-badge">
        Current Session
      </span>
    )}
  </div>

</div>

                      ))

                    ) : (

                      <p className="settings-session-empty">
                        No active login sessions found.
                      </p>

                    )}

                  </div>

                )}

                {/* Session Messages */}
                {sessionMessage && (
                  <p className={`settings-message ${sessionMessageType}`}>
                    {sessionMessage}
                  </p>
                )}

                {/* Session Actions */}
                <div className="settings-session-actions">

                  <button
                    type="button"
                    className="settings-submit-button"
                    onClick={handleLogoutOthers}
                    disabled={
                      sessionsLoading ||
                      sessionActionLoading !== "" ||
                      totalSessions <= 1
                    }
                  >
                    <LogOut size={17} />

                    {sessionActionLoading === "others"
                      ? "Logging out..."
                      : "Logout Other Sessions"
                    }

                  </button>

                  <button
                    type="button"
                    className="settings-logout-all-button"
                    onClick={handleLogoutAll}
                    disabled={
                      sessionsLoading ||
                      sessionActionLoading !== "" ||
                      totalSessions === 0
                    }
                  >
                    <LogOut size={17} />

                    {sessionActionLoading === "all"
                      ? "Logging out..."
                      : "Logout All Devices"
                    }

                  </button>

                </div>

                <p className="settings-session-note">
                  Logging out from all devices will also end your current
                  session. You will need to log in again.
                </p>

              </div>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default Settings;
