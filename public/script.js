class VendorAssistant {
  constructor() {
    this.socket = io(); // ✅ Correct (no localhost hardcode)

    this.isListening = false;
    this.recognition = null;
    this.synthesis = window.speechSynthesis;

    this.initializeElements();
    this.setupEventListeners();
    this.setupSpeechRecognition();
    this.setupSocketListeners();
  }

  initializeElements() {
    this.micBtn = document.getElementById("micBtn");
    this.textInput = document.getElementById("textInput");
    this.sendBtn = document.getElementById("sendBtn");
    this.chatDisplay = document.getElementById("chatDisplay");

    this.sourceLang = document.getElementById("sourceLang");
    this.targetLang = document.getElementById("targetLang");

    this.listeningIndicator =
      document.getElementById("listeningIndicator");
  }

  setupEventListeners() {
    if (this.micBtn) {
      this.micBtn.addEventListener("click", () =>
        this.toggleListening()
      );
    }

    this.sendBtn.addEventListener("click", () =>
      this.sendMessage()
    );

    this.textInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });

    // Example buttons optional
    document.querySelectorAll(".example-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-text");
        this.textInput.value = text;
        this.sendMessage();
      });
    });
  }

  /* ===============================
     🎤 SPEECH RECOGNITION FIX
  =============================== */
  setupSpeechRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("❌ SpeechRecognition not supported. Please use Google Chrome.");
    return;
  }

  this.recognition = new SpeechRecognition();

  this.recognition.continuous = false;
  this.recognition.interimResults = false;

  this.recognition.onstart = () => {
    console.log("🎤 Listening started...");
    this.isListening = true;
    this.updateMicButton(true);
  };

  this.recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("✅ You said:", transcript);

    this.textInput.value = transcript;
    this.sendMessage();
  };

  this.recognition.onerror = (event) => {
    console.log("❌ Speech Error:", event.error);
    alert("Mic Error: " + event.error);
  };

  this.recognition.onend = () => {
    console.log("🛑 Listening ended");
    this.isListening = false;
    this.updateMicButton(false);
  };
}


toggleListening() {
  if (!this.recognition) {
    alert("Speech Recognition not supported. Use Chrome.");
    return;
  }

  if (this.isListening) {
    this.recognition.stop();
    return;
  }

  console.log("🎤 Mic clicked, starting...");

  this.recognition.lang = "hi-IN";

  try {
    this.recognition.start();
  } catch (err) {
    console.log("❌ Mic Start Error:", err);
  }
}



  /* ===============================
     ✅ SAFE MIC BUTTON UPDATE
  =============================== */
  updateMicButton(listening) {
  const micText = this.micBtn.querySelector(".mic-text");

  if (listening) {
    this.micBtn.classList.add("listening");
    micText.innerText = "Listening...";
  } else {
    this.micBtn.classList.remove("listening");
    micText.innerText = "Tap to Speak";
  }
}


  /* ===============================
     ✅ SOCKET LISTENER
  =============================== */
  setupSocketListeners() {
    this.socket.on("translation-result", (data) => {
      this.displayMessage(data.translatedMessage, "assistant");
      this.speakText(data.translatedMessage);
    });
  }

  sendMessage() {
    const message = this.textInput.value.trim();
    if (!message) return;

    // Show user message
    this.displayMessage(message, "user");

    // Send to backend
    this.socket.emit("translate-message", { message });

    this.textInput.value = "";
  }

  displayMessage(text, type) {
    const div = document.createElement("div");
    div.className = `message ${type}`;
    div.textContent = text;

    this.chatDisplay.appendChild(div);
    this.chatDisplay.scrollTop = this.chatDisplay.scrollHeight;
  }

  speakText(text) {
    if (!this.synthesis) return;

    // Optional toggle
    const toggle = document.getElementById("voiceToggle");
    if (toggle && !toggle.checked) return;

    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    this.synthesis.speak(utterance);
  }
}

/* ===============================
   START APP
=============================== */
document.addEventListener("DOMContentLoaded", () => {
  new VendorAssistant();
});
