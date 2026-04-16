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
    const {
      search = "",
      brand,
      size,
      shape,
      connectivity,
      sensor,
      material,
      weightMin,
      weightMax,
      sort = "recent",
      page = 1,
      limit = 24,
    } = req.query;

    const filters = {};

    if (search.trim()) {
      const searchWords = search
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      filters.$and = searchWords.map((word) => ({
        $or: [
          { brand: { $regex: word, $options: "i" } },
          { model: { $regex: word, $options: "i" } },
        ],
      }));
    }

    if (brand) {
      filters.brand = { $regex: `^${brand}$`, $options: "i" };
    }

    if (size) {
      filters.sizeCategory = size;
    }

    if (shape) {
      filters.shapeCategory = shape;
    }

    if (connectivity) {
      filters.connectivity = connectivity;
    }

    if (sensor) {
      filters.sensor = { $regex: sensor, $options: "i" };
    }

    if (material) {
      filters.material = { $regex: material, $options: "i" };
    }

    if (weightMin || weightMax) {
      filters.weight = {};
      if (weightMin) filters.weight.$gte = Number(weightMin);
      if (weightMax) filters.weight.$lte = Number(weightMax);
    }

    let sortOption = { createdAt: -1 };

    if (sort === "recent") sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "weight-low") sortOption = { weight: 1 };
    if (sort === "weight-high") sortOption = { weight: -1 };
    if (sort === "dpi-high") sortOption = { "performance.dpi": -1 };
    if (sort === "dpi-low") sortOption = { "performance.dpi": 1 };
    if (sort === "name-asc") sortOption = { brand: 1, model: 1 };
    if (sort === "name-desc") sortOption = { brand: -1, model: -1 };

    const currentPage = Number(page) || 1;
    const perPage = Number(limit) || 24;
    const skip = (currentPage - 1) * perPage;

    const [mice, total] = await Promise.all([
      Mice.find(filters).sort(sortOption).skip(skip).limit(perPage),
      Mice.countDocuments(filters),
    ]);

    res.status(200).json({
      mice,
      total,
      page: currentPage,
      pages: Math.ceil(total / perPage),
    });
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

    let mice = await Mice.find({});

    // Grip filtering
    if (sizeCategoryFingertip === "true fingertip") {
      mice = mice.filter((mouse) =>
        mouse.gripStyles.includes("true fingertip")
      );
    } else if (grip) {
      mice = mice.filter((mouse) =>
        mouse.gripStyles.includes(grip)
      );
    }

    // Shape filtering
    if (shape && shape !== "no_preference") {
      mice = mice.filter((mouse) => mouse.shapeCategory === shape);
    }

    const scoredMice = mice.map((mouse) => {
      let points = 0;

      // Normal size scoring
      if (sizeCategory && mouse.sizeCategory === sizeCategory) {
        points += 1;
      }

      // Grip scoring
      if (grip === "palm") {
        if (
          mouse.gripStyles.includes("palm") &&
          mouse.gripStyles.length === 1
        ) {
          points += 5;
        } else if (mouse.gripStyles.includes("palm")) {
          points += 1;
        }
      }

      if (grip === "fingertip") {
        if (
          mouse.gripStyles.includes("fingertip") &&
          mouse.gripStyles.length === 1
        ) {
          points += 5;
        } else if (mouse.gripStyles.includes("fingertip")) {
          points += 1;
        }
      }

      if (grip === "claw") {
        if (
          mouse.gripStyles.includes("claw") &&
          mouse.gripStyles.length === 1
        ) {
          points += 5;
        } else if (mouse.gripStyles.includes("claw")) {
          points += 1;
        }
      }

      // Fingertip-specific scoring
      if (sizeCategoryFingertip === "true fingertip") {
        if (mouse.gripStyles.includes("true fingertip")) {
          points += 5;
        }
      } else if (sizeCategoryFingertip === "compact_fingertip") {
        if (
          mouse.sizeCategory === "small" ||
          mouse.sizeCategory === "medium"
        ) {
          points += 1;
        }
      } else if (sizeCategoryFingertip === "balanced_fingertip") {
        if (mouse.sizeCategory === "medium") {
          points += 1;
        }
      }

      // Weight scoring
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
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);

    res.status(200).json({ recommended });
  } catch (error) {
    res.status(500).json({
      message: "Failed to recommend mouse",
      error: error.message,
    });
  }
};

module.exports = { createMouse, getAllMice, recommendMouse };