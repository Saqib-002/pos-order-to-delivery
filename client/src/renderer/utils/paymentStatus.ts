export interface PaymentStatus {
  status: "PAID" | "UNPAID" | "PARTIAL" | "REFUNDED";
  totalPaid: number;
  remainingAmount: number;
  paymentBreakdown: Array<{ type: string; amount: number }>;
}

export const calculatePaymentStatus = (
  paymentType: string,
  totalAmount: number
): PaymentStatus => {
  if (
    !paymentType ||
    paymentType.trim() === "" ||
    paymentType.toLowerCase() === "pending"
  ) {
    return {
      status: "UNPAID",
      totalPaid: 0,
      remainingAmount: totalAmount,
      paymentBreakdown: [],
    };
  }

  if (paymentType.toLowerCase() === "refunded") {
    return {
      status: "REFUNDED",
      totalPaid: 0,
      remainingAmount: totalAmount,
      paymentBreakdown: [],
    };
  }

  const paymentBreakdown: Array<{ type: string; amount: number }> = [];
  let totalPaid = 0;

  try {
    // Support both ", " and ";" as separators
    const separators = /[,;]\s*/;
    const payments = paymentType.split(separators).filter(p => p.trim() !== "").map((payment) => {
      const [type, amount] = payment.split(":");
      const numericAmount = parseFloat(amount);

      if (isNaN(numericAmount)) {
        console.warn(`Invalid payment amount: ${amount}`);
        return { type: type.trim(), amount: 0 };
      }

      return { type: type.trim(), amount: numericAmount };
    });

    paymentBreakdown.push(...payments);
    totalPaid = Math.round(payments.reduce((sum, payment) => sum + payment.amount, 0) * 100) / 100;
  } catch (error) {
    console.error("Error parsing payment string:", paymentType, error);
    return {
      status: "UNPAID",
      totalPaid: 0,
      remainingAmount: totalAmount,
      paymentBreakdown: [],
    };
  }

  const roundedTotalAmount = Math.round(totalAmount * 100) / 100;
  const remainingAmount = Math.round((roundedTotalAmount - totalPaid) * 100) / 100;
  const tolerance = 0.01;

  let status: "PAID" | "UNPAID" | "PARTIAL";

  if (totalPaid <= 0) {
    status = "UNPAID";
  } else if (remainingAmount <= tolerance) {
    status = "PAID";
  } else {
    status = "PARTIAL";
  }

  return {
    status,
    totalPaid,
    remainingAmount: Math.max(0, remainingAmount),
    paymentBreakdown,
  };
};

export const getPaymentStatusStyle = (
  status: "PAID" | "UNPAID" | "PARTIAL"
) => {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-800 border-green-200";
    case "PARTIAL":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "UNPAID":
    default:
      return "bg-red-100 text-red-800 border-red-200";
  }
};
