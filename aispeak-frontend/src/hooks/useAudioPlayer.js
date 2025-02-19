import { ref, watch, onBeforeUnmount } from 'vue';

export function useAudioPlayer(audioList, playbackRate = 1.0) {
  const currentTrackIndex = ref(-1); // 当前播放的音频索引
  const currentAudio = ref(null); // 当前音频对象
  const isAudioPlaying = ref(false); // 是否正在播放

  // 播放器控制
  const togglePlay = () => {
    if (!currentAudio.value) return;
    if (isAudioPlaying.value) {
      currentAudio.value.pause();
    } else {
      currentAudio.value.play();
    }
    isAudioPlaying.value = !isAudioPlaying.value;
  };

  const play = (index = 0, onPlayStart, onPlaybackComplete) => {
    if (index < 0 || index >= audioList.length) return;

    if (currentAudio.value) {
      currentAudio.value.pause();
      currentAudio.value.removeEventListener('ended', handleEnded);
      currentAudio.value.removeEventListener('error', handleError);
      currentAudio.value.removeEventListener('play', handlePlay);
    }

    currentTrackIndex.value = index;
    currentAudio.value = new Audio(audioList[index]);
    currentAudio.value.playbackRate = playbackRate;

    // 监听播放开始事件
    currentAudio.value.addEventListener('play', () => {
      if (onPlayStart) onPlayStart();
    });

    // 监听播放结束事件
    currentAudio.value.addEventListener('ended', () => {
      handleEnded();
      if (onPlaybackComplete) onPlaybackComplete();
    });

    // 监听播放错误事件
    currentAudio.value.addEventListener('error', (error) => {
      handleError(error);
      if (onPlaybackComplete) onPlaybackComplete();
    });

    isAudioPlaying.value = true;
    currentAudio.value.play();
  };

  const playNext = (onPlayStart, onPlaybackComplete) => {
    if (currentTrackIndex.value < audioList.length - 1) {
      play(currentTrackIndex.value + 1, onPlayStart, onPlaybackComplete);
    }
  };

  const playPrev = (onPlayStart, onPlaybackComplete) => {
    if (currentTrackIndex.value > 0) {
      play(currentTrackIndex.value - 1, onPlayStart, onPlaybackComplete);
    }
  };

  const handleEnded = () => {
    playNext();
  };

  const handleError = (error) => {
    console.error('音频播放错误:', error);
    playNext(); // 出错时自动播下一首
  };

  const handleRateChange = () => {
    if (currentAudio.value) {
      currentAudio.value.playbackRate = playbackRate;
    }
  };

  // 监听 playbackRate 变化
  watch(
    () => playbackRate,
    (newVal) => {
      handleRateChange();
    }
  );

  // 组件卸载时清理
  onBeforeUnmount(() => {
    if (currentAudio.value) {
      currentAudio.value.pause();
      currentAudio.value.removeEventListener('ended', handleEnded);
      currentAudio.value.removeEventListener('error', handleError);
      currentAudio.value.removeEventListener('play', handlePlay);
    }
  });

  return {
    currentTrackIndex,
    isAudioPlaying,
    togglePlay,
    play,
    playNext,
    playPrev,
  };
}