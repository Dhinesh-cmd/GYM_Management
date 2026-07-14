const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Helper to convert number of month digits to words
function formatMonthName(monthStr) {
  if (!monthStr) return 'N/A';
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month) - 1, 1);
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

// @route   GET /api/sales/report
// @desc    Retrieve analytical sales statistics and chart data
router.get('/report', auth, async (req, res) => {
  const { filter = 'past_3_months' } = req.query;
  const today = new Date().toISOString().split('T')[0];
  let startDate = '1970-01-01';

  // Calculate boundary start date
  const now = new Date();
  switch (filter) {
    case 'past_month':
      now.setMonth(now.getMonth() - 1);
      startDate = now.toISOString().split('T')[0];
      break;
    case 'past_3_months':
      now.setMonth(now.getMonth() - 3);
      startDate = now.toISOString().split('T')[0];
      break;
    case 'past_6_months':
      now.setMonth(now.getMonth() - 6);
      startDate = now.toISOString().split('T')[0];
      break;
    case 'past_year':
      now.setFullYear(now.getFullYear() - 1);
      startDate = now.toISOString().split('T')[0];
      break;
    case 'lifetime':
    default:
      startDate = '1970-01-01';
  }

  try {
    // 1. Core Summary Metrics
    const summaryQuery = `
      SELECT 
        SUM(amount) as totalRevenue,
        SUM(CASE WHEN type = 'Renewal' THEN amount ELSE 0 END) as renewalRevenue,
        SUM(CASE WHEN type = 'Renewal' THEN 1 ELSE 0 END) as totalRenewals,
        SUM(CASE WHEN type = 'New' THEN 1 ELSE 0 END) as newCustomers,
        COUNT(id) as totalTransactions
      FROM payments
      WHERE payment_date >= ? AND payment_date <= ?;
    `;
    const summary = await db.get(summaryQuery, [startDate, today]);

    // 2. Monthly Revenue Data (for Bar Chart)
    const monthlyQuery = `
      SELECT strftime('%Y-%m', payment_date) as month, SUM(amount) as total
      FROM payments
      WHERE payment_date >= ? AND payment_date <= ?
      GROUP BY month
      ORDER BY month ASC;
    `;
    const monthlySales = await db.all(monthlyQuery, [startDate, today]);

    // Find Highest and Lowest Sales Months
    let highestMonth = { name: 'N/A', amount: 0 };
    let lowestMonth = { name: 'N/A', amount: Infinity };

    monthlySales.forEach(item => {
      const monthName = formatMonthName(item.month);
      if (item.total > highestMonth.amount) {
        highestMonth = { name: monthName, amount: item.total };
      }
      if (item.total < lowestMonth.amount) {
        lowestMonth = { name: monthName, amount: item.total };
      }
    });

    if (monthlySales.length === 0) {
      lowestMonth.amount = 0;
    }

    // 3. Membership Type Distribution (for Pie Chart)
    const distributionQuery = `
      SELECT membership_type, COUNT(id) as count, SUM(amount) as revenue
      FROM payments
      WHERE payment_date >= ? AND payment_date <= ?
      GROUP BY membership_type
      ORDER BY count DESC;
    `;
    const membershipDistribution = await db.all(distributionQuery, [startDate, today]);

    // 4. Renewal vs New Trends by Month (for Line Chart)
    const trendQuery = `
      SELECT 
        strftime('%Y-%m', payment_date) as month,
        SUM(CASE WHEN type = 'Renewal' THEN amount ELSE 0 END) as renewalRevenue,
        SUM(CASE WHEN type = 'New' THEN amount ELSE 0 END) as newRevenue,
        SUM(CASE WHEN type = 'Renewal' THEN 1 ELSE 0 END) as renewalCount,
        SUM(CASE WHEN type = 'New' THEN 1 ELSE 0 END) as newCount
      FROM payments
      WHERE payment_date >= ? AND payment_date <= ?
      GROUP BY month
      ORDER BY month ASC;
    `;
    const trends = await db.all(trendQuery, [startDate, today]);

    // Transform trend labels to human-readable month names
    const barChartData = {
      labels: monthlySales.map(m => formatMonthName(m.month)),
      data: monthlySales.map(m => m.total)
    };

    const pieChartData = {
      labels: membershipDistribution.map(d => d.membership_type),
      data: membershipDistribution.map(d => d.count),
      revenue: membershipDistribution.map(d => d.revenue)
    };

    const lineChartData = {
      labels: trends.map(t => formatMonthName(t.month)),
      renewalsCount: trends.map(t => t.renewalCount),
      newCount: trends.map(t => t.newCount),
      renewalsRevenue: trends.map(t => t.renewalRevenue),
      newRevenue: trends.map(t => t.newRevenue)
    };

    res.json({
      summary: {
        totalRevenue: summary.totalRevenue || 0,
        renewalRevenue: summary.renewalRevenue || 0,
        totalRenewals: summary.totalRenewals || 0,
        newCustomers: summary.newCustomers || 0,
        totalTransactions: summary.totalTransactions || 0,
        highestSalesMonth: highestMonth,
        lowestSalesMonth: lowestMonth
      },
      charts: {
        barChart: barChartData,
        pieChart: pieChartData,
        lineChart: lineChartData
      }
    });

  } catch (err) {
    console.error('Fetch sales report error:', err);
    res.status(500).json({ error: 'Server error generating sales analytics.' });
  }
});

module.exports = router;
