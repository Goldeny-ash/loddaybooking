import ReviewForm from "@/components/reviews/ReviewForm";

interface BookingReviewPageProps {
  params: { bookingId: string };
  searchParams?: { token?: string };
}

export default function BookingReviewPage({ params, searchParams }: BookingReviewPageProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(120deg,#FFECD1_0%,#C2E0E0_100%)] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-center font-serif text-4xl text-[#001524]">Appointment Review</h1>
        <p className="mb-8 text-center text-sm text-[#29454A]">
          Tell others how your appointment went.
        </p>
        <ReviewForm
          bookingId={params.bookingId}
          token={searchParams?.token}
          source="email"
          defaultReviewType="business"
          fixedReviewType="business"
        />
      </div>
    </main>
  );
}
