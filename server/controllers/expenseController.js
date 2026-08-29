import Expense from '../models/Expense.js';

// GET /api/expenses
export const getExpenses = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'vehicle_owner') filter.owner = req.user._id;
    if (req.query.vehicle) filter.vehicle = req.query.vehicle;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.startDate && req.query.endDate) {
      filter.date = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
    }

    const expenses = await Expense.find(filter)
      .populate('vehicle', 'manufacturer model registrationNumber')
      .sort('-date');

    res.status(200).json({ ok: true, count: expenses.length, expenses });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/expenses
export const createExpense = async (req, res) => {
  try {
    const expenseData = { ...req.body, owner: req.user._id };
    if (req.file) expenseData.billImage = `/uploads/${req.file.filename}`;
    const expense = await Expense.create(expenseData);
    res.status(201).json({ ok: true, expense });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// PUT /api/expenses/:id
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ ok: false, error: 'Expense not found' });
    res.status(200).json({ ok: true, expense });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// DELETE /api/expenses/:id
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ ok: false, error: 'Expense not found' });
    res.status(200).json({ ok: true, message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// GET /api/expenses/report
export const getExpenseReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    const filter = { owner: req.user._id };

    if (year) {
      const startDate = new Date(parseInt(year), month ? parseInt(month) - 1 : 0, 1);
      const endDate = month
        ? new Date(parseInt(year), parseInt(month), 0)
        : new Date(parseInt(year), 11, 31);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const expenses = await Expense.find(filter).sort('date');

    const categoryBreakdown = {};
    let totalSpent = 0;

    expenses.forEach((e) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
      totalSpent += e.amount;
    });

    const monthlyTrend = {};
    expenses.forEach((e) => {
      const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend[key] = (monthlyTrend[key] || 0) + e.amount;
    });

    res.status(200).json({
      ok: true,
      report: {
        totalSpent: Math.round(totalSpent),
        totalTransactions: expenses.length,
        categoryBreakdown,
        monthlyTrend: Object.entries(monthlyTrend).map(([month, amount]) => ({ month, amount: Math.round(amount) })),
        topExpenses: expenses.sort((a, b) => b.amount - a.amount).slice(0, 5).map((e) => ({
          id: e._id,
          category: e.category,
          amount: e.amount,
          date: e.date,
          description: e.description,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
