
import React, { useState, useEffect } from "react";
import API from "../services/api";

import {
  Sparkles,
  ChartNoAxesCombined,
  Target,
  CheckCircle2,
  AlertCircle,
  Lightbulb
} from "lucide-react";

function ATSAnalysis() {
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [message, setMessage] = useState("");

  // Fetch uploaded resumes
  useEffect(() => {
    const fetchResumes = async () => {

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
          setMessage("Please upload a resume before analysis.");
        }

      } catch (error) {
        setMessage(
          error.response?.data?.detail ||
          "Unable to fetch resume history."
        );
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchResumes();
  }, []);

  // Analyze resume
  const handleAnalyze = async () => {

    if (!resumeId || !jobDescription.trim()) {
      setMessage("Please select a resume and enter a job description.");
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
      setAnalysis(null);

      const response = await API.post(
        "/resume/analyze",
        null,
        {
          params: {
            resume_id: resumeId,
            job_description: jobDescription
          }
        }
      );

      setAnalysis(response.data.analysis);
      setMessage("Resume analysis completed successfully!");

    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        "Analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const score = Math.min(
    100,
    Math.max(0, Number(analysis?.ats_score) || 0)
  );

  const getScoreStatus = () => {
    if (score >= 75) return "Excellent Match";
    if (score >= 50) return "Good Progress";
    return "Needs Improvement";
  };

  return (
    <div className="dashboard-layout">
      <main className="dashboard-main">

        {/* Page Heading */}
        <div className="page-heading">
          <h2>ATS Resume Analyzer</h2>
          <p>
            Discover how well your resume matches a job description.
          </p>
        </div>

        {/* Analysis Form */}
        <div className="ats-form-card">

          <div className="ats-heading">
            <Sparkles size={30} />
            <h2>Analyze Your Resume</h2>
            <p>
              Get your ATS score and personalized suggestions.
            </p>
          </div>

          <label>Select Your Resume</label>

          <select
            className="ats-resume-select"
            value={resumeId}
            onChange={(e) => {
              setResumeId(e.target.value);
              setAnalysis(null);
              setMessage("");
            }}
            disabled={loadingResumes || resumes.length === 0}
          >
            <option value="">
              {loadingResumes
                ? "Loading resumes..."
                : "Select a resume"}
            </option>

            {resumes.map((resume) => (
              <option key={resume._id} value={resume._id}>
                {resume.file_name}
              </option>
            ))}
          </select>

          <label>Job Description</label>

          <textarea
            className="ats-job-description"
            rows="7"
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          <button
            className="primary-button ats-button"
            onClick={handleAnalyze}
            disabled={
              loading ||
              loadingResumes ||
              resumes.length === 0
            }
          >
            <ChartNoAxesCombined size={18} />
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>

          {message && (
            <p
              className={`ats-message ${
                message.includes("successfully") ? "success" : ""
              }`}
            >
              {message}
            </p>
          )}

        </div>

        {/* ATS Results */}
        {analysis && (
          <div className="ats-result-card">

            <h2 className="ats-results-title">
              <Target size={24} />
              Your ATS Results
            </h2>

            {/* Circular ATS Score */}
            <div className="ats-score-section">

              <div
                className="ats-score-circle"
                style={{
                  "--score": `${score}%`
                }}
              >
                <div className="ats-score-inner">
                  <span>{score}%</span>
                  <small>ATS SCORE</small>
                </div>
              </div>

              <div className="ats-score-info">
                <h3>Resume Compatibility</h3>

                <p>
                  Your resume matches {score}% of the job
                  requirements according to this analyzer.
                </p>

                <div className="score-status">
                  {getScoreStatus()}
                </div>
              </div>

            </div>

            {/* Matched Skills */}
            <div className="ats-skills-section">
              <h3>
                <CheckCircle2 size={19} />
                Matched Skills
              </h3>

              <div className="skill-list">
                {analysis.matched_skills?.length > 0 ? (
                  analysis.matched_skills.map((skill) => (
                    <span className="matched-skill" key={skill}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <p>No matched skills found.</p>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="ats-skills-section">
              <h3>
                <AlertCircle size={19} />
                Missing Skills
              </h3>

              <div className="skill-list">
                {analysis.missing_skills?.length > 0 ? (
                  analysis.missing_skills.map((skill) => (
                    <span className="missing-skill" key={skill}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <p>No missing skills found.</p>
                )}
              </div>
            </div>

            {/* Improvement Suggestions */}
            <div className="ats-skills-section">
              <h3>
                <Lightbulb size={19} />
                Improvement Suggestions
              </h3>

              {analysis.suggestions?.length > 0 ? (
                analysis.suggestions.map((suggestion, index) => (
                  <div className="ats-suggestion" key={index}>
                    {suggestion}
                  </div>
                ))
              ) : (
                <p>No additional suggestions available.</p>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default ATSAnalysis;
