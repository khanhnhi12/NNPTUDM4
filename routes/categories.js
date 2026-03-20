var express = require("express");
var router = express.Router();
let { categories } = require("../utils/categoriesData"); // Data category
let { data: productsData } = require("../utils/data"); // Data products (để lấy sp theo danh mục)
let { IncrementalId } = require("../utils/IncrementalIdHandler");
let slugify = require("slugify");

// 1. GET ALL (Có filter theo name)
// URL: /api/v1/categories?name=Clothes
router.get("/", function (req, res, next) {
  let nameQ = req.query.name ? req.query.name.toLowerCase() : "";

  let result = categories.filter(function (e) {
    // Nếu có query name thì lọc, không thì lấy hết (trừ cái đã xóa nếu bạn có làm soft delete)
    return e.name.toLowerCase().includes(nameQ) && !e.isDeleted;
  });

  res.send(result);
});

// 2. GET BY ID
// URL: /api/v1/categories/7
router.get("/:id", function (req, res, next) {
  let id = parseInt(req.params.id);
  let result = categories.find(function (e) {
    return e.id === id && !e.isDeleted;
  });

  if (result) {
    res.status(200).send(result);
  } else {
    res.status(404).send({ message: "CATEGORY NOT FOUND" });
  }
});

// 3. GET BY SLUG
// URL: /api/v1/categories/slug/shoes
router.get("/slug/:slug", function (req, res, next) {
  let slug = req.params.slug;
  let result = categories.find(function (e) {
    return e.slug === slug && !e.isDeleted;
  });

  if (result) {
    res.status(200).send(result);
  } else {
    res.status(404).send({ message: "SLUG NOT FOUND" });
  }
});

// --- YÊU CẦU ĐẶC BIỆT ---
// 4. GET PRODUCTS BY CATEGORY ID
// URL: /api/v1/categories/7/products
router.get("/:id/products", function (req, res, next) {
  let catId = parseInt(req.params.id);

  // Kiểm tra category có tồn tại không trước
  let categoryExists = categories.find((c) => c.id === catId && !c.isDeleted);

  if (!categoryExists) {
    return res.status(404).send({ message: "CATEGORY NOT FOUND" });
  }

  // Lọc trong mảng products (từ file data.js) những sp có category.id trùng khớp
  let result = productsData.filter(function (p) {
    return p.category && p.category.id === catId && !p.isDeleted;
  });

  res.send(result);
});

// 5. CREATE (POST)
// URL: /api/v1/categories
router.post("/", function (req, res, next) {
  let { name, image } = req.body;

  if (!name) {
    return res.status(400).send({ message: "Name is required" });
  }

  let newCategory = {
    id: IncrementalId(categories), // Tự tăng ID
    name: name,
    slug: slugify(name, { replacement: "-", lower: true, locale: "vi" }),
    image: image || "https://placehold.co/640x480",
    creationAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false, // Thêm cờ này để đồng bộ logic soft-delete
  };

  categories.push(newCategory);
  res.status(201).send(newCategory);
});

// 6. EDIT (PUT)
// URL: /api/v1/categories/7
router.put("/:id", function (req, res, next) {
  let id = parseInt(req.params.id);
  let result = categories.find((e) => e.id === id);

  if (result) {
    let body = req.body;
    // Cập nhật các trường gửi lên
    if (body.name) {
      result.name = body.name;
      // Nếu đổi tên thì update luôn slug
      result.slug = slugify(body.name, {
        replacement: "-",
        lower: true,
        locale: "vi",
      });
    }
    if (body.image) result.image = body.image;

    result.updatedAt = new Date();
    res.send(result);
  } else {
    res.status(404).send({ message: "ID NOT FOUND" });
  }
});

// 7. DELETE
// URL: /api/v1/categories/7
router.delete("/:id", function (req, res, next) {
  let id = parseInt(req.params.id);
  let result = categories.find((e) => e.id === id);

  if (result) {
    // Soft delete (đánh dấu đã xóa)
    result.isDeleted = true;
    res.send({ message: "Deleted successfully", id: id });

    // Nếu muốn Hard delete (xóa hẳn khỏi mảng) thì dùng:
    // let index = categories.findIndex(e => e.id === id);
    // categories.splice(index, 1);
  } else {
    res.status(404).send({ message: "ID NOT FOUND" });
  }
});

module.exports = router;
