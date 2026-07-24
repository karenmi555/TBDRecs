import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import suggestionsRouter from "./suggestions";
import commentsRouter from "./comments";
import summaryRouter from "./summary";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(suggestionsRouter);
router.use(commentsRouter);
router.use(summaryRouter);

export default router;
