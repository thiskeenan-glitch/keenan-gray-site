export function HeroVideo() {
  return (
    <video
      className="hero-video"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="/media/optimized/home-hero-poster.jpg"
      aria-label="Jim Beam video background"
    >
      <source src="/media/optimized/jim-beam-thumb-video.mp4?v=20260901" type="video/mp4" />
    </video>
  );
}
