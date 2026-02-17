import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Promotion from "@/lib/models/Promotion";
import Service from "@/lib/models/Service";

export async function GET(req: NextRequest) {
  await connectDB();
  
  const url = new URL(req.url);
  const promoId = url.searchParams.get("id");

  try {
    if (promoId) {
      // Fetch single promotion
      const promotion = await Promotion.findById(promoId).populate("services");
      if (!promotion) return NextResponse.json({ success: false, error: "Promotion not found" });
      return NextResponse.json({ success: true, promotion });
    }

    // Fetch all promotions
    const promotions = await Promotion.find().populate("services");
    return NextResponse.json({ success: true, promotions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();

  try {
    const promotion = await Promotion.create(body);

    // Optionally link to services
    if (body.services?.length) {
      await Service.updateMany(
        { _id: { $in: body.services } },
        { $addToSet: { promotions: (promotion as any)._id } }
      );
    }

    return NextResponse.json({ success: true, promotion });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function PUT(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { _id, ...data } = body;

  if (!_id) return NextResponse.json({ success: false, error: "Promotion _id is required" });

  try {
    const promotion = await Promotion.findByIdAndUpdate(_id, data, { new: true });

    // Update linked services
    if (data.services) {
      // Remove promotion from services not in new list
      await Service.updateMany(
        { promotions: _id, _id: { $nin: data.services } },
        { $pull: { promotions: _id } }
      );
      // Add promotion to new services
      await Service.updateMany(
        { _id: { $in: data.services } },
        { $addToSet: { promotions: _id } }
      );
    }

    return NextResponse.json({ success: true, promotion });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function DELETE(req: NextRequest) {
  await connectDB();
  const url = new URL(req.url);
  const promoId = url.searchParams.get("id");

  if (!promoId) return NextResponse.json({ success: false, error: "Promotion id required" });

  try {
    // Remove promotion from all services
    await Service.updateMany(
      { promotions: promoId },
      { $pull: { promotions: promoId } }
    );

    const promotion = await Promotion.findByIdAndDelete(promoId);
    if (!promotion) return NextResponse.json({ success: false, error: "Promotion not found" });

    return NextResponse.json({ success: true, promotion });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
