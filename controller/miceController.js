const { add, Mice } = require("../Models/Mice");
const cloudinary = require("../cloudinary/cloudinary");
const fs = require("fs");

const createMouse = async (req, res) => {
  try {
    const data = req.body;

    let imageUrl = "";

    const parsedColors = data.colors ? JSON.parse(data.colors) : [];

    if (req.file) {
      if (!req.file.path) {
        return res.status(400).json({
          message: "Image upload failed. File path is missing.",
        });
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "mice",
      });

      imageUrl = result.secure_url.replace(
        "/upload/",
        "/upload/f_auto,q_auto/"
      );

      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    let colors = [];
    let gripStyles = [];

    try {
      colors = data.colors ? JSON.parse(data.colors) : [];
    } catch {
      return res.status(400).json({
        message: "Invalid colors format",
      });
    }

    try {
      gripStyles = data.gripStyles ? JSON.parse(data.gripStyles) : [];
    } catch {
      return res.status(400).json({
        message: "Invalid gripStyles format",
      });
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
      colors: parsedColors
    .map((color) => ({
      mode: color.mode === "ombre" ? "ombre" : "static",
      values: Array.isArray(color.values)
        ? color.values.filter((item) => item && item.trim() !== "")
        : [],
    }))
    .filter((color) => {
      if (color.mode === "static") {
        return color.values.length >= 1;
      }

      if (color.mode === "ombre") {
        return color.values.length >= 2;
      }

      return false;
    }),
      gripStyles,
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
    console.log("CREATE MOUSE ERROR:", error);
    res.status(500).json({
      message: "Error creating mouse",
      error: error.message,
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

const recommendMouse = async (req, res) => {
  try {
    const {
      grip,
      sizeCategory,
      sizeCategoryFingertip,
      shape,
      weight,
    } = req.query;

    const mice = await Mice.find({});

    const scoredMice = mice.map((mouse) => {
      let points = 0;

      // Grip
      if (grip && Array.isArray(mouse.gripStyles) && mouse.gripStyles.includes(grip)) {
        points += 1;
      }

      // Size for normal grip flow
      if (sizeCategory) {
        if (mouse.sizeCategory === sizeCategory) {
          points += 1;
        }
      }

      // Size for fingertip flow
      if (sizeCategoryFingertip) {
        if (sizeCategoryFingertip === "true_fingertip") {
          // usually the smallest mice
          if (mouse.sizeCategory === "small") {
            points += 1;
          }
        } else if (sizeCategoryFingertip === "compact_fingertip") {
          // small or medium can work here
          if (mouse.sizeCategory === "small" || mouse.sizeCategory === "medium") {
            points += 1;
          }
        } else if (sizeCategoryFingertip === "balanced_fingertip") {
          if (mouse.sizeCategory === "medium") {
            points += 1;
          }
        }
      }

      // Shape
      if (shape && shape !== "no_preference") {
        if (mouse.shapeCategory === shape) {
          points += 1;
        }
      }

      // Weight
      if (weight) {
        const mouseWeight = Number(mouse.weight);

        if (weight === "ultralight" && mouseWeight <= 45) {
          points += 1;
        } else if (weight === "light" && mouseWeight > 45 && mouseWeight <= 60) {
          points += 1;
        } else if (weight === "balanced" && mouseWeight > 60) {
          points += 1;
        }
      }

      return {
        ...mouse.toObject(),
        points,
      };
    });

    const recommended = scoredMice
      .filter((mouse) => mouse.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);

    res.status(200).json({recommended});
  } catch (error) {
    res.status(500).json({
      message: "Failed to recommend mouse",
      error: error.message,
    });
  }
};

module.exports = { createMouse, getAllMice, recommendMouse };