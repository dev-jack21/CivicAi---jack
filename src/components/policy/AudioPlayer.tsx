'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Download } from 'lucide-react';
import Select from '@/components/ui/Select';

interface AudioPlayerProps {
  src: string;
  title: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ src, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const seek = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }, []);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
  }, []);

  const jumpToEnd = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = audio.duration;
  }, []);

  const adjustVolume = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVol = Math.max(0, Math.min(1, audio.volume + delta));
    audio.volume = newVol;
    setVolume(newVol);
    if (newVol > 0 && audio.muted) {
      audio.muted = false;
      setMuted(false);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target !== playerRef.current &&
        (target.tagName === 'BUTTON' || target.tagName === 'SELECT' || target.tagName === 'INPUT')
      )
        return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'Home':
          e.preventDefault();
          restart();
          break;
        case 'End':
          e.preventDefault();
          jumpToEnd();
          break;
      }
    },
    [togglePlay, seek, adjustVolume, toggleMute, restart, jumpToEnd]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);
    const onVolumeChange = () => {
      setVolume(audio.volume);
      setMuted(audio.muted);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('volumechange', onVolumeChange);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    audio.currentTime = frac * duration;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const controlBtn =
    'inline-flex items-center justify-center min-h-11 min-w-11 gap-1 px-3 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <div
      ref={playerRef}
      className="w-full max-w-full bg-gray-50 border border-border-custom rounded-lg p-4 sm:p-5 space-y-4"
      role="application"
      aria-label={`Audio player for ${title}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Progress bar — taller on mobile for easier touch */}
      <div
        className="relative h-3 sm:h-2 bg-gray-200 rounded-full cursor-pointer group"
        onClick={handleProgressClick}
        role="slider"
        aria-label={`Audio progress: ${formatTime(currentTime)} of ${formatTime(duration)}`}
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={-1}
      >
        <div
          className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
          style={{ width: `${progressPercent}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 sm:w-4 sm:h-4 bg-primary rounded-full shadow sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progressPercent}% - 10px)` }}
        />
      </div>

      {/* Time display */}
      <div className="flex items-center justify-between text-sm sm:text-xs text-text-secondary">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Primary transport controls — large on mobile */}
      <div className="flex items-center justify-center gap-4 sm:gap-3">
        <button onClick={() => seek(-10)} className={controlBtn} aria-label="Rewind 10 seconds">
          <SkipBack className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
          <span className="text-sm sm:text-xs">10s</span>
        </button>

        <button
          onClick={togglePlay}
          className="inline-flex items-center justify-center min-h-[3.25rem] min-w-[3.25rem] sm:min-h-12 sm:min-w-12 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={
            playing ? `Pause audio narration of ${title}` : `Play audio narration of ${title}`
          }
        >
          {playing ? (
            <Pause className="w-6 h-6 sm:w-5 sm:h-5" aria-hidden="true" />
          ) : (
            <Play className="w-6 h-6 sm:w-5 sm:h-5 ml-0.5" aria-hidden="true" />
          )}
        </button>

        <button onClick={() => seek(10)} className={controlBtn} aria-label="Forward 10 seconds">
          <span className="text-sm sm:text-xs">10s</span>
          <SkipForward className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Secondary controls — full-width row on mobile */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 sm:flex-wrap">
        <div className="flex items-center justify-between sm:justify-center gap-2">
          <label htmlFor="speed-select" className="text-sm text-text-secondary shrink-0">
            Speed
          </label>
          <Select
            id="speed-select"
            value={String(playbackRate)}
            onChange={(e) => {
              const rate = parseFloat(e.target.value);
              setPlaybackRate(rate);
              if (audioRef.current) audioRef.current.playbackRate = rate;
            }}
            options={[
              { value: '0.5', label: '0.5x' },
              { value: '1', label: '1x' },
              { value: '1.5', label: '1.5x' },
              { value: '2', label: '2x' },
            ]}
            containerClassName="flex-1 sm:flex-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-1 sm:flex-none">
          <button
            onClick={toggleMute}
            className={controlBtn}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted || volume === 0 ? (
              <VolumeX className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
            ) : (
              <Volume2 className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              const audio = audioRef.current;
              if (!audio) return;
              audio.volume = val;
              audio.muted = val === 0;
              setVolume(val);
              setMuted(val === 0);
            }}
            className="flex-1 sm:w-24 min-h-11 accent-primary"
            aria-label="Volume"
          />
        </div>

        <a
          href={src}
          download
          className={`${controlBtn} justify-center sm:justify-start`}
          aria-label="Download audio"
        >
          <Download className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
          <span className="sm:hidden text-sm">Download</span>
        </a>
      </div>
    </div>
  );
}
