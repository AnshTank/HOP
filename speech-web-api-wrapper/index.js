const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export const getSpeechRecognizer = () => {
  if (!SpeechRecognition) {
    throw new Error("Speech Recognition not supported in this browser.");
  }
  return new SpeechRecognition();
};
