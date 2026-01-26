# Multilingual Vendor Assistant

A voice-first web application for local vendors and customers to communicate across languages and access city-wide price information.

## Features

### 1. Multilingual Communication
- **Voice Input**: Tap mic button and speak in Hindi, English, or Tamil
- **Real-time Translation**: Messages translated between selected languages
- **Voice Output**: Responses spoken back to user
- **Text Fallback**: Type messages if preferred

### 2. Price Information System
- **Voice Queries**: Ask "Aaj aloo ka rate kya hai?" or "What's the price of onions?"
- **City-wide Rates**: Get standardized city-level prices
- **Common Items**: Vegetables, fruits, grains with ₹/kg pricing
- **Instant Responses**: Simple, conversational price information

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open browser to `http://localhost:3000`

4. Select your languages and start speaking or typing!

## Usage Examples

- **Price Queries**: "Aaj aloo ka rate kya hai?" → "आज शहर में आलू का रेट लगभग ₹24–26 प्रति kg है।"
- **Greetings**: "Namaste" → "Hello" (with voice output)
- **Quick Examples**: Use the preset buttons for common queries

## Supported Languages
- Hindi (हिंदी)
- English
- Tamil (தமிழ்)

## Voice Features
- Browser-based speech recognition
- Text-to-speech responses
- Works offline for basic functionality
- Optimized for mobile devices