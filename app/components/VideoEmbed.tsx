import type { VideoEmbed as VideoEmbedType } from "../data";

export function VideoEmbed({ embed }: { embed: VideoEmbedType }) {
  const src =
    embed.provider === "youtube"
      ? `https://www.youtube.com/embed/${embed.id}`
      : `https://player.vimeo.com/video/${embed.id}`;

  return (
    <div className="video-shell">
      <iframe
        src={src}
        title={embed.title}
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
