const express = require("express");
const http = require("http");
const cors = require("cors");
const axios = require("axios");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

/* ===========================
   SOCKET.IO SETUP
=========================== */
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ===========================
   DATA.GOV API CONFIG
=========================== */
const API_KEY =
  "579b464db66ec23bdd000001ba43ca3465b84b38675f74a10ca5194c";

const RESOURCE_ID =
  "9ef84268-d588-465a-a308-a864a43d0070";

/* ===========================
   LIVE PRICES API ROUTE
=========================== */
app.get("/live-prices", async (req, res) => {
  try {
    const url =
      `https://api.data.gov.in/resource/${RESOURCE_ID}` +
      `?api-key=${API_KEY}` +
      `&format=json&limit=10`;

    const response = await axios.get(url);

    if (!response.data.records || response.data.records.length === 0) {
      throw new Error("No records found");
    }

    const cleaned = response.data.records.map((item) => ({
      commodity: item.commodity,
      market: item.market,
      state: item.state,
      arrival_date: item.arrival_date,
      modal_price: item.modal_price,
    }));

    res.json(cleaned);
  } catch (err) {
    console.log("❌ Live API Error:", err.message);

    res.json([
      {
        commodity: "Potato (Demo)",
        market: "Azadpur",
        state: "Delhi",
        modal_price: "2500",
      },
      {
        commodity: "Onion (Demo)",
        market: "Lasalgaon",
        state: "Maharashtra",
        modal_price: "2200",
      },
      {
        commodity: "Tomato (Demo)",
        market: "Kolar",
        state: "Karnataka",
        modal_price: "3000",
      },
    ]);
  }
});

/* ===========================
   CHATBOT SOCKET FEATURE
=========================== */
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("translate-message", (data) => {
    let msg = data.message.toLowerCase().trim();

    let reply =
      "🤖 Vendor Assistant: Ask me mandi prices like 'Aloo ka rate?'";

    // ✅ Potato / आलू
    if (
      msg.includes("aloo") ||
      msg.includes("potato") ||
      msg.includes("आलू")
    ) {
      reply = "🥔 Aaj Aloo ka rate approx ₹25/kg hai.";
    }

    // ✅ Onion / प्याज
    else if (
      msg.includes("pyaz") ||
      msg.includes("onion") ||
      msg.includes("प्याज")
    ) {
      reply = "🧅 Aaj Pyaz ka rate approx ₹20/kg hai.";
    }

    // ✅ Tomato / टमाटर
    else if (
      msg.includes("tamatar") ||
      msg.includes("tomato") ||
      msg.includes("टमाटर")
    ) {
      reply = "🍅 Aaj Tamatar ka rate approx ₹32/kg hai.";
    }

    // ✅ Greeting
    else if (
      msg.includes("namaste") ||
      msg.includes("hello") ||
      msg.includes("नमस्ते")
    ) {
      reply = "🙏 Namaste! Main aapko mandi prices aur billing mein help kar sakta hoon.";
    }

    // Send reply back
    socket.emit("translation-result", {
      translatedMessage: reply,
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});


/* ===========================
   START SERVER
=========================== */
const PORT = 3000;
server.listen(PORT, () => {
  console.log("🚀 Server running at http://localhost:3000");
});

/* ===========================
   ✅ BILLING PRICE ROUTE
=========================== */

app.get("/billing-items", async (req, res) => {
  try {
    const url =
      `https://api.data.gov.in/resource/${RESOURCE_ID}` +
      `?api-key=${API_KEY}` +
      `&format=json&limit=20`;

    const response = await axios.get(url);

    if (!response.data.records || response.data.records.length === 0) {
      throw new Error("No live records");
    }

    // Extract only useful items
    const items = response.data.records.slice(0, 8).map((item) => ({
      name: item.commodity,
      price: item.modal_price, // Govt mandi price
      market: item.market,
      state: item.state,
    }));

    res.json(items);

  } catch (err) {
    console.log("❌ Billing API Error:", err.message);

    // ✅ Fallback Demo Prices
    res.json([
      { name: "Potato", price: 2500 },
      { name: "Onion", price: 2200 },
      { name: "Tomato", price: 3000 },
      { name: "Rice", price: 4800 },
      { name: "Dal", price: 8500 },
    ]);
  }
});
