const express = require("express");
const app = express();

const {
  createCustomer,
  createRestaurant,
  createReservation,
  fetchCustomers,
  fetchRestaurants,
  fetchReservations,
  destroyReservation,
} = require("./db");

const db = require("./db");

app.use(express.json());

// GET /api/customers: Returns an array of customers.
app.get("/api/customers", async (req, res, next) => {
  try {
    res.send(await fetchCustomers());
  } catch (ex) {
    next(ex);
  }
});

// GET /api/restaurants: Returns an array of restaurants.
app.get("/api/restaurants", async (req, res, next) => {
  try {
    res.send(await fetchRestaurants());
  } catch (ex) {
    next(ex);
  }
});

// GET /api/reservations: Returns an array of reservations.
app.get("/api/reservations", async (req, res, next) => {
  try {
    res.send(await fetchReservations());
  } catch (ex) {
    next(ex);
  }
});

// POST /api/customers/:id/reservations: Has an object containing a valid restaurant_id, date, and party_count as the payload, and returns the created reservation with a status code of 201.
app.post("/api/customers/:customer_id/reservations", async (req, res, next) => {
  try {
    const customer_id = req.params.customer_id; // From URL
    const { restaurant_id, party_count, date } = req.body; // From request body

    if (!customer_id || !restaurant_id || !party_count || !date) {
      return res.status(400).send({ error: "Missing required fields." });
    }

    const reservation = await createReservation({
      customer_id,
      restaurant_id,
      party_count,
      date,
    });
    res.status(201).send(reservation);
  } catch (ex) {
    next(ex);
  }
});

// DELETE /api/customers/:customer_id/reservations/:id:  In the URL, gets passed the id of the reservation to delete and the customer_id, and returns nothing with a status code of 204.
app.delete(
  "/api/customers/:customer_id/reservations/:id",
  async (req, res, next) => {
    try {
      await destroyReservation({
        customer_id: req.params.customer_id,
        id: req.params.id,
      });
      res.sendStatus(204);
    } catch (ex) {
      next(ex);
    }
  }
);

//error handling route that returns an object with an error property.
app.use((err, req, res, next) => {
  res.status(err.status || 500).send({ error: err.message || err });
});

const init = async () => {
  await db.init(); // Ensure database is initialized before inserting data

  // Create customers and restaurants properly
  const moe = await createCustomer("moe");
  const lucy = await createCustomer("lucy");
  const larry = await createCustomer("larry");
  const ethyl = await createCustomer("ethyl");

  const sweetScience = await createRestaurant("SweetScience");
  const smiths = await createRestaurant("Smiths");
  const chuys = await createRestaurant("Chuys");

  const reservation1 = await createReservation({
    customer_id: moe.id,
    restaurant_id: smiths.id,
    party_count: 4,
    date: "2024-02-14", // YYYY-MM-DD format
  });

  const reservation2 = await createReservation({
    customer_id: moe.id,
    restaurant_id: smiths.id,
    party_count: 2,
    date: "2024-02-28", // YYYY-MM-DD format
  });

  await destroyReservation({ id: reservation2.id, customer_id: moe.id });

  const port = process.env.PORT || 3001;
};

init();
