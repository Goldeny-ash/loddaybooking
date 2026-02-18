import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const subscriptionId = url.pathname.split("/")[5];

  const response = await axios.get(
    `https://api.intasend.com/api/v1/subscriptions/${subscriptionId}/transactions/`,
    {
      headers: {
        Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
      },
    }
  );

  return NextResponse.json(response.data);
}
