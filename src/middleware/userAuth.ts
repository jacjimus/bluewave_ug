//importing modules

const jwt = require('jsonwebtoken');

//only admin middleware

function isBluewave(req:any, res:any, next:any) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      console.log("USER: ",user)
      if (err) {
        return res.status(403).json({ message: 'Token is not valid' });
      }
      if (user.partner_id == 1 && user.role === 'superadmin') {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: 'You are not authorized to access this resource' });
      }
    });
  } else {
    return res.status(401).json({ message: 'Authorization header is required' });
  }
}

function isAirtel(req:any, res:any, next:any) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      console.log("USER: ",user)
      if (err) {
        return res.status(403).json({ message: 'Token is not valid' });
      }
      if (user.partner_id  === 2 && user.role === 'superadmin') {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: 'You are not authorized to access this resource' });
      }
    });
  } else {
    return res.status(401).json({ message: 'Authorization header is required' });
  }
}


function isVodacom(req:any, res:any, next:any) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      console.log("USER: ",user)
      if (err) {
        return res.status(403).json({ message: 'Token is not valid' });
      }
      if (user.partner_id == 3 && user.role === 'superadmin') {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: 'You are not authorized to access this resource' });
      }
    });
  } else {
    return res.status(401).json({ message: 'Authorization header is required' });
  }
}


function isAAR(req:any, res:any, next:any) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      console.log("USER: ",user)
      if (err) {
        return res.status(403).json({ message: 'Token is not valid' });
      }
      if (user.partner_id == 4 && user.role === 'superadmin') {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: 'You are not authorized to access this resource' });
      }
    });
  } else {
    return res.status(401).json({ message: 'Authorization header is required' });
  }
}


function isUser(req:any, res:any, next:any) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      console.log("USER: ",user)
      if (err) {
        return res.status(403).json({ message: 'Token is not valid' });
      }
      if (user.role === 'user' ) {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: 'You are not authorized to access this resource' });
      }
    });
  } else {
    return res.status(401).json({ message: 'Authorization header is required' });
  }
}

// isUserOrAdmin
function isUserOrAdmin(req:any, res:any, next:any) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      console.log("USER: ",user)

      if (err) {
        return res.status(403).json({ message: 'Token is not valid' });
      }
      if (user.role === 'user' || user.role === 'admin' ) {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: 'You are not authorized to access this resource' });
      }

    });

  } else {

    return res.status(401).json({ message: 'Authorization header is required' });

  }

}



function isManager(req:any, res:any, next:any) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      console.log("USER: ",user)
      if (err) {
        return res.status(403).json({ message: 'Token is not valid' });
      }
      if (user.role === 'manager' ) {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: 'You are not authorized to access this resource' });
      }
    });
  } else {
    return res.status(401).json({ message: 'Authorization header is required' });
  }
}

function isSuperAdmin(req:any, res:any, next:any) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      console.log("USER: ",user)
      if (err) {
        return res.status(403).json({ message: 'Token is not valid' });
      }
      if (user.role === 'superadmin' ) {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: 'You are not authorized to access this resource' });
      }
    });
  } else {
    return res.status(401).json({ message: 'Authorization header is required' });
  }
}


//isUserOrAdminOrManager
function isUserOrAdminOrManager(req:any, res:any, next:any) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      console.log("USER: ",user)

      if (err) {
        return res.status(403).json({ message: 'Token is not valid' });
      }

      if (user.role === 'user' || user.role === 'admin' || user.role === 'manager' ) {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: 'You are not authorized to access this resource' });
      }

    });

  } else {

    return res.status(401).json({ message: 'Authorization header is required' });

  }

}



//exporting module
 module.exports = {
  isBluewave,
  isAirtel,
  isVodacom,
  isUser,
  isManager,
  isSuperAdmin,
  isUserOrAdmin,
  isUserOrAdminOrManager

};