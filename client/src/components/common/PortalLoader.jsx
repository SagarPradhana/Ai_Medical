function PortalLoader({
  title = "Loading Portal",
  subtitle = "Preparing your secure healthcare workspace..."
}) {
  return (
    <div className="portal-loader-wrap" role="status" aria-live="polite">
      <div className="portal-loader-card">
        <div className="portal-loader-mark">
          <div className="portal-loader-ring" />
          <div className="portal-loader-core">AI</div>
        </div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="portal-loader-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export default PortalLoader;
