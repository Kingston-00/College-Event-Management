export default function Loader({ label = 'Loading...', fullPage = false }) {
  return (
    <div className={`loader-wrap ${fullPage ? 'loader-full' : ''}`} role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span className="loader-label">{label}</span>
    </div>
  );
}
