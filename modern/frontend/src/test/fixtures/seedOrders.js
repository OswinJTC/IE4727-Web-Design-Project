// The 15 sample orders from traditional/sql/seed.sql. `ago` is how long before first load the order was placed.
export const seedOrders = [
  { id: 1, userId: 1, ago: { days: 30 }, payment: "cash", notes: null, status: "Delivered", total: 15.4, items: [[1, 2, 5.5], [9, 2, 2.2]] },
  { id: 2, userId: 2, ago: { days: 28 }, payment: "card", notes: "Less spicy please", status: "Delivered", total: 20.4, items: [[3, 2, 7.2], [5, 1, 3.5], [10, 1, 2.5]] },
  { id: 3, userId: 3, ago: { days: 26 }, payment: "paynow", notes: null, status: "Delivered", total: 32.7, items: [[1, 3, 5.5], [9, 3, 2.2], [13, 2, 4.8]] },
  { id: 4, userId: 4, ago: { days: 24 }, payment: "cash", notes: null, status: "Delivered", total: 32.2, items: [[2, 2, 9.8], [6, 2, 4.2], [14, 1, 4.2]] },
  { id: 5, userId: 5, ago: { days: 21 }, payment: "card", notes: "Leave at the door", status: "Delivered", total: 32.4, items: [[1, 2, 5.5], [3, 2, 7.2], [11, 2, 3.5]] },
  { id: 6, userId: 1, ago: { days: 18 }, payment: "paynow", notes: null, status: "Delivered", total: 29.4, items: [[4, 2, 6.5], [7, 2, 6.0], [9, 2, 2.2]] },
  { id: 7, userId: 2, ago: { days: 15 }, payment: "cash", notes: null, status: "Delivered", total: 40.3, items: [[1, 4, 5.5], [5, 3, 3.5], [15, 2, 3.9]] },
  { id: 8, userId: 3, ago: { days: 12 }, payment: "card", notes: null, status: "Delivered", total: 33.6, items: [[3, 3, 7.2], [9, 2, 2.2], [8, 2, 3.8]] },
  { id: 9, userId: 4, ago: { days: 9 }, payment: "paynow", notes: "Ring the bell twice", status: "Delivered", total: 29.9, items: [[1, 3, 5.5], [5, 2, 3.5], [12, 2, 3.2]] },
  { id: 10, userId: 5, ago: { days: 6 }, payment: "cash", notes: null, status: "Delivered", total: 53.7, items: [[2, 3, 9.8], [3, 2, 7.2], [9, 2, 2.2], [16, 1, 5.5]] },
  { id: 11, userId: 1, ago: { days: 3 }, payment: "card", notes: null, status: "Out for delivery", total: 29.9, items: [[1, 3, 5.5], [6, 2, 4.2], [10, 2, 2.5]] },
  { id: 12, userId: 2, ago: { days: 2 }, payment: "paynow", notes: null, status: "Preparing", total: 41.1, items: [[3, 2, 7.2], [5, 3, 3.5], [9, 3, 2.2], [13, 2, 4.8]] },
  { id: 13, userId: 3, ago: { days: 1 }, payment: "cash", notes: "No chilli", status: "Pending", total: 36.3, items: [[4, 2, 6.5], [7, 2, 6.0], [11, 1, 3.5], [15, 2, 3.9]] },
  { id: 14, userId: 4, ago: { days: 10 }, payment: "cash", notes: "Changed my mind", status: "Cancelled", total: 33.4, items: [[10, 10, 2.5], [14, 2, 4.2]] },
  { id: 15, userId: 5, ago: { days: 0 }, payment: "card", notes: null, status: "Pending", total: 17.3, items: [[1, 1, 5.5], [13, 1, 4.8], [8, 1, 3.8], [12, 1, 3.2]] },
];
