import { NextResponse } from "next/server";
import {
  createAuthorityCustomerAccessHandoffPath,
  createAuthorityCustomerAccessToken,
  createAuthorityOrder,
  CUSTOMER_ACCESS_COOKIE,
  CUSTOMER_ACCESS_MAX_AGE_SECONDS,
  OrderAuthorityError,
  RECENT_ORDER_COOKIE,
  RECENT_ORDER_MAX_AGE_SECONDS,
} from "@/lib/order-authority";
import { listAuthorityNotificationsForOrder } from "@/lib/notification-authority";
import { ProviderGatewayError } from "@/lib/provider-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown order authority error.";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      items?: unknown;
      checkout?: unknown;
    };

    const checkout =
      body.checkout && typeof body.checkout === "object"
        ? body.checkout
        : null;

    if (!Array.isArray(body.items) || !checkout) {
      return NextResponse.json(
        {
          error:
            "Body الطلب غير صالح. يجب إرسال items وcheckout بشكل واضح.",
        },
        { status: 400 },
      );
    }

    const { order, recentOrderToken } = await createAuthorityOrder({
      items: body.items,
      checkout: checkout as Parameters<typeof createAuthorityOrder>[0]["checkout"],
    });
    const notifications = await listAuthorityNotificationsForOrder(order);

    const response = NextResponse.json(
      {
        order,
        notifications,
        customerAccessHandoffPath:
          await createAuthorityCustomerAccessHandoffPath(order),
      },
      { status: 201 },
    );

    response.cookies.set({
      name: RECENT_ORDER_COOKIE,
      value: recentOrderToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: RECENT_ORDER_MAX_AGE_SECONDS,
    });

    response.cookies.set({
      name: CUSTOMER_ACCESS_COOKIE,
      value: await createAuthorityCustomerAccessToken(order),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: CUSTOMER_ACCESS_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    if (
      error instanceof OrderAuthorityError ||
      error instanceof ProviderGatewayError
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
