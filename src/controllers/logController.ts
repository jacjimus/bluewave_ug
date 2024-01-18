
import { db } from "../models/db";
const LogModel = db.logs;

  /**
 * @swagger
 * /api/v1/logs/system:
 *   get:
 *     tags:
 *       - Logs
 *     description:  Get all logs
 *     operationId:  getLogs
 *     summary: 
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *       - name: user_id
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
  const getLogs = async (req: any, res: any) => {
    try {
      const partner_id = req.query.partner_id;
      const user_id = req.query.user_id;

        // Retrieve page and limit from query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default limit is 10
        
        // Calculate offset based on current page and limit
        const offset = (page - 1) * limit;
      const {logs, totalLogsCount } = await fetchLogsFromDatabase( partner_id, user_id, offset, limit);

      res.status(200).json({
        message: 'Information fetched successfully',
        logs: logs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalLogsCount / limit),
          totalLogs: totalLogsCount
        }
      });
    } catch (error) {
      res.status(400).json({
        message: 'Invalid request',
        error: error.message
      });
    }
  };

  const fetchLogsFromDatabase = async ( partner_id: any, user_id: string, offset: number, limit: number ) => {
    let whereCondition: any = {
      partner_id: partner_id
    };
  
    if (user_id) {
      whereCondition.user = user_id;
    }
  
    // Example query using Sequelize
    let logs = await LogModel.findAll({
      where: whereCondition,
      offset: offset,
      limit: limit
    });
  
    // Calculate total logs count based on the query result
    const totalLogsCount = await LogModel.count({
      where: whereCondition
    });
  
    return { logs, totalLogsCount };
  };
  


  /**
 * @swagger
 * /api/v1/logs/session:
 *   get:
 *     tags:
 *       - Logs
 *     description:  Get all sessions
 *     operationId:  getSessions
 *     summary: 
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *       - name: user_id
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: phone_number
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
  const getSessions = async (req: any, res: any) => {
    try {
      const partner_id = parseInt(req.query.partner_id)
      const user_id = req.query.user_id;
      const phone_number = req.query.phone_number;
      
      // Retrieve page and limit from query parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10; // Default limit is 10
      
      // Calculate offset based on current page and limit
      const offset = (page - 1) * limit;
      
      // Fetch sessions from the database with pagination
      const { sessions, totalSessionsCount } = await fetchSessionsFromDatabase(partner_id, user_id,phone_number, offset, limit);
      console.log("SESSIONS ",sessions);

      
      // Return pagination information along with sessions
      res.status(200).json({
        message: 'Information fetched successfully',
        sessions: sessions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalSessionsCount / limit),
          totalSessions: totalSessionsCount
        }
      });
    } catch (error) {
      console.log("ERROR ",error);
      res.status(400).json({
        code: 400,
        message: 'Invalid request',
        error: error.message
      });
    }
  };
  
  const fetchSessionsFromDatabase = async (partner_id: any, user_id: string, phone_number: any, offset: number, limit: number) => {
    // Your database fetching logic with offset and limit goes here
    let whereCondition: any = {
      partner_id: partner_id
    };
  
    if (user_id && !phone_number) {
      whereCondition.user_id = user_id;
    }

    if(phone_number && !user_id){
      whereCondition.phonenumber = phone_number;
    }
 

    if(phone_number && user_id){
      whereCondition = {
        partner_id: partner_id,
        user_id: user_id,
        phonenumber: phone_number
      };
    }
console.log("WHERE ",whereCondition);
  
    // Example query using Sequelize
    let sessions = await  db.sessions.findAll({
      where: whereCondition,
      offset: offset,
      limit: limit
    });
    console.log("SESSIONS ",sessions);
    
    // Calculate total sessions count based on the query result
    const totalSessionsCount = await  db.sessions.count({
      where: whereCondition
    });
  
    return { sessions, totalSessionsCount };
  };


  async function ussdSessions(req, res){
   try {
    const {sessionId,networkCode, durationInMillis, errorMessage,serviceCode,lastAppResponse, hopsCount,phoneNumber, cost, date, input, status, partner_id=2} = req.body;
   

    await db.sessions.create({
      sessionid: sessionId,
      networkcode: networkCode,
      durationinmillis: durationInMillis,
      errormessage: errorMessage,
      servicecode: serviceCode,
      lastappresponse: lastAppResponse,
      hopscount: hopsCount,
      phonenumber: phoneNumber,
      cost: cost,
      date: date,
      input: input,
      status: status,
      partner_id: partner_id 
    });


   
    //let response = '';
   res.status(200).json({
      message: 'Sessions fetched successfully from AfricanStalking',
      sessions: req.body,
     
    });
    
   } catch (error) {
    res.status(400).json({
      code: 400,
      message: 'Invalid request',
      error: error.message
    });
    
   }
  }
  
module.exports = {
    ussdSessions,
    getLogs ,
    getSessions

    };