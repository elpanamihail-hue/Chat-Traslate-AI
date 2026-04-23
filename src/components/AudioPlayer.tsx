import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface Props {
  url: string;
  duration?: number;
  isMine: boolean;
}

export default function AudioPlayer({ url, duration, isMine }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onLoadedMetadata = () => {
      if (!duration) setTotalDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.pause();
    };
  }, [url]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 py-2 px-1 min-w-[200px]">
      <button 
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isMine ? 'bg-white/20 text-white' : 'bg-w-accent text-w-bg'
        }`}
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <div className="h-1 flex-1 bg-black/20 rounded-full overflow-hidden relative">
          <div 
            className={`absolute inset-y-0 left-0 transition-all duration-100 ${
              isMine ? 'bg-white' : 'bg-w-accent'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono opacity-60">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5" />
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
