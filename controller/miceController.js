const { add, Mice } = require("../Models/Mice");
const cloudinary = require("../cloudinary/cloudinary");
const fs = require("fs");

const createMouse = async (req, res) => {
  try {
    const data = req.body;

    let imageUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "mice",
      });

      imageUrl = result.secure_url.replace(
        "/upload/",
        "/upload/f_auto,q_auto/"
      );

      fs.unlinkSync(req.file.path);
    }

    const mouseData = {
      image: imageUrl,
      brand: data.brand,
      model: data.model,
      sizeCategory: data.sizeCategory,
      shapeCategory: data.shapeCategory,
      sensor: data.sensor,
      connectivity: data.connectivity,
      software: data.software,
      switches: data.switches,
      scrollWheel: data.scrollWheel,
      material: data.material,
      weight: Number(data.weight),
      batteryMah: data.batteryMah || "",
      coating: data.coating === "true",
      mcu: data.mcu || "",
      batteryLife: data.batteryLife || "",

      colors: data.colors ? JSON.parse(data.colors) : [],

      gripStyles: data.gripStyles ? JSON.parse(data.gripStyles) : [],

      dimensions: {
        width: Number(data.width),
        height: Number(data.height),
        length: Number(data.length),
      },

      performance: {
        dpi: Number(data.dpi),
        pollingRate: Number(data.pollingRate),
        trackingSpeed: Number(data.trackingSpeed),
        acceleration: Number(data.acceleration),
      },

      affiliateLink: {
        amazon: data.amazon || "",
        aliExpress: data.aliExpress || "",
      },
    };

    const mouse = await add(mouseData);

    res.status(201).json({
      message: "Mouse created successfully",
      mouse,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error creating mouse",
    });
  }
};

const getAllMice = async (req, res) => {
  try {
    const { search } = req.query;

    const filters = {};

    if (search && search.trim()) {
      filters.$or = [
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
      ];
    }

    const mice = await Mice.find(filters).limit(10);

    res.status(200).json(mice);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch mice",
      error: error.message,
    });
  }
};


module.exports = { createMouse, getAllMice };