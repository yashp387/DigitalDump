const mongoose = require("mongoose");

const videoSuggestionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    youtubeVideoId: {
      // Store only the ID (e.g., 'dQw4w9WgXcQ')
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    // You could add category, duration etc. later
  },
  {
    timestamps: true,
  }
);

// Virtual property to construct the full YouTube watch URL
videoSuggestionSchema.virtual("youtubeUrl").get(function () {
  // 'this' refers to the document instance
  return `https://www.youtube.com/watch?v=${this.youtubeVideoId}`;
});

// --- NEW ---
// Virtual property to construct a standard thumbnail URL
videoSuggestionSchema.virtual("thumbnailUrl").get(function () {
  // Using 'hqdefault.jpg' (480x360). You can change this to:
  // 'mqdefault.jpg' (320x180)
  // 'sddefault.jpg' (640x480)
  // 'maxresdefault.jpg' (best available, might not always exist)
  return `https://img.youtube.com/vi/${this.youtubeVideoId}/hqdefault.jpg`;
});
// --- END NEW ---

// Ensure virtual properties are included when converting documents to JSON or Objects
// This is crucial for the virtuals to show up in your API responses!
videoSuggestionSchema.set("toJSON", { virtuals: true });
videoSuggestionSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("VideoSuggestion", videoSuggestionSchema);