import { NOTIFICATION_VOLUME } from "@/constants";

let audioInstance: HTMLAudioElement | null = null;

export const playNotificationSound = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      if (!audioInstance) {
        audioInstance = new Audio("./notification.wav");
      }
      audioInstance.currentTime = 0;
      audioInstance.volume = NOTIFICATION_VOLUME;

      let resolved = false;
      const onDone = () => {
        if (!resolved) {
          resolved = true;
          if (audioInstance) {
            audioInstance.onended = null;
            audioInstance.onerror = null;
          }
          resolve();
        }
      };

      audioInstance.onended = onDone;
      audioInstance.onerror = onDone;

      setTimeout(onDone, 2000);

      audioInstance.play().catch((err) => {
        console.warn("Could not play notification sound:", err);
        onDone();
      });
    } catch (error) {
      console.error("Failed to initialize notification audio:", error);
      resolve();
    }
  });
};
