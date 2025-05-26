require('dotenv').config();
const express = require("express");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
const MAILCHIMP_DC = process.env.MAILCHIMP_DC;

app.post("/api/subscribe", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required." });
  }

  const url = `https://${MAILCHIMP_DC}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/`;

  const data = {
    email_address: email,
    status: "subscribed",
    merge_fields: { FNAME: name },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.status === 200 || response.status === 201) {
      return res.json({ message: "Subscription successful!" });
    } else if (response.status === 400 && result.title === "Member Exists") {
      return res.status(400).json({ message: "You're already subscribed." });
    } else {
      return res.status(400).json({ message: "Subscription failed. Please try again." });
    }
  } catch (error) {
    console.error("Mailchimp error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
