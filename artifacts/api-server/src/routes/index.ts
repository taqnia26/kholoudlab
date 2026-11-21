import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import jobApplicationsRouter from "./job-applications";
import resultsRouter from "./results";
import slidesRouter from "./slides";
import adminRouter from "./admin";
import contentRouter from "./content";
import galleryRouter from "./gallery";
import adminContentRouter from "./admin-content";
import adminUsersRouter from "./admin-users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bookingsRouter);
router.use(jobApplicationsRouter);
router.use(resultsRouter);
router.use(slidesRouter);
router.use(contentRouter);
router.use(galleryRouter);
router.use(adminRouter);
router.use(adminContentRouter);
router.use(adminUsersRouter);

export default router;
