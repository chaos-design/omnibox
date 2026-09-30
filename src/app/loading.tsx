export default function Loading() {
  return (
    <div
      aria-label="页面加载中"
      style={{
        display: 'grid',
        minHeight: '50vh',
        placeItems: 'center',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
      }}
    >
      LOADING MODULE...
    </div>
  );
}
