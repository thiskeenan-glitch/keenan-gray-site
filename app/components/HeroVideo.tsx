export function HeroVideo() {
  return (
    <video
      className="hero-video"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-label="Toy Gun trailer background"
    >
      <source
        src="/media/optimized/toy-gun-trailer-mobile.mp4?v=20260727"
        type="video/mp4"
        media="(max-width: 767px)"
      />
      <source src="/media/optimized/hero-desktop-muted.mp4?v=20260727" type="video/mp4" />
    </video>
  );
}
