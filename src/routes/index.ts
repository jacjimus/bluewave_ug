import userRoutes from "./userRoutes";
import policyRoutes from "./policyRoutes";
import paymentRoutes from "./paymentRoutes";
import claimRoutes from "./claimRoutes";
import ussdRoutes from "./ussdRoutes";
import reportRoutes from "./reportRoutes";
import productRoutes from "./productRoutes";
import generalRoutes from "./generalRoutes";
import logRoutes from "./logRoutes";
import { Router } from "express";


const router = Router();


router.use("/users", userRoutes);
router.use("/policies", policyRoutes);
router.use("/payments", paymentRoutes);
router.use("/claims", claimRoutes);
router.use("/ussd", ussdRoutes);
router.use("/reports", reportRoutes);
router.use("/products", productRoutes);
router.use("/generals", generalRoutes);
router.use("/logs", logRoutes);


export default router;


