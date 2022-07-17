import { useEffect, useState } from 'react';

export const useAudio = (src: string | undefined) => {
    const [audioSrc, setAudioSrc] = useState<HTMLAudioElement>();
    useEffect(() => {
      const createdAudioSrc = new Audio(src);
      if (audioSrc === undefined) {
        setAudioSrc(createdAudioSrc);
      }
    }, [audioSrc])
 
    if (audioSrc) {
      return audioSrc
    }
}