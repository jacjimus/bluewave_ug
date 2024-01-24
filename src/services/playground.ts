const { Sequelize, DataTypes, Op, QueryTypes } = require('sequelize')
import cron from 'node-cron';
import { createDependant, fetchMemberStatusData, getMemberNumberData, reconciliation, registerDependant, registerPrincipal, updatePremium } from './aar';
import SMSMessenger from './sendSMS';
import fs from 'fs/promises';
import { db } from '../models/db';






export const playground = async () => {


  console.log("TESTING GROUND")
}  