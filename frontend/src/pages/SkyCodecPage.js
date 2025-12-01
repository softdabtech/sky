import { useState, useRef } from "react";
import axios from "axios";
import { Upload, CheckCircle2, Download, Sparkles, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import "@/styles/SkyCodecPage.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WORKFLOW_STAGES = [
  {
    id: 1,
    title: "Data Parsing",
    description: "Input data is received and parsed to identify its structure and type."
  },
  {
    id: 2,
    title: "Pattern Recognition",
    description: "Recurring binary patterns and sequences are identified within the data."
  },
  {
    id: 3,
    title: "Binary Code Optimization",
    description: "Binary patterns are optimized for efficient encoding and compression."
  },
  {
    id: 4,
    title: "Compression",
    description: "Optimized data undergoes compression using proprietary algorithms."
  },
  {
    id: 5,
    title: "Encoded Output",
    description: "Final compressed output is ready for download."
  }
];

const SkyCodecPage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [compressionResult, setCompressionResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    setSelectedFile(file);
    setCompressionResult(null);
    setCurrentStage(0);
    await processFile(file);
  };

  const processFile = async (file) => {
    setIsProcessing(true);
    
    // Animate through stages
    for (let i = 1; i <= 5; i++) {
      setCurrentStage(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Upload and compress file
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${API}/compress`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setCompressionResult(response.data);
      toast.success("File compressed successfully!");
    } catch (error) {
      console.error("Compression error:", error);
      toast.error("Failed to compress file. Please try again.");
      setCurrentStage(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!compressionResult) return;

    try {
      const response = await axios.get(
        `${API}/download/${compressionResult.file_id}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // Add .sky extension to downloaded file
      const fileName = compressionResult.original_name.replace(/\.[^/.]+$/, "") + ".sky";
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("File downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file. Please try again.");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setCompressionResult(null);
    setCurrentStage(0);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleContactClick = () => {
    const subject = encodeURIComponent("I want to know more about SkyCodec");
    const email = "info@softdab.tech";
    window.location.href = `mailto:${email}?subject=${subject}`;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement form submission logic
    console.log("Form submitted:", formData);
    toast.success("Message sent successfully!");
    setIsDialogOpen(false);
    setFormData({
      name: "",
      email: "",
      company: "",
      message: ""
    });
  };

  return (
    <div className="skycodec-container">
      {/* Header */}
      <header className="skycodec-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-container">
              <img 
                src="https://customer-assets.emergentagent.com/job_skycodec-demo/artifacts/z2odrfab_logo%20%20%D0%B3%D0%BE%D1%80%D0%B8%D0%B7%20%D0%BC%D0%B0%D0%BB%D0%B5%D0%BD%D1%8C%D0%BA%D0%BE%D0%B5.png"
                alt="SkyCodec Logo" 
                className="logo"
              />
            </div>
            <div className="tagline-wrapper">
              <Sparkles className="sparkle-icon" size={18} />
              <p className="tagline">Next-Generation Data Compression Technology</p>
              <Sparkles className="sparkle-icon" size={18} />
            </div>
          </div>
          
          <div className="header-actions">
            <Button
              onClick={handleContactClick}
              className="contact-btn"
              variant="outline"
              data-testid="contact-button"
            >
              <Mail size={18} />
              Contact
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="get-in-touch-btn"
                  data-testid="get-in-touch-button"
                >
                  <Send size={18} />
                  Get in Touch
                </Button>
              </DialogTrigger>
              <DialogContent className="contact-dialog">
                <DialogHeader>
                  <DialogTitle>Get in Touch</DialogTitle>
                  <DialogDescription>
                    Fill out the form below and we'll get back to you soon.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFormSubmit} className="contact-form">
                  <div className="form-field">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder="Your name"
                      required
                      data-testid="contact-form-name"
                    />
                  </div>
                  
                  <div className="form-field">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="your.email@example.com"
                      required
                      data-testid="contact-form-email"
                    />
                  </div>
                  
                  <div className="form-field">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleFormChange}
                      placeholder="Your company name"
                      data-testid="contact-form-company"
                    />
                  </div>
                  
                  <div className="form-field">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleFormChange}
                      placeholder="Tell us about your needs..."
                      rows={4}
                      required
                      data-testid="contact-form-message"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="submit-btn"
                    data-testid="contact-form-submit"
                  >
                    <Send size={18} />
                    Send Message
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Sky Codec</h1>
          <p className="hero-description">
            A unique data compression and decompression algorithm that allows you to store, retrieve, 
            and transfer any data file, without a loss, regardless of the file type or size, using only 
            a fraction of your computing and storage resources.
          </p>
        </div>
      </section>

      {/* Main Content - Two Column Layout */}
      <main className="skycodec-main-grid">
        {/* Left Column: Workflow Stages */}
        <div className="workflow-column">
          <h2 className="workflow-title">How SkyCodec Works</h2>
          <div className="stages-list">
            {WORKFLOW_STAGES.map((stage) => (
              <div
                key={stage.id}
                className={`stage-item ${
                  currentStage >= stage.id ? "active" : ""
                } ${currentStage === stage.id ? "current" : ""}`}
                data-testid={`workflow-stage-${stage.id}`}
              >
                <div className="stage-indicator">
                  <div className="stage-number">
                    {currentStage > stage.id ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      stage.id
                    )}
                  </div>
                </div>
                <div className="stage-info">
                  <h3 className="stage-title">{stage.title}</h3>
                  <p className="stage-description">{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Upload Area */}
        <div className="upload-column">
          <div
            className={`upload-zone ${
              isDragging ? "dragging" : ""
            } ${isProcessing ? "processing" : ""} ${compressionResult ? "completed" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isProcessing && !compressionResult && fileInputRef.current?.click()}
            data-testid="upload-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              style={{ display: "none" }}
              disabled={isProcessing || !!compressionResult}
              data-testid="file-input"
            />
            
            {!selectedFile && (
              <>
                <div className="upload-icon-wrapper">
                  <Upload className="upload-icon" size={56} />
                </div>
                <h3 className="upload-title">Drop your file here</h3>
                <p className="upload-subtitle">or click to browse</p>
                <div className="file-limit-badge">Maximum file size: 10 MB</div>
              </>
            )}

            {selectedFile && !compressionResult && (
              <>
                <div className="file-info">
                  <div className="check-icon-wrapper">
                    <CheckCircle2 className="check-icon" size={56} />
                  </div>
                  <h3 className="file-name">{selectedFile.name}</h3>
                  <p className="file-size-label">{formatFileSize(selectedFile.size)}</p>
                  {isProcessing && (
                    <div className="processing-indicator">
                      <div className="spinner"></div>
                      <p>Processing...</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {compressionResult && (
              <>
                <div className="compression-result">
                  <div className="success-icon-wrapper">
                    <CheckCircle2 className="success-icon" size={64} />
                  </div>
                  <h3 className="success-title">Compression Complete!</h3>
                  
                  <div className="result-stats">
                    <div className="stat">
                      <span className="label">Original Size</span>
                      <span className="value">{formatFileSize(compressionResult.original_size)}</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat">
                      <span className="label">Compressed Size</span>
                      <span className="value">{formatFileSize(compressionResult.compressed_size)}</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat highlight">
                      <span className="label">Compression Ratio</span>
                      <span className="value">{(compressionResult.compression_ratio * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="sky-file-info">
                    <div className="sky-file-icon">
                      <CheckCircle2 size={32} />
                    </div>
                    <div className="sky-file-details">
                      <p className="sky-file-name">
                        {compressionResult.original_name.replace(/\.[^/.]+$/, "")}.sky
                      </p>
                      <p className="sky-file-size">
                        {formatFileSize(compressionResult.compressed_size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="action-buttons">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload();
                      }}
                      className="download-btn"
                      size="lg"
                      data-testid="download-button"
                    >
                      <Download size={20} />
                      Download .sky File
                    </Button>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        resetUpload();
                      }}
                      variant="outline"
                      className="reset-btn"
                      data-testid="reset-button"
                    >
                      Compress Another File
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="skycodec-footer">
        <p>© 2025 SkyCodec. Revolutionary compression technology.</p>
      </footer>
    </div>
  );
};

export default SkyCodecPage;
