export default function Loading() {
  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center"
      style={{ backgroundColor: '#060E1A' }}
    >
      {/* Spinner animé — style Kinzola */}
      <div className="relative w-16 h-16 mb-6">
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            border: '3px solid rgba(43, 127, 255, 0.15)',
            borderTopColor: '#2B7FFF',
          }}
        />
        <div
          className="absolute inset-2 rounded-full animate-spin"
          style={{
            border: '3px solid rgba(255, 77, 141, 0.15)',
            borderTopColor: '#FF4D8D',
            animationDirection: 'reverse',
            animationDuration: '0.8s',
          }}
        />
      </div>

      <p
        className="text-sm font-medium animate-pulse"
        style={{ color: 'rgba(255, 255, 255, 0.5)' }}
      >
        Chargement...
      </p>
    </div>
  );
}
