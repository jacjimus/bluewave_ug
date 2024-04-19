const { Sequelize, DataTypes, Op, QueryTypes } = require('sequelize')
import cron from 'node-cron';
import { createDependant, fetchMemberStatusData, getMemberNumberData, reconciliation, registerDependant, registerPrincipal, updatePremium } from './aarServices';
import SMSMessenger from './sendSMS';
import { db } from '../models/db';
import { getNewPolicies, numberAndValueOfFailedPayments } from './report';
import Queue from 'bull';
import { createTransaction, reconcilationCallback, sendCongratulatoryMessage } from './payment';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import axios from "axios";
import authTokenByPartner from './authorization';
import { createUserIfNotExists } from './getAirtelUserKyc';
// import { google } from 'googleapis';

// const serviceAccountKeyFile = "./aitel-payment-reconciliation-abe90c6ab59e.json"
// const sheetId = '1Q4IB0vzghTIIirbGdU49UY2FPfESViXaY77oGy44J3I'
// const tabName = 'Ddwaliro Care Airtel Payments'
// const range = 'A:R'


//transacactions_id trasaction_date phone_number  premium 
// 102477015331	15-04-2024 07:34 AM	742328939	18,000
// 102456359281	14-04-2024 04:50 PM	704523108	15,000
// 102450898660	14-04-2024 02:53 PM	709151438	14,000
// 102445602491	14-04-2024 12:56 PM	706108867	50,000
// 102444101355	14-04-2024 12:23 PM	756850296	14,000
// 102440038600	14-04-2024 10:52 AM	709054921	5,000
// 102435045932	14-04-2024 08:28 AM	757921800	5,000
// 102432909637	14-04-2024 02:45 AM	701345546	5,000
// 102425085558	13-04-2024 08:39 PM	709225627	5,000
// 102422814255	13-04-2024 08:03 PM	708867818	10,000
// 102421588875	13-04-2024 07:45 PM	709031318	5,000
// 102418212192	13-04-2024 06:56 PM	740304550	5,000
// 102416302816	13-04-2024 06:20 PM	709547024	5,000
// 102416048193	13-04-2024 06:15 PM	753031206	5,000
// 102415313338	13-04-2024 06:00 PM	753031206	5,000
// 102414569742	13-04-2024 05:45 PM	744070887	5,000
// 102412192013	13-04-2024 04:55 PM	706138501	5,000
// 102409213898	13-04-2024 03:51 PM	755740981	5,000
// 102405172046	13-04-2024 02:23 PM	758240120	5,000
// 102391971655	13-04-2024 09:28 AM	740349353	5,000
// 102391860391	13-04-2024 09:25 AM	744386934	5,000
// 102390598532	13-04-2024 08:50 AM	744386934	5,000
// 102388034818	13-04-2024 07:13 AM	708414582	14,000
// 102378322105	12-04-2024 8:25 PM	705780302	5,000
// 102366110140	12-04-2024 4:50 PM	752425802	5,000
// 102365843555	12-04-2024 4:44 PM	740028410	5,000
// 102365518585	12-04-2024 4:36 PM	701415492	5,000
// 102365075722	12-04-2024 4:25 PM	740595557	10,000
// 102364422133	12-04-2024 4:09 PM	758727318	5,000
// 102361207423	12-04-2024 2:51 PM	701415492	5,000
// 102352903308	12-04-2024 11:32 AM	704680493	5,000
// 102349763788	12-04-2024 10:17 AM	75665309	5,000
// 102347010786	12-04-2024 9:07 AM	700383427	5,000
// 102346119979	12-04-2024 8:41 AM	702939057	10,000
// 102341544017	11-04-2024 11:16 PM	744832722	18,000
// 102339458830	11-04-2024 10:02 PM	752315209	5,000
// 102336205284	11-04-2024 8:58 PM	702754449	18,000
// 102335827674	11-04-2024 8:51 PM	754033528	5,000
// 102332112552	11-04-2024 7:56 PM	740959641	5,000
// 102327954756	11-04-2024 6:56 PM	750169177	10,000
// 102325849438	11-04-2024 6:18 PM	709225627	5,000
// 102317983795	11-04-2024 3:19 PM	706574258	5,000
// 102317841828	11-04-2024 3:15 PM	750233140	5,000
// 102317278690	11-04-2024 3:01 PM	708486336	5,000
// 102314586375	11-04-2024 1:56 PM	743171547	5,000
// 102310712189	11-04-2024 12:28 PM	702288631	5,000
// 102309313324	11-04-2024 11:56 AM	753892963	10,000
// 102308110278	11-04-2024 11:28 AM	753892963	5,000
// 102305372602	11-04-2024 10:26 AM	744752522	5,000
// 102302543653	11-04-2024 9:16 AM	709915861	10,000
// 102300466783	11-04-2024 8:12 AM	756169625	5,000
// 102298878817	11-04-2024 6:38 AM	744283085	5,000
// 102296989729	10-04-2024 11:30 PM	752512311	5,000
// 102296636357	10-04-2024 11:07 PM	752590662	5,000
// 102296543218	10-04-2024 11:02 PM	755251695	10,000
// 102291607444	10-04-2024 8:48 PM	754590655	10,000
// 102288641803	10-04-2024 8:00 PM	702407532	5,000
// 102286999807	10-04-2024 7:36 PM	754660409	5,000
// 102279379023	10-04-2024 5:12 PM	740331042	5,000
// 102277464036	10-04-2024 4:28 PM	704509347	14,000
// 102274287346	10-04-2024 3:12 PM	706590624	5,000
// 102273642038	10-04-2024 2:56 PM	705107022	14,000
// 102262602450	10-04-2024 11:19 AM	708120148	10,000
// 102262504944	10-04-2024 11:17 AM	758968695	5,000
// 102260738349	10-04-2024 10:45 AM	700887689	5,000
// 102251456725	10-04-2024 6:43 AM	703771359	5,000
// 102251451086	10-04-2024 6:43 AM	750457410	5,000
// 102251420337	10-04-2024 6:39 AM	753175157	5,000
// 102246766018	09-04-2024 10:22 PM	704497554	10,000
// 102244696160	09-04-2024 9:47 PM	703866714	25,000
// 102231112369	09-04-2024 7:02 PM	756991728	5,000
// 102226057611	09-04-2024 5:53 PM	705100085	5,000
// 102225504260	09-04-2024 5:45 PM	702116686	50,000
// 102224231952	09-04-2024 5:25 PM	706089142	5,000
// 102221736671	09-04-2024 4:43 PM	740946670	5,000
// 102221360687	09-04-2024 4:36 PM	756643578	5,000
// 102217927628	09-04-2024 3:34 PM	756684611	5,000
// 102214518096	09-04-2024 2:30 PM	757351174	35,000
// 102213517183	09-04-2024 2:11 PM	708221250	10,000
// 102204357862	09-04-2024 11:15 AM	702384693	20,000
// 102201288103	09-04-2024 10:11 AM	708414582	18,000
// 102198732596	09-04-2024 9:11 AM	752517849	5,000
// 102196670573	09-04-2024 8:13 AM	755760359	18,000
// 102196663783	09-04-2024 8:13 AM	742664523	5,000
// 102190083289	08-04-2024 10:31 PM	708002408	5,000
// 102189047807	08-04-2024 10:10 PM	704676582	5,000
// 102189032081	08-04-2024 10:09 PM	754728698	10,000
// 102186473133	08-04-2024 9:28 PM	707996021	5,000
// 102183870118	08-04-2024 8:50 PM	707555920	5,000
// 102180504880	08-04-2024 8:07 PM	706754714	5,000
// 102180475989	08-04-2024 8:06 PM	707252302	10,000
// 102177930806	08-04-2024 7:35 PM	743160864	5,000
// 102175397091	08-04-2024 7:01 PM	758896734	93,000
// 102170456431	08-04-2024 5:40 PM	701829613	5,000
// 102169930355	08-04-2024 5:31 PM	701829613	5,000
// 102169778646	08-04-2024 5:28 PM	752395069	5,000
// 102169242388	08-04-2024 5:18 PM	756426077	10,000
// 102167859264	08-04-2024 4:52 PM	700957665	18,000
// 102167067735	08-04-2024 4:36 PM	708468760	5,000
// 102165625965	08-04-2024 4:07 PM	744694661	40,000
// 102164788243	08-04-2024 3:50 PM	705293518	10,000
// 102164186420	08-04-2024 3:38 PM	702476298	5,000
// 102161218019	08-04-2024 2:36 PM	756129388	5,000
// 102160867792	08-04-2024 2:28 PM	702648287	5,000
// 102159078611	08-04-2024 1:51 PM	700267600	5,000
// 102158012132	08-04-2024 1:28 PM	709110287	60,000
// 102157552608	08-04-2024 1:19 PM	757374835	5,000
// 102156767962	08-04-2024 1:02 PM	706359487	10,000
// 102154605989	08-04-2024 12:17 PM	702079803	10,000
// 102152935510	08-04-2024 11:42 AM	752682142	5,000
// 102141512959	08-04-2024 4:07 AM	753382788	18,000
// 102103379872	07-04-2024 1:10 PM	757302726	18,000
// 102096992766	07-04-2024 11:06 AM	758356914	5,000
// 101969641246	04-04-2024 8:06 PM	752825291	5,000
// 101969325940	04-04-2024 8:02 PM	751557769	5,000
// 101967827641	04-04-2024 7:44 PM	751060363	10,000
// 101966857806	04-04-2024 7:33 PM	752322768	10,000
// 101966354616	04-04-2024 7:26 PM	744297629	5,000
// 101964981937	04-04-2024 7:08 PM	759482313	5,000
// 101964924257	04-04-2024 7:07 PM	751066271	5,000
// 101964917716	04-04-2024 7:07 PM	759482313	5,000
// 101962695831	04-04-2024 6:33 PM	741890757	18,000
// 101959959742	04-04-2024 5:45 PM	754239908	5,000
// 101955222995	04-04-2024 3:59 PM	752825291	5,000
// 101954784350	04-04-2024 3:49 PM	701777724	5,000
// 101952463610	04-04-2024 2:55 PM	701994625	5,000
// 101949176964	04-04-2024 1:42 PM	742018204	5,000
// 101949008067	04-04-2024 1:38 PM	742676850	10,000
// 101947858600	04-04-2024 1:12 PM	758034247	5,000
// 101945715539	04-04-2024 12:24 PM	759886550	5,000
// 101944561475	04-04-2024 11:59 AM	708076693	5,000
// 101942722348	04-04-2024 11:19 AM	755300223	5,000
// 101942631827	04-04-2024 11:17 AM	701190117	20,000
// 101939503086	04-04-2024 10:06 AM	759639732	5,000
// 101937160933	04-04-2024 9:06 AM	701419062	10,000
// 101936355202	04-04-2024 8:43 AM	753967219	20,000

const array_of_phone_numbers = [
 
 // { transaction_id: 102325849438, transaction_date: '11-04-2024 6:18 PM', phone_number: 709225627, premium: 5000 },
{ transaction_id: 102477015331, transaction_date: '15-04-2024 07:34 AM', phone_number: 742328939, premium: 18000 },
{ transaction_id: 102456359281, transaction_date: '14-04-2024 04:50 PM', phone_number: 704523108, premium: 15000 },
{ transaction_id: 102450898660, transaction_date: '14-04-2024 02:53 PM', phone_number: 709151438, premium: 14000 },
{ transaction_id: 102445602491, transaction_date: '14-04-2024 12:56 PM', phone_number: 706108867, premium: 50000 },
{ transaction_id: 102444101355, transaction_date: '14-04-2024 12:23 PM', phone_number: 756850296, premium: 14000 },
{ transaction_id: 102440038600, transaction_date: '14-04-2024 10:52 AM', phone_number: 709054921, premium: 5000 },
{ transaction_id: 102435045932, transaction_date: '14-04-2024 08:28 AM', phone_number: 757921800, premium: 5000 },
{ transaction_id: 102432909637, transaction_date: '14-04-2024 02:45 AM', phone_number: 701345546, premium: 5000 },
{ transaction_id: 102425085558, transaction_date: '13-04-2024 08:39 PM', phone_number: 709225627, premium: 5000 },
{ transaction_id: 102422814255, transaction_date: '13-04-2024 08:03 PM', phone_number: 708867818, premium: 10000 },
{ transaction_id: 102421588875, transaction_date: '13-04-2024 07:45 PM', phone_number: 709031318, premium: 5000 },
{ transaction_id: 102418212192, transaction_date: '13-04-2024 06:56 PM', phone_number: 740304550, premium: 5000 },
{ transaction_id: 102416302816, transaction_date: '13-04-2024 06:20 PM', phone_number: 709547024, premium: 5000 },
{ transaction_id: 102416048193, transaction_date: '13-04-2024 06:15 PM', phone_number: 753031206, premium: 5000 },
{ transaction_id: 102415313338, transaction_date: '13-04-2024 06:00 PM', phone_number: 753031206, premium: 5000 },
{ transaction_id: 102414569742, transaction_date: '13-04-2024 05:45 PM', phone_number: 744070887, premium: 5000 },
{ transaction_id: 102412192013, transaction_date: '13-04-2024 04:55 PM', phone_number: 706138501, premium: 5000 },
{ transaction_id: 102409213898, transaction_date: '13-04-2024 03:51 PM', phone_number: 755740981, premium: 5000 },
{ transaction_id: 102405172046, transaction_date: '13-04-2024 02:23 PM', phone_number: 758240120, premium: 5000 },
{ transaction_id: 102391971655, transaction_date: '13-04-2024 09:28 AM', phone_number: 740349353, premium: 5000 },
{ transaction_id: 102391860391, transaction_date: '13-04-2024 09:25 AM', phone_number: 744386934, premium: 5000 },
{ transaction_id: 102390598532, transaction_date: '13-04-2024 08:50 AM', phone_number: 744386934, premium: 5000 },
{ transaction_id: 102388034818, transaction_date: '13-04-2024 07:13 AM', phone_number: 708414582, premium: 14000 },
{ transaction_id: 102378322105, transaction_date: '12-04-2024 8:25 PM', phone_number: 705780302, premium: 5000 },
{ transaction_id: 102366110140, transaction_date: '12-04-2024 4:50 PM', phone_number: 752425802, premium: 5000 },
{ transaction_id: 102365843555, transaction_date: '12-04-2024 4:44 PM', phone_number: 740028410, premium: 5000 },
{ transaction_id: 102365518585, transaction_date: '12-04-2024 4:36 PM', phone_number: 701415492, premium: 5000 },
{ transaction_id: 102365075722, transaction_date: '12-04-2024 4:25 PM', phone_number: 740595557, premium: 10000 },
{ transaction_id: 102364422133, transaction_date: '12-04-2024 4:09 PM', phone_number: 758727318, premium: 5000 },
{ transaction_id: 102361207423, transaction_date: '12-04-2024 2:51 PM', phone_number: 701415492, premium: 5000 },
{ transaction_id: 102352903308, transaction_date: '12-04-2024 11:32 AM', phone_number: 704680493, premium: 5000 },
{ transaction_id: 102349763788, transaction_date: '12-04-2024 10:17 AM', phone_number: 75665309, premium: 5000 },
{ transaction_id: 102347010786, transaction_date: '12-04-2024 9:07 AM', phone_number: 700383427, premium: 5000 },
{ transaction_id: 102346119979, transaction_date: '12-04-2024 8:41 AM', phone_number: 702939057, premium: 10000 },
{ transaction_id: 102341544017, transaction_date: '11-04-2024 11:16 PM', phone_number: 744832722, premium: 18000 },
{ transaction_id: 102339458830, transaction_date: '11-04-2024 10:02 PM', phone_number: 752315209, premium: 5000 },
{ transaction_id: 102336205284, transaction_date: '11-04-2024 8:58 PM', phone_number: 702754449, premium: 18000 },
{ transaction_id: 102335827674, transaction_date: '11-04-2024 8:51 PM', phone_number: 754033528, premium: 5000 },
{ transaction_id: 102332112552, transaction_date: '11-04-2024 7:56 PM', phone_number: 740959641, premium: 5000 },
{ transaction_id: 102327954756, transaction_date: '11-04-2024 6:56 PM', phone_number: 750169177, premium: 10000 },
{ transaction_id: 102325849438, transaction_date: '11-04-2024 6:18 PM', phone_number: 709225627, premium: 5000 },
{ transaction_id: 102317983795, transaction_date: '11-04-2024 3:19 PM', phone_number: 706574258, premium: 5000 },
{ transaction_id: 102317841828, transaction_date: '11-04-2024 3:15 PM', phone_number: 750233140, premium: 5000 },
{ transaction_id: 102317278690, transaction_date: '11-04-2024 3:01 PM', phone_number: 708486336, premium: 5000 },
{ transaction_id: 102314586375, transaction_date: '11-04-2024 1:56 PM', phone_number: 743171547, premium: 5000 },
{ transaction_id: 102310712189, transaction_date: '11-04-2024 12:28 PM', phone_number: 702288631, premium: 5000 },
{ transaction_id: 102309313324, transaction_date: '11-04-2024 11:56 AM', phone_number: 753892963, premium: 10000 },
{ transaction_id: 102308110278, transaction_date: '11-04-2024 11:28 AM', phone_number: 753892963, premium: 5000 },
{ transaction_id: 102305372602, transaction_date: '11-04-2024 10:26 AM', phone_number: 744752522, premium: 5000 },
{ transaction_id: 102302543653, transaction_date: '11-04-2024 9:16 AM', phone_number: 709915861, premium: 10000 },
{ transaction_id: 102300466783, transaction_date: '11-04-2024 8:12 AM', phone_number: 756169625, premium: 5000 },
{ transaction_id: 102298878817, transaction_date: '11-04-2024 6:38 AM', phone_number: 744283085, premium: 5000 },
{ transaction_id: 102296989729, transaction_date: '10-04-2024 11:30 PM', phone_number: 752512311, premium: 5000 },
{ transaction_id: 102296636357, transaction_date: '10-04-2024 11:07 PM', phone_number: 752590662, premium: 5000 },
{ transaction_id: 102296543218, transaction_date: '10-04-2024 11:02 PM', phone_number: 755251695, premium: 10000 },
{ transaction_id: 102291607444, transaction_date: '10-04-2024 8:48 PM', phone_number: 754590655, premium: 10000 },
{ transaction_id: 102288641803, transaction_date: '10-04-2024 8:00 PM', phone_number: 702407532, premium: 5000 },
{ transaction_id: 102286999807, transaction_date: '10-04-2024 7:36 PM', phone_number: 754660409, premium: 5000 },
{ transaction_id: 102279379023, transaction_date: '10-04-2024 5:12 PM', phone_number: 740331042, premium: 5000 },
{ transaction_id: 102277464036, transaction_date: '10-04-2024 4:28 PM', phone_number: 704509347, premium: 14000 },
{ transaction_id: 102274287346, transaction_date: '10-04-2024 3:12 PM', phone_number: 706590624, premium: 5000 },
{ transaction_id: 102273642038, transaction_date: '10-04-2024 2:56 PM', phone_number: 705107022, premium: 14000 },
{ transaction_id: 102262602450, transaction_date: '10-04-2024 11:19 AM', phone_number: 708120148, premium: 10000 },
{ transaction_id: 102262504944, transaction_date: '10-04-2024 11:17 AM', phone_number: 758968695, premium: 5000 },
{ transaction_id: 102260738349, transaction_date: '10-04-2024 10:45 AM', phone_number: 700887689, premium: 5000 },
{ transaction_id: 102251456725, transaction_date: '10-04-2024 6:43 AM', phone_number: 703771359, premium: 5000 },
{ transaction_id: 102251451086, transaction_date: '10-04-2024 6:43 AM', phone_number: 750457410, premium: 5000 },
{ transaction_id: 102251420337, transaction_date: '10-04-2024 6:39 AM', phone_number: 753175157, premium: 5000 },
{ transaction_id: 102246766018, transaction_date: '09-04-2024 10:22 PM', phone_number: 704497554, premium: 10000 },
{ transaction_id: 102244696160, transaction_date: '09-04-2024 9:47 PM', phone_number: 703866714, premium: 25000 },
{ transaction_id: 102231112369, transaction_date: '09-04-2024 7:02 PM', phone_number: 756991728, premium: 5000 },
{ transaction_id: 102226057611, transaction_date: '09-04-2024 5:53 PM', phone_number: 705100085, premium: 5000 },
{ transaction_id: 102225504260, transaction_date: '09-04-2024 5:45 PM', phone_number: 702116686, premium: 50000 },
{ transaction_id: 102224231952, transaction_date: '09-04-2024 5:25 PM', phone_number: 706089142, premium: 5000 },
{ transaction_id: 102221736671, transaction_date: '09-04-2024 4:43 PM', phone_number: 740946670, premium: 5000 },
{ transaction_id: 102221360687, transaction_date: '09-04-2024 4:36 PM', phone_number: 756643578, premium: 5000 },
{ transaction_id: 102217927628, transaction_date: '09-04-2024 3:34 PM', phone_number: 756684611, premium: 5000 },
{ transaction_id: 102214518096, transaction_date: '09-04-2024 2:30 PM', phone_number: 757351174, premium: 35000 },
{ transaction_id: 102213517183, transaction_date: '09-04-2024 2:11 PM', phone_number: 708221250, premium: 10000 },
{ transaction_id: 102204357862, transaction_date: '09-04-2024 11:15 AM', phone_number: 702384693, premium: 20000 },
{ transaction_id: 102201288103, transaction_date: '09-04-2024 10:11 AM', phone_number: 708414582, premium: 18000 },
{ transaction_id: 102198732596, transaction_date: '09-04-2024 9:11 AM', phone_number: 752517849, premium: 5000 },
{ transaction_id: 102196670573, transaction_date: '09-04-2024 8:13 AM', phone_number: 755760359, premium: 18000 },
{ transaction_id: 102196663783, transaction_date: '09-04-2024 8:13 AM', phone_number: 742664523, premium: 5000 },
{ transaction_id: 102190083289, transaction_date: '08-04-2024 10:31 PM', phone_number: 708002408, premium: 5000 },
{ transaction_id: 102189047807, transaction_date: '08-04-2024 10:10 PM', phone_number: 704676582, premium: 5000 },
{ transaction_id: 102189032081, transaction_date: '08-04-2024 10:09 PM', phone_number: 754728698, premium: 10000 },
{ transaction_id: 102186473133, transaction_date: '08-04-2024 9:28 PM', phone_number: 707996021, premium: 5000 },
{ transaction_id: 102183870118, transaction_date: '08-04-2024 8:50 PM', phone_number: 707555920, premium: 5000 },
{ transaction_id: 102180504880, transaction_date: '08-04-2024 8:07 PM', phone_number: 706754714, premium: 5000 },
{ transaction_id: 102180475989, transaction_date: '08-04-2024 8:06 PM', phone_number: 707252302, premium: 10000 },
{ transaction_id: 102177930806, transaction_date: '08-04-2024 7:35 PM', phone_number: 743160864, premium: 5000 },
{ transaction_id: 102175397091, transaction_date: '08-04-2024 7:01 PM', phone_number: 758896734, premium: 93000 },
{ transaction_id: 102170456431, transaction_date: '08-04-2024 5:40 PM', phone_number: 701829613, premium: 5000 },
{ transaction_id: 102169930355, transaction_date: '08-04-2024 5:31 PM', phone_number: 701829613, premium: 5000 },
{ transaction_id: 102169778646, transaction_date: '08-04-2024 5:28 PM', phone_number: 752395069, premium: 5000 },
{ transaction_id: 102169242388, transaction_date: '08-04-2024 5:18 PM', phone_number: 756426077, premium: 10000 },
{ transaction_id: 102167859264, transaction_date: '08-04-2024 4:52 PM', phone_number: 700957665, premium: 18000 },
{ transaction_id: 102167067735, transaction_date: '08-04-2024 4:36 PM', phone_number: 708468760, premium: 5000 },
{ transaction_id: 102165625965, transaction_date: '08-04-2024 4:07 PM', phone_number: 744694661, premium: 40000 },
{ transaction_id: 102164788243, transaction_date: '08-04-2024 3:50 PM', phone_number: 705293518, premium: 10000 },
{ transaction_id: 102164186420, transaction_date: '08-04-2024 3:38 PM', phone_number: 702476298, premium: 5000 },
{ transaction_id: 102161218019, transaction_date: '08-04-2024 2:36 PM', phone_number: 756129388, premium: 5000 },
{ transaction_id: 102160867792, transaction_date: '08-04-2024 2:28 PM', phone_number: 702648287, premium: 5000 },
{ transaction_id: 102159078611, transaction_date: '08-04-2024 1:51 PM', phone_number: 700267600, premium: 5000 },
{ transaction_id: 102158012132, transaction_date: '08-04-2024 1:28 PM', phone_number: 709110287, premium: 60000 },
{ transaction_id: 102157552608, transaction_date: '08-04-2024 1:19 PM', phone_number: 757374835, premium: 5000 },
{ transaction_id: 102156767962, transaction_date: '08-04-2024 1:02 PM', phone_number: 706359487, premium: 10000 },
{ transaction_id: 102154605989, transaction_date: '08-04-2024 12:17 PM', phone_number: 702079803, premium: 10000 },
{ transaction_id: 102152935510, transaction_date: '08-04-2024 11:42 AM', phone_number: 752682142, premium: 5000 },
{ transaction_id: 102141512959, transaction_date: '08-04-2024 4:07 AM', phone_number: 753382788, premium: 18000 },
{ transaction_id: 102103379872, transaction_date: '07-04-2024 1:10 PM', phone_number: 757302726, premium: 18000 },
{ transaction_id: 102096992766, transaction_date: '07-04-2024 11:06 AM', phone_number: 758356914, premium: 5000 },
{ transaction_id: 101969641246, transaction_date: '04-04-2024 8:06 PM', phone_number: 752825291, premium: 5000 },
{ transaction_id: 101969325940, transaction_date: '04-04-2024 8:02 PM', phone_number: 751557769, premium: 5000 },
{ transaction_id: 101967827641, transaction_date: '04-04-2024 7:44 PM', phone_number: 751060363, premium: 10000 },
{ transaction_id: 101966857806, transaction_date: '04-04-2024 7:33 PM', phone_number: 752322768, premium: 10000 },
{ transaction_id: 101966354616, transaction_date: '04-04-2024 7:26 PM', phone_number: 744297629, premium: 5000 },
{ transaction_id: 101964981937, transaction_date: '04-04-2024 7:08 PM', phone_number: 759482313, premium: 5000 },
{ transaction_id: 101964924257, transaction_date: '04-04-2024 7:07 PM', phone_number: 751066271, premium: 5000 },
{ transaction_id: 101964917716, transaction_date: '04-04-2024 7:07 PM', phone_number: 759482313, premium: 5000 },
{ transaction_id: 101962695831, transaction_date: '04-04-2024 6:33 PM', phone_number: 741890757, premium: 18000 },
{ transaction_id: 101959959742, transaction_date: '04-04-2024 5:45 PM', phone_number: 754239908, premium: 5000 },
{ transaction_id: 101955222995, transaction_date: '04-04-2024 3:59 PM', phone_number: 752825291, premium: 5000 },
{ transaction_id: 101954784350, transaction_date: '04-04-2024 3:49 PM', phone_number: 701777724, premium: 5000 },
{ transaction_id: 101952463610, transaction_date: '04-04-2024 2:55 PM', phone_number: 701994625, premium: 5000 },
{ transaction_id: 101949176964, transaction_date: '04-04-2024 1:42 PM', phone_number: 742018204, premium: 5000 },
{ transaction_id: 101949008067, transaction_date: '04-04-2024 1:38 PM', phone_number: 742676850, premium: 10000 },
{ transaction_id: 101947858600, transaction_date: '04-04-2024 1:12 PM', phone_number: 758034247, premium: 5000 },
{ transaction_id: 101945715539, transaction_date: '04-04-2024 12:24 PM', phone_number: 759886550, premium: 5000 },
{ transaction_id: 101944561475, transaction_date: '04-04-2024 11:59 AM', phone_number: 708076693, premium: 5000 },
{ transaction_id: 101942722348, transaction_date: '04-04-2024 11:19 AM', phone_number: 755300223, premium: 5000 },
{ transaction_id: 101942631827, transaction_date: '04-04-2024 11:17 AM', phone_number: 701190117, premium: 20000 },
{ transaction_id: 101939503086, transaction_date: '04-04-2024 10:06 AM', phone_number: 759639732, premium: 5000 },
{ transaction_id: 101937160933, transaction_date: '04-04-2024 9:06 AM', phone_number: 701419062, premium: 10000 },
{ transaction_id: 101936355202, transaction_date: '04-04-2024 8:43 AM', phone_number: 753967219, premium: 20000 },
];


async function policyReconciliation(array_of_phone_numbers) {

  try {

    let result
    array_of_phone_numbers.forEach(async (item) => {

     //let transaction_date = moment('2024-03-24').format('YYYY-MM-DD HH:mm:ss')
      const transaction_date = moment(item.transaction_date, "YYYY-MM-DD h:mm A");
     // console.log("transaction_date_str", transaction_date)
      let policy = await db.policies.findOne({
        where: {
          phone_number: `+256${item.phone_number}`,
          premium: item.premium,
          policy_status: 'pending',
          policy_number: null
        },
        include: [{
          model: db.users,
          where: {
            partner_id: 2
          }
        }],
        limit: 1,
      });

      console.log("policy", policy)
if(policy){
      let payment = await db.payments.findOne({
        where: {
          user_id: policy.user_id,
         [Op.or]: [{ payment_status: 'pending' }, { payment_status: 'failed' }],
          payment_amount: item.premium,
        },
        limit: 1,
      });
      
      console.log("payment", payment)

      // if (policy.policy_status == 'paid' && payment.payment_status == 'paid' && policy.premium == payment.payment_amount && item.installment_count > 1) {
      //   console.log(" ===== policy paid  and payment match =======", policy.first_name, policy.last_name, policy.phone_number, policy.premium, policy.policy_status, payment.payment_status)
      //  let  user = policy.user
      //   const memberStatus = await fetchMemberStatusData({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });
      //   console.log(memberStatus)
      //   if(item.installment_count > 1){
      //     result= 'Payment already reconciled'
      //     //result = await reconciliation({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "", amount: item.premium, transaction_date: transaction_date, installment_count: item.installment_count });
      //   }
      // }
       console.log("====== PAYMENT =====", payment?.payment_amount, payment?.payment_status, payment?.payment_date, payment?.payment_id)

       console.log("===== POLICY =====", policy.policy_id,policy.policy_status, policy.premium, policy.policy_paid_date, policy.policy_paid_amount)

      let transaction = await db.transactions.findOne({
        where: {
          user_id: policy.user_id,
          // status: 'pending',
         // status: 'pending',
          amount: item.premium,
        },
        limit: 1,

      });

      console.log("===== TRANSACTION =====", transaction)

      // if (transaction.status == null && policy.policy_status !== 'paid') {
      //   // create transaction
      //   let user_id = policy.user_id
      //   let partner_id = policy.partner_id
      //   let policy_id = policy.policy_id
      //   let amount = policy.premium
      //   let transactionId = uuidv4()
      //   transaction = await createTransaction(user_id, partner_id, policy_id, transactionId, amount)

      //   //console.log("create transaction", transaction);
      // }


      console.log("transaction", transaction)

      if (transaction) {

        let paymentCallback = {
          transaction: {
            id: transaction.transaction_id,
            message: `PAID UGX ${item.premium} to AAR Uganda for ${policy.beneficiary} ${policy.policy_status} Cover Charge UGX 0. Bal UGX ${item.premium}. TID: ${item.airtel_money_id}. Date: ${transaction_date}`,
            status_code: "TS",
            airtel_money_id: item.transaction_id,
            payment_date: transaction.createdAt,
           
          }
        }

        // console.log("paymentCallback", paymentCallback)
        result = await reconcilationCallback(paymentCallback.transaction)
        // slow down the loop
        await new Promise(resolve => setTimeout(resolve, 2000));

      }else{
        console.log("Transaction not found")
      }
    }else{
      console.log("Policy not found")
    }
      console.log("RESULT ", result);

    }
    )
    console.log(result);
  }
  catch (error) {
    console.log(error);
  }
}

async function getArrMemberNumberData() {
  try {
    const policies = await db.policies.findAll({
      // Policy type is 'S MINI'
      where: {
        //policy_status: 'paid',
        //policy_type: { [db.Sequelize.Op.eq]: 'S MINI' },
        partner_id: 2,
        // policy_start_date: {
        //   [Op.between]: ['2023-10-01', '2024-03-31']
        // },

      },
      include: [{
        model: db.users,
        where: {
         arr_member_number: null,
          partner_id: 2
        }
      }]

    });

    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i];
      const customer = policy.user
      console.log(customer.name, policy.phone_number);
   
      let result = await registerPrincipal(customer, policy);
      console.log(result);
      if (result.code == 608) {
        await getMemberNumberData(customer.phone_number);
      }
      // Introduce a delay of 1 second between each iteration
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } catch (error) {
    console.log(error);
  }
}


let no_renewal_policies = [
  // "UG155285-01",
  // "UG155943-07",
  // "UG155943-08",
  // "UG155943-09",
  // "UG155943-10",
  // "UG155943-11",
  // "UG155943-12",
  // "UG155950-02",
  // "UG155953-02",
  // "UG155962-03",
  // "UG155962-04",
  // "UG157221-00",
  // "UG157222-00",
  // "UG157223-00",
  // "UG157224-00",
  // "UG157225-00",
  // "UG157226-00",
  // "UG157227-00",
  // "UG157228-00",
  // "UG157230-00",
  // "UG157231-00",
  // "UG157232-00",
  // "UG157233-00",
  // "UG157234-00",
  // "UG157235-00",
  // "UG157236-00",
  // "UG157237-00",
  // "UG157245-00",
  // "UG157245-01",
  // "UG157245-02",
  // "UG157245-03",
  // "UG157245-04",
  // "UG157245-05",
  // "UG157245-06",
  // "UG157246-00",
  // "UG157247-00",
  // "UG157248-00",
  // "UG157249-00",
  // "UG157250-00",
  // "UG157263-00",
  // "UG157270-00",
  // "UG157271-00",
  // "UG157272-00",
  // "UG157284-00",
  // "UG157285-00",
  // "UG157285-01",
  // "UG157286-00",
  // "UG157287-00",
  // "UG157288-00",
  // "UG157289-00",
  // "UG157290-00",
  // "UG157290-01",
  // "UG157290-02",
  // "UG157290-03",
  // "UG157290-04",
  // "UG157290-05",
  // "UG157290-06",
  // "UG157291-00",
  // "UG157292-00",
  // "UG157293-00",
  // "UG157294-00",
  // "UG157297-00",
  // "UG157301-00",
  // "UG157302-00",
  // "UG157303-00",
  // "UG157304-00",
  // "UG157308-00",
  // "UG157309-00",
  // "UG157310-00",
  // "UG157311-00",
  // "UG157312-00",
  // "UG157313-00",
  // "UG157315-00",
  // "UG157316-00",
  // "UG157317-00",
  // "UG157322-00",
  // "UG157323-00",
  // "UG157324-00",
  // "UG157325-00",
  // "UG157326-00",
  // "UG157327-00",
  // "UG157328-00",
  // "UG157329-00",
  // "UG157330-00",
  // "UG157331-00",
  // "UG157332-00",
  // "UG157333-00",
  // "UG157335-00",
  // "UG157337-00",
  // "UG157341-01",
  // "UG157342-00",
  // "UG157343-00",
  // "UG157344-00",
  // "UG157344-01",
  // "UG157345-00",
  // "UG157346-00",
  // "UG157347-00",
  // "UG157348-00",
  // "UG157349-00",
  // "UG157350-00",
  // "UG157351-00",
  // "UG157352-00",
  // "UG157353-00",
  // "UG157354-00",
  // "UG157355-00",
  // "UG157356-00",
  // "UG157357-00",
  // "UG157358-00",
  // "UG157359-00",
  // "UG157360-00",
  // "UG157362-00",
  // "UG157363-00",
  // "UG157365-00",
  // "UG157366-00",
  // "UG157367-00",
  // "UG157368-00",
  // "UG157369-00",
  // "UG157370-00",
  // "UG157371-00",
  // "UG157372-00",
  // "UG157373-00",
  // "UG157374-00",
  // "UG157375-00",
  // "UG157375-01",
  // "UG157375-02",
  // "UG157376-00",
  // "UG157382-00",
  // "UG157384-00",
  // "UG157385-00",
  // "UG157386-00",
  // "UG157390-00",
  // "UG157391-00",
  // "UG157392-00",
  // "UG157393-00",
  // "UG157394-00",
  // "UG157395-00",
  // "UG157396-00",
  // "UG157397-00",
  // "UG157401-00",
  // "UG157402-00",
  // "UG157404-00",
  // "UG157406-00",
  // "UG157407-00",
  // "UG157408-00",
  // "UG157409-00",
  // "UG157410-00",
  // "UG157411-00",
  // "UG157412-00",
  // "UG157413-00",
  // "UG157417-00",
  // "UG157418-00",
  // "UG157419-00",
  // "UG157420-00",
  // "UG157421-00",
  // "UG157422-00",
  // "UG157423-00",
  // "UG157424-00",
  // "UG157426-00",
  // "UG157427-00",
  // "UG157428-00",
  // "UG157429-00",
  // "UG157430-00",
  // "UG157458-00",
  // "UG157460-00",
  // "UG157461-00",
  // "UG157462-00",
  // "UG157471-00",
  // "UG157472-00",
  // "UG157473-00",
  // "UG157474-00",
  // "UG157475-00",
  // "UG157476-00",
  // "UG157477-00",
  // "UG157478-00",
  // "UG157479-00",
  // "UG157480-00",
  // "UG157483-00",
  // "UG157483-01",
  // "UG157487-00",
  // "UG157488-00",
  // "UG157489-00",
  // "UG157490-00",
  // "UG157491-00",
  // "UG157492-00",
  // "UG157493-00",
  // "UG157494-00",
  // "UG157495-00",
  // "UG157496-00",
  // "UG157497-00",
  // "UG157498-00",
  // "UG157499-00",
  // "UG157500-01",
  // "UG157502-00",
  // "UG157503-00",
  // "UG157506-00",
  // "UG157507-00",
  // "UG157508-00",
  // "UG157509-00",
  // "UG157510-00",
  // "UG157511-00",
  // "UG157512-00",
  // "UG157515-00",
  // "UG157516-00",
  // "UG157517-00",
  // "UG157519-00",
  // "UG157519-01",
  // "UG157521-00",
  // "UG157522-00",
  // "UG157523-00",
  // "UG157524-00",
  // "UG157525-00",
  // "UG157526-00",
  // "UG157527-00",
  // "UG157528-00",
  // "UG157530-00",
  // "UG157531-00",
  // "UG157531-01",
  // "UG157533-00",
  // "UG157533-01",
  // "UG157533-02",
  // "UG157533-03",
  // "UG157534-00",
  // "UG157535-00",
  // "UG157537-00",
  // "UG157539-00",
  // "UG157542-00",
  // "UG157543-00",
  // "UG157544-00",
  // "UG157545-00",
  // "UG157546-00",
  // "UG157549-00",
  // "UG157550-00",
  // "UG157553-00",
  // "UG157554-00",
  // "UG157570-00",
  // "UG157571-00",
  // "UG157572-00",
  // "UG157573-00",
  // "UG157574-00",
  // "UG157575-00",
  // "UG157576-00",
  // "UG157577-00",
  // "UG157579-00",
  // "UG157580-00",
  // "UG157581-00",
  // "UG157583-00",
  // "UG157584-00",
  // "UG157586-00",
  // "UG157587-00",
  // "UG157588-00",
  // "UG157589-00",
  // "UG157591-00",
  // "UG157592-00",
  // "UG157593-00",
  // "UG157594-00",
  // "UG157598-00",
  // "UG157601-00",
  // "UG157607-00",
  // "UG158305-01",
  // "UG158305-02",
  // "UG158306-00",
  // "UG159639-00",
  // "UG159806-00",
  // "UG159807-00",
  // "UG159808-00",
  // "UG159809-00",
  // "UG159810-00",
  // "UG159811-00",
  // "UG159812-00",
  // "UG159813-00",
  // "UG159816-00",
  // "UG159817-00",
  // "UG159818-00",
  // "UG159820-00",
  // "UG159821-00",
  // "UG159822-00",
  // "UG159823-00",
  // "UG159824-00",
  // "UG159825-00",
  // "UG159826-00",
  // "UG160369-00",
  "UG160370-00",
  "UG160371-00",
  "UG160372-00",
  "UG160373-00",
  "UG160378-00",
  "UG160380-00",
  "UG160386-00",
  "UG160390-00",
  "UG160391-00",
  "UG160397-00",
  "UG160402-00",
  "UG160404-00",
  "UG160407-00",
  "UG160408-00",
  "UG160409-00",
  "UG160410-00",
  "UG160411-00",
  "UG160412-00",
  "UG160413-00",
  "UG160414-00",
  "UG160415-00",
  "UG160416-00",
  "UG160417-00",
  "UG160418-00",
  "UG160419-00",
  "UG160420-00",
  "UG160421-00",
  "UG160461-00",
  "UG160467-00",
  "UG161111-00",
  "UG161115-00",
  "UG161116-00",
  "UG161145-00",
  "UG161146-00",
  "UG161149-00",
  "UG161152-00",
  "UG161153-00",
  "UG161154-00",
  "UG161177-00",
  "UG161182-00",
  "UG161191-00",
  "UG161194-00",
  "UG161203-00",
  "UG161594-00",
  "UG161595-00",
  "UG161596-00",
  "UG161597-00",
  "UG161598-00",
  "UG161599-00",
  "UG161600-00",
  "UG161601-00",
  "UG161602-00",
  "UG161603-00",
  "UG161640-00",
  "UG162293-00",
]
// updating premium on aar 
 async function updatePremiumArr(policies) {
  try {
    // Assuming you're constructing a query object for some ORM or database library

// Function to convert the member number to end with '-00' if it doesn't already
function convertToStandardFormat(memberNumber) {
  if (memberNumber.endsWith('-00')) {
      return memberNumber; // No conversion needed
  } else {
      return memberNumber.replace(/-\d{2}$/, '-00'); // Replace the last two digits with '00'
  }
}



    policies.forEach(async (arr_member_number) => {
      console.log("arr_member_number", arr_member_number)
    const policies = await db.policies.findAll({
      where: {
        policy_status: 'paid',
        partner_id: 2,
       // policy_type: 'S MINI',
      //  beneficiary: 'FAMILY',
      //  installment_order: 3,
      //  arr_policy_number: {
      //     [Op.ne]: null
      //   },
      //   policy_start_date: {
      //     [Op.between]: ['2023-10-01', '2024-04-15']
      //   },
      },
      include: [{
        model: db.users,
        where: {
          partner_id: 2,
          arr_member_number: convertToStandardFormat(arr_member_number)
        }
      }]
    });

    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i];
      const customer = policy.user
      console.log(customer.name, policy.phone_number);
      customer.arr_member_number=arr_member_number
      let result = await updatePremium(customer, policy);
      console.log(result);
      // Introduce a delay of 1 second between each iteration
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

  } )

  } catch (error) {
    console.log(error);
  }
 }


export const playground = async () => {

  //getNewPolicies(2, '2023-01-01', '2024-02-7')
  //numberAndValueOfFailedPayments(2, '2023-01-01', '2024-02-07')
  // sendCongratulatoryMessage(policy, user)
  // _sendPolicyRenewalReminder('757998947')
  //_checkIfPolicyExists(array_of_phone_numbers)
  //_updateUserNumberOfPolicies()
  // _checkIfPolicyExistsInAAR()
  // _updateUserNumberOfPolicies()
  //updateAirtelMoneyId(array_of_phone_numbers);
  // check_if_phone_number_has_paid_poicy(array_of_phone_numbers_to_check_paid_policies)
  //findDuplicatePhoneNumbers(array_of_phone_numbers_to_check_paid_policies)
//policyReconciliation(array_of_phone_numbers)
//getArrMemberNumberData()

 // await getAirtelUser('2567041036460', 2)
 //updatePremiumArr(no_renewal_policies)
}


