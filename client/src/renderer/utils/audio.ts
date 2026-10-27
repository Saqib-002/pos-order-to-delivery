import { NOTIFICATION_VOLUME } from "@/constants";

let audioInstance: HTMLAudioElement | null = null;

// Resolves true when the sound actually started playing, false if it couldn't
// (missing file, audio device error, playback blocked)
export const playNotificationSound = (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      if (!audioInstance) {
        audioInstance = new Audio("./notification.wav");
      }
      audioInstance.currentTime = 0;
      audioInstance.volume = NOTIFICATION_VOLUME;

      let resolved = false;
      let started = false;
      const onDone = () => {
        if (!resolved) {
          resolved = true;
          if (audioInstance) {
            audioInstance.onended = null;
            audioInstance.onerror = null;
          }
          resolve(started);
        }
      };

      audioInstance.onended = onDone;
      audioInstance.onerror = onDone;

      setTimeout(onDone, 5000);

      audioInstance
        .play()
        .then(() => {
          started = true;
        })
        .catch((err) => {
          console.warn("Could not play notification sound:", err);
          onDone();
        });
    } catch (error) {
      console.error("Failed to initialize notification audio:", error);
      resolve(false);
    }
  });
};
