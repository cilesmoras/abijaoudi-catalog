import { Banknote, Store, Truck, Wallet } from "lucide-react";
import type { Profile } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

// Surfaces how the owner fulfills orders (delivery / pickup, accepted payment,
// and delivery fee) prominently to customers. Renders nothing when the owner
// has not enabled either option.
export function FulfillmentBanner({ profile }: { profile: Profile }) {
  if (!profile.offers_delivery && !profile.offers_pickup) return null;

  const feeLabel =
    profile.delivery_fee && profile.delivery_fee > 0
      ? `${formatPrice(profile.delivery_fee)} delivery fee`
      : "Free delivery";

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
        {profile.offers_delivery ? (
          <div className="flex items-start gap-2">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900">Delivery available</p>
              <p className="text-blue-800">{feeLabel}</p>
              {profile.delivery_payment_upfront ||
              profile.delivery_payment_cod ? (
                <ul className="mt-1 space-y-0.5 text-blue-800">
                  {profile.delivery_payment_upfront ? (
                    <li className="flex items-center gap-1.5">
                      <Wallet className="h-4 w-4" />
                      Pay upfront
                    </li>
                  ) : null}
                  {profile.delivery_payment_cod ? (
                    <li className="flex items-center gap-1.5">
                      <Banknote className="h-4 w-4" />
                      Cash on delivery
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}

        {profile.offers_pickup ? (
          <div className="flex items-start gap-2">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900">Pickup available</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
