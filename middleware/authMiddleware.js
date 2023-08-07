// middleware/authMiddleware.js
module.exports = {
    ensureAuthenticated: function(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect('/login'); // Redirect to the login page if the user is not authenticated
    }
  };
  