import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import jobApplicationsRouter from "./job-applications";
import resultsRouter from "./results";
import slidesRouter from "./slides";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bookingsRouter);
router.use(jobApplicationsRouter);
router.use(resultsRouter);
router.use(slidesRouter);
router.use(adminRouter);

export default router;
