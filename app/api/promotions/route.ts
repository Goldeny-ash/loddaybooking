import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Promotion from "@/lib/models/Promotion";
import Service from "@/lib/models/Service";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  await connectDB();
  
  const url = new URL(req.url);
  const promoId = url.searchParams.get("id");
  const businessIdParam = url.searchParams.get("businessId");
  const now = new Date();

  try {
    if (businessIdParam) {
      if (!mongoose.Types.ObjectId.isValid(businessIdParam)) {
        return NextResponse.json({ success: false, error: "Invalid businessId" }, { status: 400 });
      }

      const promotions = await Promotion.find({
        businessId: businessIdParam,
        active: true,
        $or: [{ startDate: null }, { startDate: { $lte: now } }],
        $and: [{ $or: [{ endDate: null }, { endDate: { $gte: now } }] }],
      })
        .select("title type value promoCode startDate endDate maxRedemptions services")
        .lean();

      return NextResponse.json({ success: true, promotions });
    }

    const business = await getCurrentBusiness({ requireSetup: true });
    if (!business) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (promoId) {
      // Fetch single promotion
      const promotion = await Promotion.findOne({
        _id: promoId,
        businessId: business._id,
      }).populate("services", "_id name");
      if (!promotion) return NextResponse.json({ success: false, error: "Promotion not found" });
      return NextResponse.json({ success: true, promotion });
    }

    // Fetch all promotions for current business only
    const promotions = await Promotion.find({ businessId: business._id }).populate("services", "_id name");
    return NextResponse.json({ success: true, promotions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const business = await getCurrentBusiness({ requireSetup: true });
  if (!business) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const serviceIds: string[] = Array.isArray(body.services) ? body.services : [];
    if (serviceIds.length > 0) {
      const count = await Service.countDocuments({
        _id: { $in: serviceIds },
        businessId: business._id,
      });
      if (count !== serviceIds.length) {
        return NextResponse.json({ success: false, error: "Invalid services for this business" }, { status: 400 });
      }
    }

    const promotion = await Promotion.create({
      ...body,
      businessId: business._id,
    });

    // Optionally link to services
    if (serviceIds.length) {
      await Service.updateMany(
        { _id: { $in: serviceIds }, businessId: business._id },
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
  const business = await getCurrentBusiness({ requireSetup: true });
  if (!business) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!_id) return NextResponse.json({ success: false, error: "Promotion _id is required" });

  try {
    if (data.services) {
      const serviceIds: string[] = Array.isArray(data.services) ? data.services : [];
      const count = await Service.countDocuments({
        _id: { $in: serviceIds },
        businessId: business._id,
      });
      if (count !== serviceIds.length) {
        return NextResponse.json({ success: false, error: "Invalid services for this business" }, { status: 400 });
      }
    }

    const promotion = await Promotion.findOneAndUpdate(
      { _id, businessId: business._id },
      data,
      { new: true }
    );
    if (!promotion) {
      return NextResponse.json({ success: false, error: "Promotion not found" }, { status: 404 });
    }

    // Update linked services
    if (data.services) {
      // Remove promotion from services not in new list
      await Service.updateMany(
        { promotions: _id, businessId: business._id, _id: { $nin: data.services } },
        { $pull: { promotions: _id } }
      );
      // Add promotion to new services
      await Service.updateMany(
        { _id: { $in: data.services }, businessId: business._id },
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
  const business = await getCurrentBusiness({ requireSetup: true });
  if (!business) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!promoId) return NextResponse.json({ success: false, error: "Promotion id required" });

  try {
    // Remove promotion from all services
    await Service.updateMany(
      { promotions: promoId, businessId: business._id },
      { $pull: { promotions: promoId } }
    );

    const promotion = await Promotion.findOneAndDelete({
      _id: promoId,
      businessId: business._id,
    });
    if (!promotion) return NextResponse.json({ success: false, error: "Promotion not found" });

    return NextResponse.json({ success: true, promotion });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
