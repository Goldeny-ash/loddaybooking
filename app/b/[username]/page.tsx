// app/b/[username]/page.tsx
import { notFound } from "next/navigation";
import PublicBookingPageClient from "@/components/public/PublicBookingPageClient"; // client wrapper
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";
import ReferenceImage from "@/lib/models/ReferenceImage";
import { getTheme } from "@/lib/theme";
interface PageProps {
  params: {
    username: string;
  };
}

export default async function PublicBookingPage(props: PageProps) {
  // In App Router, params comes under props.params
  // and is sometimes wrapped in a Promise in TS types
  const params = await props.params;
  const username = params?.username;
  if (!username) notFound();

  await connectDB();

  const business = await Business.findOne({ username }).lean();
  if (!business) notFound();

  if (process.env.NODE_ENV === "development") business.access = { status: "ACTIVE" };
  const status = business.access?.status || "ACTIVE";

  const servicesRaw = await Service.find({ businessId: business._id }).lean();
  const services = servicesRaw.map((s) => ({ ...s, _id: s._id.toString() }));

  const referenceImagesRaw = await ReferenceImage.find({ businessId: business._id }).lean();
  const referenceImages = referenceImagesRaw.map((r) => ({ ...r, _id: r._id.toString() }));

  const theme = getTheme(business);

  return (
    <PublicBookingPageClient
      business={business}
      status={status}
      services={services}
      referenceImages={referenceImages}
      theme={theme}
    />
  );
}
