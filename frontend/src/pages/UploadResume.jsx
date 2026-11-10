
import React, { useState } from "react";
import API from "../services/api";
import { Upload, FileText, Sparkles } from "lucide-react";

function UploadResume() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a PDF resume first.");
      return;
    }

    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are allowed.");
      return;
    }

    if (file.size === 0) {
      setMessage("Empty PDF files are not allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("File size must not exceed 5 MB.");
      return;
    }

    if (!localStorage.getItem("access_token")) {
      setMessage("Please login before uploading your resume.");
      window.location.href = "/login";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setMessage("");

      const response = await API.post(
        "/resume/upload",
        formData
      );

      setMessage(
        response.data.message || "Resume uploaded successfully!"
      );

      setFile(null);

    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        "Resume upload failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <main className="dashboard-main">

        <h2>Resume Upload</h2>
        <p>Upload your resume to begin AI-powered analysis.</p>

        <div className="upload-card">

          <Sparkles size={35} />

          <h2>Upload Your Resume</h2>

          <p>
            Select your PDF resume to analyze your skills
            and discover job opportunities.
          </p>

          <label className="upload-button">
            <Upload size={18} />
            Choose Resume

            <input
              type="file"
              accept=".pdf,application/pdf"
              hidden
              onChange={(e) => {
                setFile(e.target.files[0] || null);
                setMessage("");
              }}
            />
          </label>

          {file && (
            <div className="selected-file">
              <FileText size={18} />
              {file.name}
            </div>
          )}

          <button
            className="primary-button upload-submit"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload Resume"}
          </button>

          {message && (
            <p className="upload-message">{message}</p>
          )}

          <p className="upload-note">
            <FileText size={15} />
            PDF format only · Maximum size 5 MB
          </p>

        </div>
      </main>
    </div>
  );
}

export default UploadResume;
