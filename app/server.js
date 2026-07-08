const app = require('./app');
const PORT = process.env.PORT || 3000;

// Start listening
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`QuantumTask Backend Server is Active!`);
  console.log(`Serving on: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
