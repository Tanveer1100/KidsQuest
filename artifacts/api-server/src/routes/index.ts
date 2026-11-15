import { Router, type IRouter } from "express";
import healthRouter from "./health";
import childrenRouter from "./children";
import adventuresRouter from "./adventures";

const router: IRouter = Router();

router.use(healthRouter);
router.use(childrenRouter);
router.use(adventuresRouter);

export default router;
