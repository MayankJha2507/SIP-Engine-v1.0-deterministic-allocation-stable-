import { Router } from "express";
import portfolioRoutes from "./portfolio.ts";
import sipRoutes from "./sip.ts";
import analysisRoutes from "./analysis.ts";

const router = Router();

router.use("/portfolio", portfolioRoutes);
router.use("/sip", sipRoutes);
router.use("/analyze", analysisRoutes);

export default router;
