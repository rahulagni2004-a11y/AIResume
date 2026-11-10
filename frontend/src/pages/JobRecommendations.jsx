
import React, { useState, useEffect } from "react";
import API from "../services/api";

import {
  BriefcaseBusiness,
  MapPin,
  Wallet,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search
} from "lucide-react";

function JobRecommendations() {
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState("");
  const [resumeSearch, setResumeSearch] = useState("");

  // Fetch existing applications
  const fetchExistingApplications = async () => {
    try {
      const response = await API.get("/applications");

      const applicationList = Array.isArray(response.data)
        ? response.data
        : response.data.applications || [];

      const appliedIds = applicationList.map(
        (application) => String(application.job_id)
      );

      setAppliedJobIds(appliedIds);

    } catch (error) {
      console.error("Unable to fetch existing applications:", error);
    }
  };

  // Fetch uploaded resumes and existing applications
  useEffect(() => {
    const fetchInitialData = async () => {

      if (!localStorage.getItem("access_token")) {
        setMessage("Please login first.");
        setLoadingResumes(false);
        window.location.href = "/login";
        return;
      }

      try {
        const response = await API.get("/resume/history");

        const resumeList = response.data.resumes || [];
        setResumes(resumeList);

        if (resumeList.length > 0) {
          setResumeId(resumeList[0]._id);
        } else {
          setMessage(
            "Please upload a resume to get job recommendations."
          );
        }

        await fetchExistingApplications();

      } catch (error) {
        setMessage(
          error.response?.data?.detail ||
          "Unable to fetch your resumes."
        );
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch job recommendations
  const fetchRecommendations = async () => {
    if (!resumeId) {
      setMessage("Please select a resume first.");
      return;
    }

    if (!localStorage.getItem("access_token")) {
      setMessage("Your session has expired. Please login again.");
      window.location.href = "/login";
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setJobs([]);

      const response = await API.get(
        `/jobs/recommend/${resumeId}`
      );

      const result = response.data;

      const recommendedJobs = Array.isArray(result)
        ? result
        : result.recommendations || result.jobs || [];

      setJobs(recommendedJobs);

      if (recommendedJobs.length === 0) {
        setMessage(
          "No matching jobs found. Try another resume or check back later."
        );
      }

    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        "Unable to fetch job recommendations."
      );
    } finally {
      setLoading(false);
    }
  };

  // Submit job application
  const applyForJob = async (job) => {

    if (!localStorage.getItem("access_token")) {
      setMessage("Please login again to apply.");
      window.location.href = "/login";
      return;
    }

    const jobId = String(job.job_id);

    if (appliedJobIds.includes(jobId)) {
      return;
    }

    try {
      setApplyingJobId(jobId);
      setMessage("");

      await API.post(
        "/applications",
        {
          job_id: job.job_id,
          cover_letter: ""
        }
      );

      setAppliedJobIds((previous) =>
        previous.includes(jobId)
          ? previous
          : [...previous, jobId]
      );

      setMessage(
        `Application submitted successfully for ${job.title}!`
      );

    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        "Unable to submit application.";

      // If backend reports a duplicate, refresh application state
      if (
        String(errorMessage).toLowerCase().includes("already")
      ) {
        await fetchExistingApplications();
      }

      setMessage(errorMessage);

    } finally {
      setApplyingJobId("");
    }
  };

  // Search jobs
  const filteredJobs = jobs.filter((job) => {
    const search = searchTerm.toLowerCase();

    return (
      (job.title || "").toLowerCase().includes(search) ||
      (job.company || "").toLowerCase().includes(search) ||
      (job.location || "").toLowerCase().includes(search)
    );
  });

  // Filter uploaded resumes
  const filteredResumes = resumes.filter((resume) =>
    (resume.file_name || "")
      .toLowerCase()
      .includes(resumeSearch.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <main className="dashboard-main">

        {/* Page Heading */}
        <div className="page-heading">
          <h2>Job Recommendations</h2>
          <p>
            Discover opportunities that match your resume and skills.
          </p>
        </div>

        {/* Resume Selection */}
        <div className="jobs-search-card">

          <div className="jobs-heading">
            <Sparkles size={28} />
            <h2>AI-Powered Job Matching</h2>
            <p>
              Find opportunities based on your resume skills.
            </p>
          </div>

          <label>Select Your Resume</label>

          <div className="resume-selection-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search your uploaded resumes..."
              value={resumeSearch}
              onChange={(e) => setResumeSearch(e.target.value)}
            />
          </div>

          <select
            value={resumeId}
            onChange={(e) => {
              setResumeId(e.target.value);
              setJobs([]);
              setMessage("");
            }}
            disabled={loadingResumes || resumes.length === 0}
          >
            <option value="">
              {loadingResumes
                ? "Loading resumes..."
                : "Select a resume"}
            </option>

            {filteredResumes.map((resume) => (
              <option key={resume._id} value={resume._id}>
                {resume.file_name}
              </option>
            ))}

            {filteredResumes.length === 0 && (
              <option value="" disabled>
                No matching resumes found
              </option>
            )}

          </select>

          <button
            className="primary-button jobs-search-button"
            onClick={fetchRecommendations}
            disabled={loading || loadingResumes || !resumeId}
          >
            <Sparkles size={18} />
            {loading ? "Finding Jobs..." : "Find Matching Jobs"}
          </button>

        </div>

        {/* Recommended Jobs */}
        {jobs.length > 0 && (
          <div className="jobs-results-section">

            <div className="jobs-results-header">
              <div>
                <h2>Recommended Opportunities</h2>
                <p>
                  {filteredJobs.length} matching opportunities found
                </p>
              </div>

              <div className="jobs-search-input">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search jobs or companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="jobs-grid">

              {filteredJobs.map((job, index) => {
                const matchScore = Math.min(
                  100,
                  Math.max(0, Number(job.match_score) || 0)
                );

                const matchedSkills = job.matched_skills || [];
                const missingSkills = job.missing_skills || [];

                const jobId = String(job.job_id);
                const isApplied = appliedJobIds.includes(jobId);
                const isApplying = applyingJobId === jobId;

                return (
                  <div
                    className="job-recommendation-card"
                    key={jobId || index}
                  >

                    <div className="job-card-top">
                      <div className="job-icon">
                        <BriefcaseBusiness size={25} />
                      </div>

                      <div className="job-match-badge">
                        <Sparkles size={14} />
                        {matchScore}% Match
                      </div>
                    </div>

                    <h3>{job.title || "Job Opportunity"}</h3>

                    <p className="job-company">
                      {job.company || "Company not specified"}
                    </p>

                    <div className="job-details">
                      {job.location && (
                        <span>
                          <MapPin size={16} />
                          {job.location}
                        </span>
                      )}

                      {job.salary && (
                        <span>
                          <Wallet size={16} />
                          {job.salary}
                        </span>
                      )}
                    </div>

                    {job.job_type && (
                      <span className="job-type-badge">
                        {job.job_type}
                      </span>
                    )}

                    <div className="job-skills-section">
                      <h4>
                        <CheckCircle2 size={16} />
                        Matched Skills
                      </h4>

                      <div className="job-skill-list">
                        {matchedSkills.length > 0 ? (
                          matchedSkills.map((skill) => (
                            <span
                              className="job-matched-skill"
                              key={skill}
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <small>No matched skills listed.</small>
                        )}
                      </div>
                    </div>

                    <div className="job-skills-section">
                      <h4>
                        <AlertCircle size={16} />
                        Skills to Improve
                      </h4>

                      <div className="job-skill-list">
                        {missingSkills.length > 0 ? (
                          missingSkills.map((skill) => (
                            <span
                              className="job-missing-skill"
                              key={skill}
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <small>No missing skills listed.</small>
                        )}
                      </div>
                    </div>

                    {/* Apply Button */}
                    <button
                      className={`job-card-button ${
                        isApplied ? "applied-button" : ""
                      }`}
                      disabled={isApplied || isApplying}
                      onClick={() => applyForJob(job)}
                    >
                      {isApplied
                        ? "✓ Applied"
                        : isApplying
                        ? "Submitting..."
                        : "Apply for this Job"}
                    </button>

                  </div>
                );
              })}

            </div>

            {filteredJobs.length === 0 && (
              <p className="no-jobs-message">
                No jobs match your search.
              </p>
            )}

          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="jobs-message">
            {message}
          </div>
        )}

      </main>
    </div>
  );
}

export default JobRecommendations;
