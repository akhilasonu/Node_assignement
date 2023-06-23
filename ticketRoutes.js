const express = require('express');
const router = express.Router();
const Ticket = require('../models/ticket');

// Create a new ticket
router.post('/', verifyToken, async (req, res) => {
  try {
    const { customerName, movieTitle, movieTime, ticketPrice } = req.body;
    const ticket = new Ticket({
      customerName,
      movieTitle,
      movieTime,
      ticketPrice,
    });
    const savedTicket = await ticket.save();
    res.json(savedTicket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tickets
router.get('/', verifyToken, async (req, res) => {
  try {
    const tickets = await Ticket.find();
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a ticket
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { customerName, movieTitle, movieTime, ticketPrice } = req.body;
    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { customerName, movieTitle, movieTime, ticketPrice },
      { new: true }
    );
    res.json(updatedTicket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a ticket
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deletedTicket = await Ticket.findByIdAndDelete(req.params.id);
    res.json(deletedTicket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Token verification middleware
function verifyToken(req, res, next) {
  const token = req.header('Authorization');
  if (token === 'your-constant-token') {
    next();
  } else {
    res.status(401).json({ error: err.message });
  }
};

// Analytics - Profit by movie between 2 dates
router.get('/analytics/profit', verifyToken, async (req, res) => {
    const { startDate, endDate } = req.query;
  
    try {
      let analyticsData;
      if (req.query.method === 'db-aggregation') {
        // DB aggregation method
        analyticsData = await Ticket.aggregate([
          {
            $match: {
              creationDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
          },
          {
            $group: {
              _id: { $month: '$creationDate' },
              summaryProfit: { $sum: '$ticketPrice' },
            },
          },
          {
            $project: {
              _id: 0,
              month: { $dateToString: { format: '%B', date: '$creationDate' } },
              summaryProfit: 1,
            },
          },
        ]);
      } else {
        // JS algorithm method
        const tickets = await Ticket.find({
          creationDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        });
  
        analyticsData = tickets.reduce((result, ticket) => {
          const month = ticket.creationDate.toLocaleString('default', { month: 'long' });
          const index = result.findIndex((entry) => entry.month === month);
  
          if (index === -1) {
            result.push({ month, summaryProfit: ticket.ticketPrice });
          } else {
            result[index].summaryProfit += ticket.ticketPrice;
          }
  
          return result;
        }, []);
      }
  
      res.json(analyticsData);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Analytics - Visits by movie between 2 dates
  router.get('/analytics/visited', verifyToken, async (req, res) => {
    const { startDate, endDate } = req.query;
  
    try {
      let analyticsData;
      if (req.query.method === 'db-aggregation') {
        // DB aggregation method
        analyticsData = await Ticket.aggregate([
          {
            $match: {
              creationDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
          },
          {
            $group: {
              _id: { $month: '$creationDate' },
              summaryVisits: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              month: { $dateToString: { format: '%B', date: '$creationDate' } },
              summaryVisits: 1,
            },
          },
        ]);
      } else {
        // JS algorithm method
        const tickets = await Ticket.find({
          creationDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        });
  
        analyticsData = tickets.reduce((result, ticket) => {
          const month = ticket.creationDate.toLocaleString('default', { month: 'long' });
          const index = result.findIndex((entry) => entry.month === month);
  
          if (index === -1) {
            result.push({ month, summaryVisits: 1 });
          } else {
            result[index].summaryVisits += 1;
          }
  
          return result;
        }, []);
      }
  
      res.json(analyticsData);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
