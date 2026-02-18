import axios from "axios";

const BASE_URL = "https://api.intasend.com";

if (!process.env.INTASEND_SECRET_KEY) {
  throw new Error("INTASEND_SECRET_KEY is not defined");
}

const headers = {
  Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
  "Content-Type": "application/json",
};

/* -------------------------------------------------------
   Create Subscription Customer
------------------------------------------------------- */
export async function createCustomer({
  email,
  firstName,
  lastName,
  reference,
  country,
  address,
  city,
  state,
  zipcode,
}: {
  email: string;
  firstName: string;
  lastName: string;
  reference: string;
  country: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}) {
  const response = await axios.post(
    `${BASE_URL}/api/v1/subscriptions-customers/`,
    {
      email,
      first_name: firstName,
      last_name: firstName,
      reference,
      country,
      address,
      city,
      state,
      zipcode,
    },
    { headers }
  );

  return response.data;
}

/* -------------------------------------------------------
   Create Subscription
------------------------------------------------------- */
export async function createSubscription({
  customerId,
  planId,
  reference,
  startDate,
  redirectUrl,
}: {
  customerId: string;
  planId: string;
  reference: string;
  startDate: string;
  redirectUrl: string;
}) {
  const response = await axios.post(
    `${BASE_URL}/api/v1/subscriptions/`,
    {
      customer_id: customerId,
      plan_id: planId,
      reference,
      start_date: startDate,
      redirect_url: redirectUrl,
    },
    { headers }
  );

  return response.data;
}
