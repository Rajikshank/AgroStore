"use client";

import { useCartStore } from "@/lib/client-store";
import {
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button } from "../ui/button";
import { useState } from "react";
import { createPaymentIntent } from "@/server/actions/create-paymnet-intent";
import { useAction } from "next-safe-action/hooks";
import { createOrder } from "@/server/actions/create-order";
import { toast } from "@/hooks/use-toast";

export default function PaymentForm({ totalPrice }: { totalPrice: number }) {
  const stripe = useStripe();

  const elements = useElements();
  const { cart, setCheckoutProgress, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { execute } = useAction(createOrder, {
    onError(data) {
      console.log("getting error", data);
    },

    onSuccess(data) {
      if (data.error) {
        toast({
          variant: "destructive",
          title: data.error,
        });
      }

      if (data.success) {
        setIsLoading(false);
        toast({
          variant: "success",
          title: data.success,
        });
        setCheckoutProgress("confirmation-page");
        clearCart();
      }
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    const { error: submitError } = await elements.submit();

    if (submitError) {
      setErrorMessage(submitError.message!);
      setIsLoading(false);
    }

    const { data } = await createPaymentIntent({
      amount: totalPrice * 100,
      currency: "usd",
      cart: cart.map((item) => ({
        quantity: item.variant.quantity,
        productID: item.id,
        title: item.name,
        price: item.price,
        image: item.image,
      })),
    });

    if (data?.error) {
      console.log("error", data.error);
      setErrorMessage(data.error);
      setIsLoading(false);
      return;
    }

    if (data?.success) {
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret: data.success.clientSecretID!,
        redirect: "if_required",
        confirmParams: {
          return_url: "http://localhost:3000/success",
          receipt_email: data.success.user as string,
        },
      });

      if (error) {
        setErrorMessage(error.message!);
        setIsLoading(false);
        return;
      } else {
        console.log("executing");

        setIsLoading(false);
        execute({
          status: "pending",
          total: totalPrice,
          paymentIntetnID: data.success.paymentIntentID,
          products: cart.map((item) => ({
            productID: item.id,
            variantID: item.variant.variantID,
            quantity: item.variant.quantity,
          })),
        });
      }
    }
  }
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        onLoadError={(error) => console.log(error.error.message)}
      />
      <AddressElement
        onLoadError={(error) => console.log(error.error.message)}
        options={{ mode: "shipping" }}
      />
      <Button
        className="  my-4 w-full"
        disabled={!stripe || !elements || isLoading}
      >
        {isLoading ? "processing..." : "Pay now"}
      </Button>
    </form>
  );
}
