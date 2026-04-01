import { Router } from "express";
import usersRoutes from "./users.routes.js";
import recordsRoutes from "./records.routes.js";
import summaryRoutes from "./summary.routes.js";

const router = Router();

router.use("/users", usersRoutes);
router.use("/records", recordsRoutes);
router.use("/summary", summaryRoutes);

export default router;
