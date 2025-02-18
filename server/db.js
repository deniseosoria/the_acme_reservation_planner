require("dotenv").config();
const pg = require("pg");
const uuid = require("uuid");

const DATABASE_URL = process.env.DATABASE_URL;

const client = new pg.Client({
  connectionString: DATABASE_URL,
});

const createTables = async () => {
  const SQL = `
    DROP TABLE IF EXISTS reservations;
    DROP TABLE IF EXISTS customers;
    DROP TABLE IF EXISTS restaurants;
    
    CREATE TABLE restaurants(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) NOT NULL
    );

    CREATE TABLE customers(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) NOT NULL
    );

    CREATE TABLE reservations(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      party_count INTEGER NOT NULL CHECK (party_count > 0),
      restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE
    );
  `;

  await client.query(SQL);
};

const createCustomer = async (name) => {
  const SQL = `
      INSERT INTO customers(name) VALUES($1) RETURNING *
  `;
  const response = await client.query(SQL, [name]);
  return response.rows[0];
};

const createRestaurant = async (name) => {
  const SQL = `
      INSERT INTO restaurants(name) VALUES($1) RETURNING *
  `;
  const response = await client.query(SQL, [name]);
  return response.rows[0];
};

const createReservation = async ({
  restaurant_id,
  customer_id,
  party_count,
  date,
}) => {
  const SQL = `
      INSERT INTO reservations(restaurant_id, customer_id, party_count, date) 
      VALUES($1, $2, $3, $4) RETURNING *
  `;
  const response = await client.query(SQL, [
    restaurant_id,
    customer_id,
    party_count,
    date,
  ]);
  return response.rows[0];
};

const fetchCustomers = async () => {
  const SQL = `SELECT * FROM customers`;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchRestaurants = async () => {
  const SQL = `SELECT * FROM restaurants`;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchReservations = async () => {
  const SQL = `SELECT * FROM reservations`;
  const response = await client.query(SQL);
  return response.rows;
};

const destroyReservation = async ({ id, customer_id }) => {
  if (!id || !customer_id) {
    throw new Error("Missing reservation ID or customer ID.");
  }

  const SQL = `
      DELETE FROM reservations
      WHERE id = $1 AND customer_id = $2
  `;
  await client.query(SQL, [id, customer_id]);
};

const init = async () => {
  await client.connect();

  await createTables();
};

module.exports = {
  init,
  createCustomer,
  createRestaurant,
  createReservation,
  fetchCustomers,
  fetchRestaurants,
  fetchReservations,
  destroyReservation,
};
