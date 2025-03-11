const express = require("express");
const router = express.Router();
const PointCalculationController = require("../Controllers/PointCalculationController");


router.post("/create", PointCalculationController.createPointCalculation);
router.get("/", PointCalculationController.getAllPointCalculations);
router.get("/:id", PointCalculationController.getPointCalculationById);
router.put("/:id", PointCalculationController.updatePointCalculation);
router.delete("/:id", PointCalculationController.deletePointCalculation);



module.exports = router;
