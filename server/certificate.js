exports.generateCertificateHTML = function (data) {
  const { userName, courseTitle, issuedAt, certificateId } = data;
  const date = new Date(issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4 landscape; margin: 0; }
  body { width: 297mm; height: 210mm; font-family: 'Georgia', 'Times New Roman', serif; background: #fff; color: #1a1a2e; }
  .certificate {
    width: 100%; height: 100%; position: relative; padding: 40px;
    background: linear-gradient(135deg, #f8f9ff 0%, #fff 50%, #f0f4ff 100%);
  }
  .border-outer {
    width: 100%; height: 100%; border: 3px solid #1a1a5e; border-radius: 8px; padding: 8px;
  }
  .border-inner {
    width: 100%; height: 100%; border: 1px solid #c4b5a0; border-radius: 4px; padding: 40px 60px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .logo-line {
    font-size: 11px; letter-spacing: 6px; text-transform: uppercase; color: #6366f1; font-weight: 600;
    margin-bottom: 8px; font-family: 'Segoe UI', Arial, sans-serif;
  }
  .title {
    font-size: 42px; font-weight: 700; color: #1a1a5e; margin-bottom: 6px;
    background: linear-gradient(135deg, #1a1a5e, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .subtitle { font-size: 14px; color: #64748b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 30px; }
  .presented { font-size: 13px; color: #94a3b8; margin-bottom: 8px; letter-spacing: 1px; text-transform: uppercase; }
  .name {
    font-size: 36px; font-weight: 700; color: #1a1a2e; margin-bottom: 10px;
    border-bottom: 2px solid #6366f1; padding-bottom: 6px; min-width: 300px; text-align: center;
  }
  .course-label { font-size: 13px; color: #94a3b8; margin-bottom: 6px; letter-spacing: 1px; text-transform: uppercase; }
  .course-name { font-size: 20px; font-weight: 600; color: #334155; margin-bottom: 30px; text-align: center; max-width: 500px; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; width: 100%; margin-top: auto; }
  .footer-item { text-align: center; }
  .footer-line { width: 160px; border-top: 1px solid #cbd5e1; margin-bottom: 6px; }
  .footer-label { font-size: 10px; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; }
  .footer-value { font-size: 12px; color: #475569; margin-bottom: 4px; }
  .cert-id { position: absolute; bottom: 52px; right: 112px; font-size: 9px; color: #cbd5e1; font-family: 'Consolas', monospace; }
  .seal {
    position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%);
    width: 70px; height: 70px; border-radius: 50%; border: 2px solid #6366f1;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: #6366f1; font-weight: 700; text-align: center;
    letter-spacing: 1px; line-height: 1.2;
  }
</style>
</head><body>
<div class="certificate">
  <div class="border-outer">
    <div class="border-inner">
      <div class="logo-line">CareerBuilder Academy</div>
      <div class="title">Certificate of Completion</div>
      <div class="subtitle">Professional Development Achievement</div>
      <div class="presented">This is to certify that</div>
      <div class="name">${esc(userName)}</div>
      <div class="course-label">Has successfully completed the course</div>
      <div class="course-name">${esc(courseTitle)}</div>
      <div class="footer">
        <div class="footer-item">
          <div class="footer-value">${date}</div>
          <div class="footer-line"></div>
          <div class="footer-label">Date of Completion</div>
        </div>
        <div class="footer-item">
          <div class="footer-value">CareerBuilder Platform</div>
          <div class="footer-line"></div>
          <div class="footer-label">Authorized Signature</div>
        </div>
      </div>
      <div class="seal">VERIFIED<br>✓</div>
      <div class="cert-id">ID: ${esc(certificateId)}</div>
    </div>
  </div>
</div>
</body></html>`;
};

function esc(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
