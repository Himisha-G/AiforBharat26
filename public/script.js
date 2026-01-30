class VendorAssistant {
  constructor() {
    this.socket = io("http://localhost:3000");
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
    this.listeningIndicator = document.getElementById("listeningIndicator");
  }

  setupEventListeners() {
    this.micBtn.addEventListener("click", () => this.toggleListening());

    this.sendBtn.addEventListener("click", () => this.sendMessage());

    this.textInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });

    document.querySelectorAll(".example-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-text");
        this.textInput.value = text;
        this.sendMessage();
      });
    });
  }

  setupSpeechRecognition() {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateMicButton();
        this.listeningIndicator.classList.remove("hidden");
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.textInput.value = transcript;
        this.sendMessage();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateMicButton();
        this.listeningIndicator.classList.add("hidden");
      };

      this.recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        this.isListening = false;
        this.updateMicButton();
        this.listeningIndicator.classList.add("hidden");
      };
    } else {
      console.warn("Speech recognition not supported");
      this.micBtn.style.display = "none";
    }
  }

  setupSocketListeners() {
  console.log("✅ Socket connected:", this.socket);

  this.socket.on("connect", () => {
    console.log("🟢 Connected to server:", this.socket.id);
  });

  this.socket.on("translation-result", (data) => {
    console.log("🤖 Reply received:", data);

    this.displayMessage(data.translatedMessage, "assistant");
    this.speakText(data.translatedMessage);
  });
}


  sendMessage() {
    const message = this.textInput.value.trim();
    if (!message) return;

    const sourceLang = this.sourceLang.value;
    const targetLang = this.targetLang.value;

    // Remove welcome message
    const welcomeMsg = this.chatDisplay.querySelector(".welcome-message");
    if (welcomeMsg) welcomeMsg.remove();

    // ✅ Show user message immediately
    this.displayMessage(message, "user");

    // ✅ Send to backend
    this.socket.emit("translate-message", {
      message,
      sourceLang,
      targetLang,
    });

    this.textInput.value = "";
  }

  displayMessage(text, type) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;

    this.chatDisplay.appendChild(messageDiv);
    this.chatDisplay.scrollTop = this.chatDisplay.scrollHeight;
  }

  toggleListening() {
    if (!this.recognition) return;

    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.lang = this.getRecognitionLang(this.sourceLang.value);
      this.recognition.start();
    }
  }

  getRecognitionLang(langCode) {
    const langMap = {
      hi: "hi-IN",
      en: "en-US",
      ta: "ta-IN",
    };
    return langMap[langCode] || "en-US";
  }

  updateMicButton() {
    if (this.isListening) {
      this.micBtn.classList.add("listening");
      this.micBtn.querySelector(".mic-text").textContent = "Listening...";
    } else {
      this.micBtn.classList.remove("listening");
      this.micBtn.querySelector(".mic-text").textContent = "Tap to Speak";
    }
  }

  speakText(text) {
    if (!this.synthesis) return;

    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.getVoiceLang(this.targetLang.value);

    const voiceEnabled = document.getElementById("voiceToggle").checked;
    if (voiceEnabled) {
        this.synthesis.speak(utterance);
    }

  }

  getVoiceLang(langCode) {
    const langMap = {
      hi: "hi-IN",
      en: "en-US",
      ta: "ta-IN",
    };
    return langMap[langCode] || "en-US";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new VendorAssistant();
});

function downloadChat() {
  let chatText = "";
  document.querySelectorAll(".message").forEach((msg) => {
    chatText += msg.innerText + "\n";
  });

  const blob = new Blob([chatText], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "vendor_chat_history.txt";
  link.click();
}
