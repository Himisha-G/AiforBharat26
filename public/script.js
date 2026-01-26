class VendorAssistant {
    constructor() {
        this.socket = io();
        this.isListening = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupSpeechRecognition();
        this.setupSocketListeners();
    }

    initializeElements() {
        this.micBtn = document.getElementById('micBtn');
        this.textInput = document.getElementById('textInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatDisplay = document.getElementById('chatDisplay');
        this.sourceLang = document.getElementById('sourceLang');
        this.targetLang = document.getElementById('targetLang');
        this.listeningIndicator = document.getElementById('listeningIndicator');
    }

    setupEventListeners() {
        this.micBtn.addEventListener('click', () => this.toggleListening());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Quick example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.getAttribute('data-text');
                this.textInput.value = text;
                this.sendMessage();
            });
        });
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateMicButton();
                this.listeningIndicator.classList.remove('hidden');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.textInput.value = transcript;
                this.sendMessage();
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateMicButton();
                this.listeningIndicator.classList.add('hidden');
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                this.updateMicButton();
                this.listeningIndicator.classList.add('hidden');
            };
        } else {
            console.warn('Speech recognition not supported');
            this.micBtn.style.display = 'none';
        }
    }

    setupSocketListeners() {
        this.socket.on('translation-result', (data) => {
            this.displayMessage(data.originalMessage, 'user');
            this.displayMessage(data.translatedMessage, data.isPrice ? 'price' : 'assistant');
            
            // Speak the response if synthesis is available
            this.speakText(data.translatedMessage);
        });
    }

    toggleListening() {
        if (!this.recognition) return;
        
        if (this.isListening) {
            this.recognition.stop();
        } else {
            // Set language for recognition
            const langCode = this.sourceLang.value;
            this.recognition.lang = this.getRecognitionLang(langCode);
            this.recognition.start();
        }
    }

    getRecognitionLang(langCode) {
        const langMap = {
            'hi': 'hi-IN',
            'en': 'en-US',
            'ta': 'ta-IN'
        };
        return langMap[langCode] || 'en-US';
    }

    updateMicButton() {
        if (this.isListening) {
            this.micBtn.classList.add('listening');
            this.micBtn.querySelector('.mic-text').textContent = 'Listening...';
        } else {
            this.micBtn.classList.remove('listening');
            this.micBtn.querySelector('.mic-text').textContent = 'Tap to Speak';
        }
    }

    sendMessage() {
        const message = this.textInput.value.trim();
        if (!message) return;

        const sourceLang = this.sourceLang.value;
        const targetLang = this.targetLang.value;

        // Clear welcome message on first interaction
        const welcomeMsg = this.chatDisplay.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        // Send to server for translation/processing
        this.socket.emit('translate-message', {
            message,
            sourceLang,
            targetLang
        });

        this.textInput.value = '';
    }

    displayMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = text;
        
        this.chatDisplay.appendChild(messageDiv);
        this.chatDisplay.scrollTop = this.chatDisplay.scrollHeight;
    }

    speakText(text) {
        if (!this.synthesis) return;
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        const targetLang = this.targetLang.value;
        
        // Set voice language
        utterance.lang = this.getVoiceLang(targetLang);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        this.synthesis.speak(utterance);
    }

    getVoiceLang(langCode) {
        const langMap = {
            'hi': 'hi-IN',
            'en': 'en-US',
            'ta': 'ta-IN'
        };
        return langMap[langCode] || 'en-US';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VendorAssistant();
});