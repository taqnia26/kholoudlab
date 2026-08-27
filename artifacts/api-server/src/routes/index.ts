import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import resultsRouter from "./results";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bookingsRouter);
router.use(resultsRouter);

export default router;
