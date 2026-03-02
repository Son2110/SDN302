import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  requestExtension,
  approveExtension,
  rejectExtension,
  getAllExtensions,
  getExtensionById,
  getMyExtensions,
} from "../controllers/extensionController.js";

const extensionRouter = express.Router();

extensionRouter
  .get("/", protect, authorize("staff"), getAllExtensions)
  .get("/my-requests", protect, authorize("customer"), getMyExtensions)
  .get("/:id", protect, getExtensionById)
  .post("/request", protect, authorize("customer"), requestExtension)
  .put("/:id/approve", protect, authorize("staff"), approveExtension)
  .put("/:id/reject", protect, authorize("staff"), rejectExtension);

export default extensionRouter;
