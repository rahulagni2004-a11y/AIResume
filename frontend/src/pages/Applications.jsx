
import React, { useEffect, useState } from "react";
import API from "../services/api";

import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Trash2,
  FileText,
  RefreshCw,
  Search
} from "lucide-react";

function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch applications
  const fetchApplications = async () => {

    if (!localStorage.getItem("access_token")) {
      setMessage("Please login first.");
      setLoading(false);
      window.location.href = "/login";
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await API.get("/applications");

      const data = response.data;

      setApplications(
        Array.isArray(data) ? data : data.applications || []
      );

    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        "Unable to fetch applications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Update application status
  const updateStatus = async (applicationId, newStatus) => {

    if (!localStorage.getItem("access_token")) {
      window.location.href = "/login";
      return;
    }

    try {
      setUpdatingId(applicationId);
      setMessage("");

      await API.patch(
        `/applications/${applicationId}/status`,
        { status: newStatus }
      );

      setApplications((previous) =>
        previous.map((application) =>
          application._id === applicationId
            ? { ...application, status: newStatus }
            : application
        )
      );

      setMessage("Application status updated successfully.");

    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        "Unable to update application status."
      );
    } finally {
      setUpdatingId("");
    }
  };

  // Delete application
  const deleteApplication = async (applicationId) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this application?"
    );

    if (!confirmed) return;

    if (!localStorage.getItem("access_token")) {
      window.location.href = "/login";
      return;
    }

    try {
      setDeletingId(applicationId);
      setMessage("");

      await API.delete(`/applications/${applicationId}`);

      setApplications((previous) =>
        previous.filter(
          (application) => application._id !== applicationId
        )
      );

      setMessage("Application deleted successfully.");

    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        "Unable to delete application."
      );
    } finally {
      setDeletingId("");
    }
  };

  // Search applications by job title or company
  const filteredApplications = applications.filter((application) => {
    const search = searchTerm.toLowerCase().trim();

    return (
      (application.job_title || "")
        .toLowerCase()
        .includes(search) ||
      (application.company || "")
        .toLowerCase()
        .includes(search)
    );
  });

  const getStatusClass = (status) => {
    return (status || "Applied").toLowerCase();
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const statusCounts = {
    Applied: applications.filter((a) => a.status === "Applied").length,
    Shortlisted: applications.filter((a) => a.status === "Shortlisted").length,
    Rejected: applications.filter((a) => a.status === "Rejected").length,
    Selected: applications.filter((a) => a.status === "Selected").length
  };

  return (
    <div className="dashboard-layout">
      <main className="dashboard-main">

        <div className="page-heading">
          <h2>Application Tracking</h2>
          <p>Manage and track all your job applications in one place.</p>
        </div>

        <div className="application-stats">

          <div className="application-stat-card">
            <FileText />
            <p>Total Applications</p>
            <h2>{applications.length}</h2>
          </div>

          <div className="application-stat-card">
            <Clock />
            <p>Applied</p>
            <h2>{statusCounts.Applied}</h2>
          </div>

          <div className="application-stat-card">
            <CheckCircle2 />
            <p>Shortlisted</p>
            <h2>{statusCounts.Shortlisted}</h2>
          </div>

          <div className="application-stat-card">
            <BriefcaseBusiness />
            <p>Selected</p>
            <h2>{statusCounts.Selected}</h2>
          </div>

        </div>

        <div className="applications-header">
          <div>
            <h2>My Applications</h2>
            <p>Keep track of your job application progress.</p>
          </div>

          <button
            className="application-refresh-button"
            onClick={fetchApplications}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {/* Application Search */}
        <div className="applications-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by job title or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="applications-empty">
            Loading your applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="applications-empty">
            <BriefcaseBusiness size={42} />
            <h3>No Applications Yet</h3>
            <p>Your submitted job applications will appear here.</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="applications-empty">
            <Search size={42} />
            <h3>No Matching Applications Found</h3>
            <p>
              Try searching with another job title or company name.
            </p>
          </div>
        ) : (
          <div className="applications-grid">

            {filteredApplications.map((application) => (
              <div
                className="application-card"
                key={application._id}
              >

                <div className="application-card-top">
                  <div className="application-icon">
                    <BriefcaseBusiness size={23} />
                  </div>

                  <span
                    className={`application-status ${getStatusClass(application.status)}`}
                  >
                    {application.status || "Applied"}
                  </span>
                </div>

                <h3>{application.job_title || "Job Opportunity"}</h3>

                <p className="application-company">
                  <Building2 size={15} />
                  {application.company || "Company not specified"}
                </p>

                <div className="application-date">
                  <CalendarDays size={16} />
                  Applied on: {formatDate(application.applied_at)}
                </div>

                {application.cover_letter && (
                  <div className="application-cover-letter">
                    <strong>Cover Letter</strong>
                    <p>{application.cover_letter}</p>
                  </div>
                )}

                <div className="application-actions">
                  <div>
                    <label>Update Status</label>

                    <select
                      value={application.status || "Applied"}
                      onChange={(e) =>
                        updateStatus(application._id, e.target.value)
                      }
                      disabled={updatingId === application._id}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Selected">Selected</option>
                    </select>
                  </div>

                  <button
                    className="application-delete-button"
                    onClick={() => deleteApplication(application._id)}
                    disabled={deletingId === application._id}
                    title="Delete application"
                  >
                    <Trash2 size={17} />
                    {deletingId === application._id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>

              </div>
            ))}

          </div>
        )}

        {message && (
          <div className="applications-message">
            {message}
          </div>
        )}

      </main>
    </div>
  );
}

export default Applications;
