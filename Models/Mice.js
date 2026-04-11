const mongoose = require("mongoose");

const miceSchema = new mongoose.Schema(
  {
    image: { type: String },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },

    sizeCategory: {
      type: String,
      enum: ["small", "medium", "large"],
      required: true,
    },

    dimensions: {
      width: { type: Number, required: true },  
      height: { type: Number, required: true },  
      length: { type: Number, required: true },  
    },

    weight: { type: Number, required: true }, 

    shapeCategory: {
      type: String,
      enum: ["symmetrical", "asymmetrical"],
      required: true,
    },

    gripStyles: [
      {
        type: String,
        enum: ["palm", "claw", "aggressive claw", "relaxed claw", "fingertip"],
      },
    ],

    sensor: { type: String, required: true, trim: true },

    connectivity: {
      type: String,
      enum: ["wired", "wireless"],
      required: true,
    },
    
    mcu: { type: String },

    software: {
      type: String,
      enum: ["web", "download", "web and download"],
    },

    performance: {
      dpi: { type: Number, required: true },
      pollingRate: { type: Number, required: true }, 
      trackingSpeed: { type: Number, required: true }, 
      acceleration: { type: Number, required: true }, 
    },
  
    
    batteryMah: { type: Number, required: true },
    batteryLife: { type: String },

    switches: { type: String, required: true, trim: true },
    scrollWheel: { type: String, required: true, trim: true },

    material: { type: String, trim: true },

    coating: { type: Boolean, default: false },
    colors: [String],
    affiliateLink: {
      amazon: {type: String},
      aliExpress: {type: String},
    }
  },
  { timestamps: true }
);

const Mice = mongoose.model("Mice", miceSchema);

const add = (data) => {
    const mouse = new Mice(data);
    return mouse.save();
}


module.exports = { add, Mice };
