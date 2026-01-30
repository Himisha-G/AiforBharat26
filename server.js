const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* -------------------------------
   ✅ Price Data (Hindi + English)
-------------------------------- */
const cityPrices = {
  potato: { hindi: "आलू", price: 25, unit: "kg" },
  onion: { hindi: "प्याज", price: 20, unit: "kg" },
  tomato: { hindi: "टमाटर", price: 32, unit: "kg" },
  rice: { hindi: "चावल", price: 48, unit: "kg" },
  dal: { hindi: "दाल", price: 85, unit: "kg" },
};

/* -------------------------------
   ✅ Detect Item from Message
-------------------------------- */
function detectItem(message) {
  const lower = message.toLowerCase();

  for (let key in cityPrices) {
    const item = cityPrices[key];

    // Match English keyword OR Hindi word
    if (lower.includes(key) || message.includes(item.hindi)) {
      return { key, ...item };
    }
  }
  return null;
}

/* -------------------------------
   ✅ Extract Quantity (like 2 kg)
-------------------------------- */
function extractQuantity(message) {
  const match = message.match(/(\d+)\s*(kg|किलो)/i);
  if (match) {
    return parseInt(match[1]);
  }
  return 1; // Default quantity = 1kg
}

/* -------------------------------
   ✅ Main Bot Reply Function
-------------------------------- */
function botReply(message, lang) {
  const item = detectItem(message);

  if (!item) {
    return lang === "hi"
      ? "माफ़ कीजिए, इस वस्तु की कीमत उपलब्ध नहीं है।"
      : "Sorry, price information for this item is not available.";
  }

  const qty = extractQuantity(message);
  const totalCost = qty * item.price;

  // If user asked for total cost
  if (message.includes("कितना") || message.includes("total") || message.includes("price")) {
    return lang === "hi"
      ? `${qty} किलो ${item.hindi} की कीमत लगभग ₹${totalCost} होगी (₹${item.price}/kg)।`
      : `The cost of ${qty} kg ${item.key} will be around ₹${totalCost} (₹${item.price}/kg).`;
  }

  // Normal rate response
  return lang === "hi"
    ? `आज शहर में ${item.hindi} का रेट लगभग ₹${item.price} प्रति किलो है।`
    : `Today's city rate for ${item.key} is approximately ₹${item.price} per kg.`;
}

/* -------------------------------
   ✅ Socket Connection
-------------------------------- */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("translate-message", (data) => {
  console.log("📩 Received:", data);

  const { message, targetLang } = data;
  const response = botReply(message, targetLang);

  console.log("🤖 Sending reply:", response);

  socket.emit("translation-result", {
    translatedMessage: response,
  });
});


  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/* -------------------------------
   ✅ Start Server
-------------------------------- */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
