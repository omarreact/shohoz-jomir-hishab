import { Suspense } from "react";
import PinPayCheckout from "@/src/features/pinpay/components/PinPayCheckout";

function PaymentPage({ searchParams }: { searchParams: Promise<{ tran_id?: string }> }) {
  // Render the awaited search params inside a Suspense child.
  return <CheckoutResolver searchParams={searchParams} />;
}

async function CheckoutResolver({ searchParams }: { searchParams: Promise<{ tran_id?: string }> }) {
  const params = await searchParams;
  if (!params.tran_id || !/^LBD[A-F0-9]{24}$/.test(params.tran_id)) {
    return <main className="mx-auto max-w-xl px-4 py-24 text-center">অবৈধ PinPay অর্ডার লিংক।</main>;
  }
  return <PinPayCheckout orderId={params.tran_id} />;
}

export default function Page(props: { searchParams: Promise<{ tran_id?: string }> }) {
  return <Suspense fallback={<p className="p-8 text-center">PinPay লোড হচ্ছে…</p>}><PaymentPage {...props} /></Suspense>;
}
