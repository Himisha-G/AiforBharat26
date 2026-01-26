const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock price data for common items
const cityPrices = {
  'aloo': { name: 'आलू', price: '24-26', unit: 'kg' },
  'potato': { name: 'आलू', price: '24-26', unit: 'kg' },
  'pyaz': { name: 'प्याज', price: '18-22', unit: 'kg' },
  'onion': { name: 'प्याज', price: '18-22', unit: 'kg' },
  'tamatar': { name: 'टमाटर', price: '30-35', unit: 'kg' },
  'tomato': { name: 'टमाटर', price: '30-35', unit: 'kg' },
  'chawal': { name: 'चावल', price: '45-50', unit: 'kg' },
  'rice': { name: 'चावल', price: '45-50', unit: 'kg' },
  'dal': { name: 'दाल', price: '80-90', unit: 'kg' },
  'lentils': { name: 'दाल', price: '80-90', unit: 'kg' }
};

// Mock translation function (in real app, use Google Translate API)
function translateText(text, targetLang) {
  // Simple mock translations for demo
  const translations = {
    'hi': {
      'Hello': 'नमस्ते',
      'How can I help you?': 'मैं आपकी कैसे मदद कर सकता हूं?',
      'Price today is': 'आज की कीमत है'
    },
    'en': {
      'नमस्ते': 'Hello',
      'आज': 'today',
      'कीमत': 'price'
    }
  };
  
  return translations[targetLang]?.[text] || text;
}

// Price query handler
function handlePriceQuery(message, lang = 'hi') {
  const lowerMessage = message.toLowerCase();
  
  for (const [key, item] of Object.entries(cityPrices)) {
    if (lowerMessage.includes(key)) {
      if (lang === 'hi') {
        return `आज शहर में ${item.name} का रेट लगभग ₹${item.price} प्रति ${item.unit} है।`;
      } else {
        return `Today's city rate for ${key} is approximately ₹${item.price} per ${item.unit}.`;
      }
    }
  }
  
  if (lang === 'hi') {
    return 'माफ करें, इस वस्तु की कीमत उपलब्ध नहीं है।';
  } else {
    return 'Sorry, price information for this item is not available.';
  }
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('translate-message', (data) => {
    const { message, sourceLang, targetLang } = data;
    
    // Check if it's a price query
    const priceResponse = handlePriceQuery(message, targetLang);
    if (priceResponse !== 'Sorry, price information for this item is not available.' && 
        priceResponse !== 'माफ करें, इस वस्तु की कीमत उपलब्ध नहीं है।') {
      socket.emit('translation-result', {
        originalMessage: message,
        translatedMessage: priceResponse,
        isPrice: true
      });
      return;
    }
    
    // Regular translation
    const translated = translateText(message, targetLang);
    socket.emit('translation-result', {
      originalMessage: message,
      translatedMessage: translated,
      isPrice: false
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});